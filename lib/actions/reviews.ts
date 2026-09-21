"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000),
  targetUserId: z.string().optional(),
  propertyId: z.string().optional(),
  serviceJobId: z.string().optional(),
});

export async function createReview(data: z.infer<typeof reviewSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid review" };

  if (!parsed.data.targetUserId && !parsed.data.propertyId) {
    return { error: "Review needs a target user or property" };
  }

  if (parsed.data.serviceJobId) {
    const job = await prisma.serviceJob.findUnique({ where: { id: parsed.data.serviceJobId } });
    if (!job || job.customerId !== session.user.id || job.status !== "COMPLETED") {
      return { error: "You can only review completed jobs you booked" };
    }
  }

  await prisma.review.create({
    data: {
      authorId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      targetUserId: parsed.data.targetUserId,
      propertyId: parsed.data.propertyId,
      serviceJobId: parsed.data.serviceJobId,
    },
  });

  revalidatePath("/dashboard/jobs");
  revalidatePath("/artisans");
  if (parsed.data.propertyId) revalidatePath(`/properties/${parsed.data.propertyId}`);
  return { success: true };
}
