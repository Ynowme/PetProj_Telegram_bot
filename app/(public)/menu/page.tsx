import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MenuSearch } from "@/components/MenuSearch";
import { getSiteContent } from "@/lib/site-content";

// FR-001: категорії верхнього рівня з підкатегоріями. FR-003: доступно без входу.
export default async function MenuPage() {
  const [categories, siteContent] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      include: { children: { orderBy: { order: "asc" } } },
    }),
    getSiteContent(),
  ]);

  return (
    <main>
      <h1>Меню</h1>

      <MenuSearch />

      <nav>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1.25rem" }}>
          {categories.map((category) => (
            <li key={category.id} className="category-section">
              <h2>{category.name}</h2>
              {category.children.length > 0 ? (
                <div className="category-grid">
                  {category.children.map((child) => (
                    <Link key={child.id} href={`/menu/${child.slug}`} className="category-block">
                      {child.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link href={`/menu/${category.slug}`} className="category-block">
                  Переглянути
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="category-grid" style={{ marginTop: "1.5rem" }}>
        <Link href="/menu/popular" className="category-block">
          ★ Популярне
        </Link>
      </div>

      {siteContent?.allergyDisclaimer && (
        <p className="text-muted" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
          {siteContent.allergyDisclaimer}
        </p>
      )}
    </main>
  );
}
