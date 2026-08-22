import { Card } from "@heroui/react";
import { getSiteContent } from "@/lib/site-content";
import { MenuSearch } from "@/components/MenuSearch";

// FR-013, FR-023: адрес и часы работы в постоянно видимом виджете рядом с меню.
// Пошук винесено сюди (а не в /menu/page.tsx), щоб він був доступний на будь-якій
// сторінці розділу меню — і в категорії, і на "Популярне" — а не тільки на кореневій.
export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  const siteContent = await getSiteContent();

  return (
    <div className="mx-auto grid max-w-[1200px] items-start gap-6 px-4 py-8 md:grid-cols-[minmax(0,1fr)_280px] md:px-6">
      <div className="min-w-0">
        <MenuSearch />
        {children}
      </div>

      {siteContent && (
        <aside className="md:sticky md:top-24">
          <Card>
          <h2 className="mb-3 mt-0 text-base font-semibold text-foreground">Інформація про заклад</h2>
          <p className="mb-2 mt-0 text-sm">
            <a
              href={siteContent.addressMapUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="text-foreground transition hover:text-muted"
            >
              📍 {siteContent.address}
            </a>
          </p>
          <p className="m-0 text-sm text-muted">🕐 {siteContent.workingHours}</p>
          </Card>
        </aside>
      )}
    </div>
  );
}
