import Link from "next/link";
import { EmptyState } from "@heroui/react";
import { getActivePromoBanners } from "@/lib/promo-banners";

// FR-008 продовження: клік по банеру карусели (components/PromoCarousel.tsx) веде сюди —
// повний перелік активних акцій із фото та повним (не обрізаним) описом, той самий джерело
// даних (CastaPOS-адмінка через вебхук), просто без ліміту "один банер видно за раз".
export default async function PromotionsPage() {
  const banners = await getActivePromoBanners();

  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      <Link href="/" className="mb-4 inline-flex min-h-11 items-center text-sm text-muted transition hover:text-foreground">
        ← На головну
      </Link>
      <h1 className="mb-6 mt-0 text-3xl font-semibold tracking-tight text-foreground">Акції</h1>

      {banners.length === 0 ? (
        <EmptyState className="rounded-2xl border border-dashed border-border py-10 text-center">
          Активних акцій поки немає. Зазирніть пізніше.
        </EmptyState>
      ) : (
        <div className="grid gap-5">
          {banners.map((banner) => (
            <article key={banner.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
              {banner.imageUrl && (
                <div className="relative aspect-video w-full bg-surface-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element -- фото банера з CastaPOS-адмінки, довільний URL */}
                  <img src={banner.imageUrl} alt="" className="size-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <h2 className="mb-2 mt-0 text-xl font-semibold text-foreground">{banner.title}</h2>
                {banner.description && <p className="m-0 text-sm leading-6 text-muted">{banner.description}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
