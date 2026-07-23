import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Shared by the layout, footer, and public pages. React cache deduplicates this
// request during a single server render without keeping mutable data between requests.
export const getSiteContent = cache(() =>
  prisma.siteContent.findUnique({ where: { id: "default" } }),
);
