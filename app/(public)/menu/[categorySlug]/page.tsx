import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeMenuItem } from "@/lib/menu";
import { MenuItemCard } from "@/components/MenuItemCard";

// FR-002, FR-015: список позиций (под)категории; пустая категория — без ошибки.
export default async function MenuCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;

  const category = await prisma.menuCategory.findUnique({
    where: { slug: categorySlug },
    include: {
      parent: true,
      items: {
        include: { _count: { select: { likes: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!category) notFound();

  return (
    <main>
      <Link href="/menu" className="back-link">
        ← Меню{category.parent ? ` / ${category.parent.name}` : ""}
      </Link>
      <h1>{category.name}</h1>

      {category.items.length === 0 ? (
        <p className="text-muted">У цій категорії поки немає позицій.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {category.items.map((item) => (
            <MenuItemCard key={item.id} item={serializeMenuItem(item)} />
          ))}
        </div>
      )}
    </main>
  );
}
