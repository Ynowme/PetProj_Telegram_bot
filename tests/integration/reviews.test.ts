import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createReview } from "@/lib/reviews";

const RUN_ID = Date.now();
const userIds: string[] = [];
const reviewIds: string[] = [];

async function createGuest(label: string) {
  const user = await prisma.user.create({
    data: { name: `Vitest ${label}`, telegramId: `vitest-review-${RUN_ID}-${label}` },
  });
  userIds.push(user.id);
  return user;
}

afterAll(async () => {
  await prisma.review.deleteMany({ where: { id: { in: reviewIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

describe("createReview", () => {
  it("створює анонімний відгук без userId", async () => {
    const review = await createReview({ dishesRating: 5, serviceRating: 4, comment: "Дуже смачно!" });
    reviewIds.push(review.id);

    expect(review.userId).toBeNull();
    expect(review.dishesRating).toBe(5);
    expect(review.serviceRating).toBe(4);
    expect(review.comment).toBe("Дуже смачно!");
  });

  it("прив'язує відгук до залогіненого гостя, коли userId передано", async () => {
    const guest = await createGuest("attached");
    const review = await createReview({ dishesRating: 3, serviceRating: 3, userId: guest.id });
    reviewIds.push(review.id);

    expect(review.userId).toBe(guest.id);
  });

  it("лишається в БД, якщо акаунт гостя згодом видалили (onDelete: SetNull)", async () => {
    const guest = await createGuest("to-delete");
    const review = await createReview({ dishesRating: 2, serviceRating: 2, userId: guest.id });
    reviewIds.push(review.id);

    await prisma.user.delete({ where: { id: guest.id } });
    userIds.splice(userIds.indexOf(guest.id), 1);

    const after = await prisma.review.findUniqueOrThrow({ where: { id: review.id } });
    expect(after.userId).toBeNull();
  });

  it("зберігає необов'язкові контакти лише коли їх передано", async () => {
    const review = await createReview({ dishesRating: 4, serviceRating: 5, contactName: "Олена", contactPhone: "+380991234567" });
    reviewIds.push(review.id);

    expect(review.contactName).toBe("Олена");
    expect(review.contactPhone).toBe("+380991234567");
  });
});
