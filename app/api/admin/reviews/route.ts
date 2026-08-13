import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// Список відгуків гостей, найновіші перші — на відміну від service-requests тут немає статусу
// "очікує підтвердження"/дій підтвердити-відхилити: відгук не потребує обробки, лише перегляду.
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { id: true, name: true, telegramUsername: true, phone: true } } },
  });

  return NextResponse.json(
    reviews.map((review) => ({
      id: review.id,
      dishesRating: review.dishesRating,
      serviceRating: review.serviceRating,
      comment: review.comment,
      contactName: review.contactName,
      contactPhone: review.contactPhone,
      createdAt: review.createdAt,
      guest: review.user,
    })),
  );
}
