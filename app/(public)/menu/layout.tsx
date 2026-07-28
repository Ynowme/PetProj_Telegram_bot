import { getSiteContent } from "@/lib/site-content";
import { MenuSearch } from "@/components/MenuSearch";

// FR-013, FR-023: адрес и часы работы в постоянно видимом виджете рядом с меню.
// Пошук винесено сюди (а не в /menu/page.tsx), щоб він був доступний на будь-якій
// сторінці розділу меню — і в категорії, і на "Популярне" — а не тільки на кореневій.
export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  const siteContent = await getSiteContent();

  return (
    <div className="menu-layout">
      <div>
        <MenuSearch />
        {children}
      </div>

      {siteContent && (
        <aside className="menu-layout__sidebar">
          <h2 style={{ fontSize: "1rem", marginTop: 0 }}>Інформація про заклад</h2>
          <p>
            <a href={siteContent.addressMapUrl} target="_blank" rel="noreferrer">
              📍 {siteContent.address}
            </a>
          </p>
          <p style={{ margin: 0 }}>🕐 {siteContent.workingHours}</p>
        </aside>
      )}
    </div>
  );
}
