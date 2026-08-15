import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// FR-002, FR-015: позиції категорії тепер показуються прямо на /menu (MenuBrowser,
// T042-редизайн v2) — цей маршрут лишився заради старих посилань/закладок і
// веде на відповідну секцію через hash.
export default async function MenuCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;

  const category = await prisma.menuCategory.findUnique({ where: { slug: categorySlug } });
  if (!category) notFound();

  redirect(`/menu#${categorySlug}`);
}
