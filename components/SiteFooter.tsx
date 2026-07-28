import { getSiteContent } from "@/lib/site-content";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M14 8.5h-1.5a1.5 1.5 0 0 0-1.5 1.5v2h3l-.4 2.5h-2.6V21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12h5.5a5.5 5.5 0 1 1-1.7-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: "0.6rem" }}>
            {siteContent.instagramUrl && (
              <li>
                <a href={siteContent.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="social-icon">
                  <InstagramIcon />
                </a>
              </li>
            )}
            {siteContent.facebookUrl && (
              <li>
                <a href={siteContent.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" className="social-icon">
                  <FacebookIcon />
                </a>
              </li>
            )}
            {siteContent.googleUrl && (
              <li>
                <a href={siteContent.googleUrl} target="_blank" rel="noreferrer" aria-label="Google" className="social-icon">
                  <GoogleIcon />
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
