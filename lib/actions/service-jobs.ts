"use server";

import { revalidatePath } from "next/cache";
import { EscrowPurpose, EscrowStatus, JobStatus, JobUrgency } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createJobSchema = z.object({
  artisanId: z.string().min(1),
  propertyId: z.string().optional(),
  description: z.string().min(10).max(2000),
  urgency: z.enum(["NORMAL", "EMERGENCY"]).default("NORMAL"),
  estimatedHours: z.coerce.number().positive().max(48).default(2),
});

export async function createServiceJob(data: z.infer<typeof createJobSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  if (!["USER", "AGENT"].includes(session.user.role)) {
    return { error: "Only users and agents can book artisans" };
  }

  const parsed = createJobSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid job" };

  const artisan = await prisma.user.findUnique({
    where: { id: parsed.data.artisanId },
    include: { serviceProfile: true },
  });
  if (!artisan || artisan.role !== "ARTISAN" || !artisan.serviceProfile) {
    return { error: "Artisan not found" };
  }
  if (!artisan.serviceProfile.available) {
    return { error: "Artisan is not available right now" };
  }

  const priceEstimate = Math.round(
    artisan.serviceProfile.hourlyRate * parsed.data.estimatedHours,
  );
  const etaMinutes =
    parsed.data.urgency === "EMERGENCY"
      ? 45
      : Math.round(parsed.data.estimatedHours * 60);

  const job = await prisma.serviceJob.create({
    data: {
      customerId: session.user.id,
      artisanId: artisan.id,
      propertyId: parsed.data.propertyId,
      description: parsed.data.description,
      urgency: parsed.data.urgency as JobUrgency,
      status: JobStatus.QUOTED,
      priceEstimate,
      etaMinutes,
    },
  });

  await prisma.escrowPayment.create({
    data: {
      amount: priceEstimate,
      status: EscrowStatus.HELD,
      purpose: EscrowPurpose.ARTISAN,
      payerId: session.user.id,
      serviceJobId: job.id,
      note: "Artisan job held in escrow until completion",
    },
  });

  revalidatePath("/dashboard/jobs");
  revalidatePath("/artisans");
  return { success: true, jobId: job.id, priceEstimate, etaMinutes };
}

export async function updateServiceJobStatus(
  jobId: string,
  status: "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const job = await prisma.serviceJob.findUnique({ where: { id: jobId } });
  if (!job) return { error: "Job not found" };

  const isArtisan = job.artisanId === session.user.id;
  const isCustomer = job.customerId === session.user.id;
  if (!isArtisan && !(isCustomer && status === "CANCELLED")) {
    return { error: "Not allowed" };
  }

  await prisma.serviceJob.update({
    where: { id: jobId },
    data: {
      status: status as JobStatus,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });

  if (status === "COMPLETED") {
    const held = await prisma.escrowPayment.findFirst({
      where: { serviceJobId: jobId, status: EscrowStatus.HELD },
    });
    if (held) {
      await prisma.escrowPayment.update({
        where: { id: held.id },
        data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
      });
    }
  }

  if (status === "CANCELLED") {
    const held = await prisma.escrowPayment.findFirst({
      where: { serviceJobId: jobId, status: EscrowStatus.HELD },
    });
    if (held) {
      await prisma.escrowPayment.update({
        where: { id: held.id },
        data: { status: EscrowStatus.REFUNDED, refundedAt: new Date() },
      });
    }
  }

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getCustomerJobs() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.serviceJob.findMany({
    where: { customerId: session.user.id },
    include: {
      artisan: { select: { id: true, name: true, email: true, serviceProfile: true } },
      property: { select: { id: true, title: true } },
      escrowPayments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getArtisanJobs() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.serviceJob.findMany({
    where: { artisanId: session.user.id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true } },
      escrowPayments: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listArtisans(opts?: {
  availableOnly?: boolean;
  categorySlug?: string;
  subcategorySlug?: string;
  stateCode?: string;
  areaName?: string;
  q?: string;
}) {
  try {
    const artisans = await prisma.user.findMany({
      where: {
        role: "ARTISAN",
        active: true,
        kycStatus: "VERIFIED",
        ...(opts?.stateCode ? { stateCode: opts.stateCode } : {}),
        ...(opts?.areaName ? { areaName: opts.areaName } : {}),
        serviceProfile: {
          is: {
            ...(opts?.availableOnly ? { available: true } : {}),
          },
        },
        ...(opts?.categorySlug || opts?.subcategorySlug
          ? {
              artisanServices: {
                some: {
                  subcategory: {
                    ...(opts?.subcategorySlug ? { slug: opts.subcategorySlug } : {}),
                    ...(opts?.categorySlug
                      ? { category: { slug: opts.categorySlug } }
                      : {}),
                  },
                },
              },
            }
          : {}),
      },
      include: {
        serviceProfile: true,
        reviewsReceived: { select: { rating: true } },
        artisanServices: {
          include: {
            subcategory: { include: { category: true } },
          },
        },
      },
    });

    const q = opts?.q?.trim().toLowerCase();
    const filtered = q
      ? artisans.filter((a) => {
          const trades = a.artisanServices
            .map((s) => `${s.subcategory.name} ${s.subcategory.category.name}`)
            .join(" ");
          const hay =
            `${a.name ?? ""} ${a.email} ${a.serviceProfile?.trade ?? ""} ${a.serviceProfile?.bio ?? ""} ${a.areaName ?? ""} ${trades}`.toLowerCase();
          return hay.includes(q);
        })
      : artisans;

    // Tier 2/3 (STANDARD/ENHANCED) bubble up in directory sort
    const rank = { ENHANCED: 0, STANDARD: 1, BASIC: 2 } as const;
    return filtered.sort((a, b) => {
      const ra = rank[a.kycLevel] ?? 2;
      const rb = rank[b.kycLevel] ?? 2;
      if (ra !== rb) return ra - rb;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  } catch {
    // Avoid crashing marketing pages when Postgres is briefly unavailable
    return [];
  }
}

export async function getArtisanById(id: string) {
  return prisma.user.findFirst({
    where: { id, role: "ARTISAN" },
    include: {
      serviceProfile: true,
      reviewsReceived: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}
