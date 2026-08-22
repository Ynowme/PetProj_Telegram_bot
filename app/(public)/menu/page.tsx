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
    <main className="grid min-w-0 gap-5">
      <h1 className="m-0 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Меню</h1>

      <MenuBrowser sections={sections} />

      {siteContent?.allergyDisclaimer && <p className="mt-6 text-sm text-muted">{siteContent.allergyDisclaimer}</p>}
    </main>
  );
}
