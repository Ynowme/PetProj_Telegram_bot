import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getActivePromoBanners = cache(() =>
  prisma.promoBanner.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, title: true, description: true },
  }),
);
