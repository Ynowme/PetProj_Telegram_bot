import { prisma } from "@/lib/prisma";

export type CreateReviewParams = {
  dishesRating: number;
  serviceRating: number;
  comment?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  userId?: string | null;
};

// Створює відгук гостя (app/(public)/feedback) — userId необов'язковий, форма публічна й не
// вимагає входу (app/api/reviews/route.ts підтягує його з сесії сам, якщо вона є).
export async function createReview(params: CreateReviewParams) {
  return prisma.review.create({
    data: {
      dishesRating: params.dishesRating,
      serviceRating: params.serviceRating,
      comment: params.comment?.trim() || null,
      contactName: params.contactName?.trim() || null,
      contactPhone: params.contactPhone?.trim() || null,
      userId: params.userId ?? null,
    },
  });
}
