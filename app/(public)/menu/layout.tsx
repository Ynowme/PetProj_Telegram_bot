import { getSiteContent } from "@/lib/site-content";

// FR-013, FR-023: адрес и часы работы в постоянно видимом виджете рядом с меню.
export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  const siteContent = await getSiteContent();

  return (
    <div className="menu-layout">
      <div>{children}</div>

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
