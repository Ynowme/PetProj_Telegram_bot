import Link from "next/link";
import { getActivePromoBanners } from "@/lib/promo-banners";

// FR-008 продовження: клік по банеру карусели (components/PromoCarousel.tsx) веде сюди —
// повний перелік активних акцій із фото та повним (не обрізаним) описом, той самий джерело
// даних (CastaPOS-адмінка через вебхук), просто без ліміту "один банер видно за раз".
export default async function PromotionsPage() {
  const banners = await getActivePromoBanners();

  return (
    <main className="page">
      <Link href="/" className="back-link">
        ← На головну
      </Link>
      <h1>Акції</h1>

      {banners.length === 0 ? (
        <p className="text-muted">Активних акцій поки немає — зазирніть пізніше.</p>
      ) : (
        <div className="promo-page__grid">
          {banners.map((banner) => (
            <article key={banner.id} className="promo-page__card">
              {banner.imageUrl && (
                <div className="promo-page__card-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element -- фото банера з CastaPOS-адмінки, довільний URL */}
                  <img src={banner.imageUrl} alt="" />
                </div>
              )}
              <div className="promo-page__card-body">
                <h2>{banner.title}</h2>
                {banner.description && <p>{banner.description}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
