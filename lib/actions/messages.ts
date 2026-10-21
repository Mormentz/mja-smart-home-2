"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  attachmentPreviewLabel,
  type ChatAttachment,
} from "@/lib/chat-attachments";

const attachmentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.enum(["IMAGE", "DOCUMENT", "AUDIO"]),
    url: z.string().min(1),
    name: z.string().min(1),
    mime: z.string().min(1),
    size: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal("PROPERTY"),
    propertyId: z.string().min(1),
  }),
]);

const messageSchema = z.object({
  recipientId: z.string().min(1),
  propertyId: z.string().optional(),
  content: z.string().max(2000).default(""),
  attachments: z.array(attachmentSchema).max(5).default([]),
});

const messageInclude = {
  sender: { select: { id: true, name: true, email: true, role: true } },
  recipient: { select: { id: true, name: true, email: true, role: true } },
  property: {
    select: {
      id: true,
      title: true,
      location: true,
      price: true,
      currency: true,
      type: true,
      image: true,
    },
  },
} as const;

export async function sendMessage(data: {
  recipientId: string;
  propertyId?: string;
  content?: string;
  attachments?: ChatAttachment[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to send messages" };
  }

  const parsed = messageSchema.safeParse({
    ...data,
    content: data.content ?? "",
    attachments: data.attachments ?? [],
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid message" };
  }

  const content = parsed.data.content.trim();
  const attachments = parsed.data.attachments as ChatAttachment[];
  if (!content && attachments.length === 0) {
    return { error: "Message cannot be empty" };
  }

  if (parsed.data.recipientId === session.user.id) {
    return { error: "You cannot message yourself" };
  }

  const recipient = await prisma.user.findUnique({ where: { id: parsed.data.recipientId } });
  if (!recipient) {
    return { error: "Recipient not found" };
  }

  for (const a of attachments) {
    if (a.kind !== "PROPERTY") {
      if (!a.url.startsWith("/uploads/chat/")) {
        return { error: "Invalid attachment" };
      }
    } else if (a.kind === "PROPERTY") {
      if (session.user.role === "AGENT") {
        const owned = await prisma.property.findFirst({
          where: { id: a.propertyId, ownerId: session.user.id },
        });
        if (!owned) return { error: "Property not found or not yours" };
      } else if (session.user.role === "ADMIN") {
        const exists = await prisma.property.findUnique({ where: { id: a.propertyId } });
        if (!exists) return { error: "Property not found" };
      } else {
        // Users may only pin the listing they are messaging about
        if (!parsed.data.propertyId || a.propertyId !== parsed.data.propertyId) {
          return { error: "You can only reference this conversation’s property" };
        }
        const exists = await prisma.property.findUnique({ where: { id: a.propertyId } });
        if (!exists) return { error: "Property not found" };
      }
    }
  }

  const displayContent =
    content ||
    attachments.map(attachmentPreviewLabel).join(" · ") ||
    "Attachment";

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      recipientId: parsed.data.recipientId,
      propertyId: parsed.data.propertyId,
      content: displayContent,
      attachments: attachments as unknown as Prisma.InputJsonValue,
    },
    include: messageInclude,
  });

  revalidatePath("/dashboard/messages");
  return { success: true, message };
}

export async function getUserMessages() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.message.findMany({
    where: {
      OR: [{ senderId: session.user.id }, { recipientId: session.user.id }],
    },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  });
}

export type ConversationProperty = {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  type: string;
  image: string;
};

export type Conversation = {
  counterpartId: string;
  counterpartName: string;
  counterpartEmail: string;
  /** Unique listings discussed in this person-thread (newest first). */
  properties: ConversationProperty[];
  lastMessage: string;
  lastAt: Date;
  unread: number;
  messages: Awaited<ReturnType<typeof getUserMessages>>;
};

export async function getConversations(): Promise<Conversation[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const messages = await getUserMessages();
  const map = new Map<string, Conversation>();

  for (const m of messages) {
    const counterpart = m.senderId === session.user.id ? m.recipient : m.sender;
    const key = counterpart.id;
    const existing = map.get(key);
    const unreadInc =
      m.recipientId === session.user.id && !m.readAt ? 1 : 0;

    if (!existing) {
      map.set(key, {
        counterpartId: counterpart.id,
        counterpartName: counterpart.name ?? counterpart.email,
        counterpartEmail: counterpart.email,
        properties: m.property ? [m.property] : [],
        lastMessage: m.content,
        lastAt: m.createdAt,
        unread: unreadInc,
        messages: [m],
      });
    } else {
      existing.messages.push(m);
      existing.lastMessage = m.content;
      existing.lastAt = m.createdAt;
      existing.unread += unreadInc;
      if (m.property && !existing.properties.some((p) => p.id === m.property!.id)) {
        existing.properties.unshift(m.property);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export async function getAgentListingsForChat() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "AGENT") return [];
  return prisma.property.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      title: true,
      location: true,
      price: true,
      currency: true,
      type: true,
      image: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });
}

export async function getPropertiesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.property.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      location: true,
      price: true,
      currency: true,
      type: true,
      image: true,
    },
  });
}

export async function markThreadRead(counterpartId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.message.updateMany({
    where: {
      senderId: counterpartId,
      recipientId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { success: true };
}

export async function markMessageRead(messageId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.recipientId !== session.user.id) {
    return { error: "Message not found" };
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard/messages");
  return { success: true };
}

export async function updateServiceProfile(data: {
  trade: string;
  bio: string;
  available?: boolean;
  hourlyRate?: number;
  serviceArea?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "ARTISAN") {
    return { error: "Only artisans can update service profiles" };
  }

  const trade = data.trade.trim();
  const bio = data.bio.trim();
  if (trade.length < 2 || bio.length < 10) {
    return { error: "Please provide a trade and bio (min 10 characters)" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { serviceProfile: true },
  });

  // Tier 1 KYC (user.kycStatus VERIFIED) required before going available / listing
  const tier1Ok = user?.kycStatus === "VERIFIED";
  let available = data.available;
  if (available && !tier1Ok) {
    available = false;
  }

  await prisma.serviceProfile.upsert({
    where: { userId: session.user.id },
    update: {
      trade,
      bio,
      available,
      hourlyRate: data.hourlyRate,
      serviceArea: data.serviceArea,
    },
    create: {
      userId: session.user.id,
      trade,
      bio,
      available: available ?? false,
      hourlyRate: data.hourlyRate ?? 5000,
      serviceArea: data.serviceArea,
    },
  });

  if (!tier1Ok) {
    await prisma.serviceProfile.update({
      where: { userId: session.user.id },
      data: { available: false },
    });
  }

  revalidatePath("/dashboard/services");
  revalidatePath("/artisans");
  return { success: true };
}

export async function getServiceProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return prisma.serviceProfile.findUnique({ where: { userId: session.user.id } });
}
