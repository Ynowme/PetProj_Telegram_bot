import Link from "next/link";
import { getMenuCategories } from "@/lib/menu";
import { MenuSearch } from "@/components/MenuSearch";
import { getSiteContent } from "@/lib/site-content";

// FR-001: категорії верхнього рівня з підкатегоріями. FR-003: доступно без входу.
export default async function MenuPage() {
  const [categories, siteContent] = await Promise.all([getMenuCategories(), getSiteContent()]);

  return (
    <main className="menu-page">
      <h1>Меню</h1>

      <MenuSearch />

      <div className="category-grid" style={{ marginTop: "1rem" }}>
        <Link href="/menu/popular" className="category-block">
          ★ Популярне
        </Link>
      </div>

      <nav>
        <ul className="menu-list">
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

      {siteContent?.allergyDisclaimer && (
        <p className="text-muted" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
          {siteContent.allergyDisclaimer}
        </p>
      )}
    </main>
  );
}
