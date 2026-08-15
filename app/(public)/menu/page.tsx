import { getMenuSections } from "@/lib/menu";
import { getSiteContent } from "@/lib/site-content";
import { MenuBrowser } from "@/components/MenuBrowser";

// FR-001: категорії верхнього рівня з підкатегоріями. FR-003: доступно без входу.
// Пошук тепер рендериться в menu/layout.tsx (спільний для всіх сторінок розділу).
// Одна безперервна сторінка зі scrollspy-навігацією замість переходів по категоріях
// (T042-редизайн v2) — див. components/MenuBrowser.tsx.
export default async function MenuPage() {
  const [sections, siteContent] = await Promise.all([getMenuSections(), getSiteContent()]);

  return (
    <main className="menu-page">
      <h1>Меню</h1>

      <MenuBrowser sections={sections} />

      {siteContent?.allergyDisclaimer && (
        <p className="text-muted" style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
          {siteContent.allergyDisclaimer}
        </p>
      )}
    </main>
  );
}
