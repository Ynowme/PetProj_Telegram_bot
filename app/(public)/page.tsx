import Link from "next/link";
import { buttonVariants, Card } from "@heroui/react";
import { auth } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";

// FR-014: короткий опис концепції закладу на головній сторінці.
export default async function HomePage() {
  const [siteContent, session] = await Promise.all([getSiteContent(), auth()]);

  return (
    <main>
      <section
        aria-labelledby="hero-heading"
        className="relative flex min-h-[62vh] items-end bg-cover bg-center"
        style={{ backgroundImage: `url(${siteContent?.heroImageUrl ?? "/hero-bar.jpg"})` }}
      >
        {/* Затемнення знизу — текст hero читається на будь-якому фото. */}
        <div aria-hidden className="absolute inset-0 bg-linear-to-b from-background/10 via-background/55 to-background/95" />
        <div className="relative mx-auto w-full max-w-[720px] px-6 pb-12 pt-16 text-center">
          <p className="m-0 text-sm uppercase tracking-[0.18em] text-muted">{siteContent?.venueName ?? "Castaneda Smoking Bar"}</p>
          <h1 id="hero-heading" className="mb-0 mt-2.5 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
            {siteContent?.tagline ?? "Місце, куди хочеться повертатися знову і знову"}
          </h1>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/menu" className={buttonVariants({ variant: "primary", size: "lg" })}>
              Переглянути меню
            </Link>
            <Link href={session?.user ? "/account" : "/login"} className={buttonVariants({ variant: "secondary", size: "lg" })}>
              {session?.user ? "Особистий кабінет" : "Увійти"}
            </Link>
          </div>
        </div>
      </section>

      {siteContent?.aboutText && (
        <section aria-label="Про заклад" className="mx-auto max-w-[720px] px-6 pb-8 pt-8">
          <p className="m-0 text-center text-lg leading-7 text-muted">{siteContent.aboutText}</p>
        </section>
      )}

      {siteContent && (
        <section aria-label="Адреса та години роботи" className="mx-auto mb-12 w-full max-w-[420px] px-6">
          <Card className="grid gap-2 text-center">
            <a
              href={siteContent.addressMapUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="text-foreground transition hover:text-muted"
            >
              📍 {siteContent.address}
            </a>
            <p className="m-0 text-muted">🕐 {siteContent.workingHours}</p>
          </Card>
        </section>
      )}
    </main>
  );
}
