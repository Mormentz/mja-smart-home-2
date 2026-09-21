"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  recipientId: z.string().min(1),
  propertyId: z.string().optional(),
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

export async function sendMessage(data: { recipientId: string; propertyId?: string; content: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to send messages" };
  }

  const parsed = messageSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid message" };
  }

  if (parsed.data.recipientId === session.user.id) {
    return { error: "You cannot message yourself" };
  }

  const recipient = await prisma.user.findUnique({ where: { id: parsed.data.recipientId } });
  if (!recipient) {
    return { error: "Recipient not found" };
  }

  await prisma.message.create({
    data: {
      senderId: session.user.id,
      recipientId: parsed.data.recipientId,
      propertyId: parsed.data.propertyId,
      content: parsed.data.content,
    },
  });

  revalidatePath("/dashboard/messages");
  return { success: true };
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
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      recipient: { select: { id: true, name: true, email: true, role: true } },
      property: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type Conversation = {
  counterpartId: string;
  counterpartName: string;
  counterpartEmail: string;
  propertyId?: string | null;
  propertyTitle?: string | null;
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
    const key = `${counterpart.id}:${m.propertyId ?? "none"}`;
    const existing = map.get(key);
    const unreadInc =
      m.recipientId === session.user.id && !m.readAt ? 1 : 0;

    if (!existing) {
      map.set(key, {
        counterpartId: counterpart.id,
        counterpartName: counterpart.name ?? counterpart.email,
        counterpartEmail: counterpart.email,
        propertyId: m.propertyId,
        propertyTitle: m.property?.title,
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
    }
  }

  return Array.from(map.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

export async function markThreadRead(counterpartId: string, propertyId?: string | null) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.message.updateMany({
    where: {
      senderId: counterpartId,
      recipientId: session.user.id,
      propertyId: propertyId ?? null,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard/messages");
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

  await prisma.serviceProfile.upsert({
    where: { userId: session.user.id },
    update: {
      trade,
      bio,
      available: data.available,
      hourlyRate: data.hourlyRate,
      serviceArea: data.serviceArea,
    },
    create: {
      userId: session.user.id,
      trade,
      bio,
      available: data.available ?? true,
      hourlyRate: data.hourlyRate ?? 50,
      serviceArea: data.serviceArea,
    },
  });

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
