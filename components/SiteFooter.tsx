import { getSiteContent } from "@/lib/site-content";

// FR-012, FR-013: телефон (клікабельний), соцмережі, вбудована карта.
export async function SiteFooter() {
  const siteContent = await getSiteContent();
  if (!siteContent) return null;

  const telHref = `tel:${siteContent.phone.replace(/[^+\d]/g, "")}`;

  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 1.5rem", marginTop: "3rem" }}>
      <div className="site-footer__grid">
        <div>
          <h3 style={{ marginTop: 0 }}>Контактні дані</h3>
          <p>{siteContent.address}</p>
          <p>
            <a href={telHref}>📞 {siteContent.phone}</a>
          </p>
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>Ми в соцмережах</h3>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.3rem" }}>
            {siteContent.instagramUrl && (
              <li>
                <a href={siteContent.instagramUrl} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            )}
            {siteContent.facebookUrl && (
              <li>
                <a href={siteContent.facebookUrl} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
            )}
            {siteContent.googleUrl && (
              <li>
                <a href={siteContent.googleUrl} target="_blank" rel="noreferrer">
                  Google
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>На карті</h3>
          <iframe
            src={siteContent.mapEmbedUrl}
            title="Карта розташування закладу"
            width="100%"
            height="150"
            style={{ border: "1px solid var(--border)", borderRadius: 8 }}
            loading="lazy"
          />
          {siteContent.addressMapUrl && (
            <a
              href={siteContent.addressMapUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "0.6rem",
                padding: "0.6rem 1rem",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "inherit",
              }}
            >
              <span aria-hidden>🧭</span>
              Отримати розташування
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
