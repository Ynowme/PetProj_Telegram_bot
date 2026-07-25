import { getSiteContent } from "@/lib/site-content";

// FR-014: короткий опис концепції закладу на головній сторінці.
export default async function HomePage() {
  const siteContent = await getSiteContent();

  return (
    <main>
      <div
        style={{
          position: "relative",
          minHeight: "62vh",
          display: "flex",
          alignItems: "flex-end",
          backgroundImage: "url(/hero-bar.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10, 10, 12, 0.1) 0%, rgba(10, 10, 12, 0.55) 55%, rgba(10, 10, 12, 0.95) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 720,
            margin: "0 auto",
            padding: "4rem 1.5rem 3rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--foreground-muted)",
            }}
          >
            Castaneda Smoking Bar
          </p>
          <h1
            style={{
              margin: "0.6rem 0 0",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 6vw, 3.25rem)",
              lineHeight: 1.15,
            }}
          >
            Місце, куди хочеться повертатися
          </h1>
        </div>
      </div>

      {siteContent?.aboutText && (
        <p
          style={{
            maxWidth: 720,
            margin: "2rem auto 0",
            padding: "0 1.5rem 2rem",
            textAlign: "center",
            fontSize: "1.05rem",
            color: "var(--foreground-muted)",
          }}
        >
          {siteContent.aboutText}
        </p>
      )}
    </main>
  );
}
