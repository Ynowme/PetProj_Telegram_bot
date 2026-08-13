import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";

// FR-014: короткий опис концепції закладу на головній сторінці.
export default async function HomePage() {
  const [siteContent, session] = await Promise.all([getSiteContent(), auth()]);

  return (
    <main>
      <div
        style={{
          position: "relative",
          minHeight: "62vh",
          display: "flex",
          alignItems: "flex-end",
          backgroundImage: `url(${siteContent?.heroImageUrl ?? "/hero-bar.jpg"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
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
            {siteContent?.venueName ?? "Castaneda Smoking Bar"}
          </p>
          <h1
            style={{
              margin: "0.6rem 0 0",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 6vw, 3.25rem)",
              lineHeight: 1.15,
            }}
          >
            {siteContent?.tagline ?? "Місце, куди хочеться повертатися знову і знову"}
          </h1>

          <div className="hero-cta">
            <Link href="/menu" className="pill pill--accent">
              Переглянути меню
            </Link>
            <Link href={session?.user ? "/account" : "/login"} className="pill">
              {session?.user ? "Особистий кабінет" : "Увійти"}
            </Link>
          </div>
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

      {siteContent && (
        <div
          className="panel"
          style={{
            maxWidth: 420,
            margin: "0 auto 3rem",
            textAlign: "center",
            display: "grid",
            gap: "0.5rem",
          }}
        >
          <a href={siteContent.addressMapUrl} target="_blank" rel="noreferrer">
            📍 {siteContent.address}
          </a>
          <p style={{ margin: 0, color: "var(--foreground-muted)" }}>🕐 {siteContent.workingHours}</p>
        </div>
      )}
    </main>
  );
}
