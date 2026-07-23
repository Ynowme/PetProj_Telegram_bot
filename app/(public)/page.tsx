import { getSiteContent } from "@/lib/site-content";

// FR-014: короткий опис концепції закладу на головній сторінці.
export default async function HomePage() {
  const siteContent = await getSiteContent();

  return (
    <main
      style={{
        padding: "5rem 1.5rem",
        maxWidth: 720,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "3rem", margin: 0 }}>Бар</h1>
      {siteContent?.aboutText && (
        <p
          style={{
            fontSize: "1.15rem",
            marginTop: "1.5rem",
            color: "var(--foreground-muted)",
          }}
        >
          {siteContent.aboutText}
        </p>
      )}
    </main>
  );
}
