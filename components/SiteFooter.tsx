import { getSiteContent } from "@/lib/site-content";
import { DAY_KEYS, type WorkingHoursByDay } from "@/lib/site-content-sync";

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

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="m7.5 12.2 9.8-4.4-3 9.9-2.9-2.6-2 1.9-.1-2.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DAY_LABEL: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Нд",
};

const WEEKDAY_TO_KEY: Record<string, (typeof DAY_KEYS)[number]> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

// Сервер рендерить у своїй таймзоні (UTC на Vercel), а заклад — у Europe/Kyiv: простий
// new Date().getDay() підсвічував би вчорашній день щоночі з 00:00 до 02:00-03:00 за Києвом
// (різниця UTC+2/+3 залежно від DST). Intl.DateTimeFormat із явною таймзоною рахує правильно
// в обидва боки переведення стрілок, без нової залежності.
function todayKey(): (typeof DAY_KEYS)[number] {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Kyiv", weekday: "short" }).format(new Date());
  return WEEKDAY_TO_KEY[weekday] ?? "mon";
}

function WorkingHoursTable({ schedule }: { schedule: WorkingHoursByDay }) {
  const today = todayKey();
  return (
    <table style={{ borderCollapse: "collapse", fontSize: "0.9rem" }}>
      <tbody>
        {DAY_KEYS.map((day) => {
          const hours = schedule[day];
          const isToday = day === today;
          return (
            <tr key={day} style={{ fontWeight: isToday ? 600 : 400 }}>
              <td style={{ paddingRight: "0.75rem", color: isToday ? "var(--foreground)" : "var(--foreground-muted)" }}>{DAY_LABEL[day]}</td>
              <td style={{ color: isToday ? "var(--foreground)" : "var(--foreground-muted)" }}>{hours ? `${hours.open}–${hours.close}` : "вихідний"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// FR-012, FR-013: телефон (клікабельний), соцмережі, вбудована карта.
export async function SiteFooter() {
  const siteContent = await getSiteContent();
  if (!siteContent) return null;

  const telHref = `tel:${siteContent.phone.replace(/[^+\d]/g, "")}`;
  const schedule = siteContent.workingHoursByDay as WorkingHoursByDay | null;

  const legalLinks = [
    { href: "/privacy-policy", label: "Політика конфіденційності", enabled: Boolean(siteContent.privacyPolicyText) },
    { href: "/terms-of-use", label: "Умови користування", enabled: Boolean(siteContent.termsOfUseText) },
    { href: "/cookie-policy", label: "Політика cookie", enabled: Boolean(siteContent.cookiePolicyText) },
  ].filter((link) => link.enabled);

  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 1.5rem", marginTop: "3rem" }}>
      <div className="site-footer__grid">
        <div>
          <h3 style={{ marginTop: 0 }}>Контактні дані</h3>
          <p>{siteContent.address}</p>
          <p>
            <a href={telHref}>📞 {siteContent.phone}</a>
          </p>
          {schedule && <WorkingHoursTable schedule={schedule} />}
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
            {siteContent.telegramUrl && (
              <li>
                <a href={siteContent.telegramUrl} target="_blank" rel="noreferrer" aria-label="Telegram" className="social-icon">
                  <TelegramIcon />
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

      {legalLinks.length > 0 && (
        <div
          style={{
            maxWidth: 1200,
            margin: "1.5rem auto 0",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.85rem",
          }}
        >
          {legalLinks.map((link) => (
            <a key={link.href} href={link.href} style={{ color: "var(--foreground-muted)" }}>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </footer>
  );
}
