import { getSiteContent } from "@/lib/site-content";
import { DAY_KEYS, type WorkingHoursByDay } from "@/lib/site-content-sync";
import { FacebookIcon, GoogleIcon, InstagramIcon, SocialIconLink, TelegramIcon } from "@/components/SocialIcons";

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
    <table className="border-collapse text-sm tabular-nums">
      <tbody>
        {DAY_KEYS.map((day) => {
          const hours = schedule[day];
          const isToday = day === today;
          const cellClass = isToday ? "font-semibold text-foreground" : "text-muted";
          return (
            <tr key={day}>
              <td className={`pr-3 ${cellClass}`}>{DAY_LABEL[day]}</td>
              <td className={cellClass}>{hours ? `${hours.open}–${hours.close}` : "вихідний"}</td>
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

  const socialLinks = [
    { href: siteContent.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: siteContent.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: siteContent.googleUrl, label: "Google", Icon: GoogleIcon },
    { href: siteContent.telegramUrl, label: "Telegram", Icon: TelegramIcon },
  ].filter((social): social is { href: string; label: string; Icon: typeof InstagramIcon } => Boolean(social.href));

  const legalLinks = [
    { href: "/privacy-policy", label: "Політика конфіденційності", enabled: Boolean(siteContent.privacyPolicyText) },
    { href: "/terms-of-use", label: "Умови користування", enabled: Boolean(siteContent.termsOfUseText) },
    { href: "/cookie-policy", label: "Політика cookie", enabled: Boolean(siteContent.cookiePolicyText) },
  ].filter((link) => link.enabled);

  return (
    <footer className="mt-12 border-t border-border px-6 py-8">
      <div className="mx-auto grid max-w-[1200px] gap-6 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <h3 className="mb-3 mt-0 text-base font-semibold text-foreground">Контактні дані</h3>
          <p className="mb-2 mt-0 text-sm text-muted">{siteContent.address}</p>
          <p className="mb-3 mt-0 text-sm">
            <a href={telHref} className="text-foreground transition hover:text-muted">
              📞 {siteContent.phone}
            </a>
          </p>
          {schedule && <WorkingHoursTable schedule={schedule} />}
        </div>

        <div>
          <h3 className="mb-3 mt-0 text-base font-semibold text-foreground">Ми в соцмережах</h3>
          <ul className="m-0 flex list-none gap-2.5 p-0">
            {socialLinks.map(({ href, label, Icon }) => (
              <li key={label}>
                <SocialIconLink href={href} label={label}>
                  <Icon />
                </SocialIconLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 mt-0 text-base font-semibold text-foreground">На карті</h3>
          <iframe
            src={siteContent.mapEmbedUrl}
            title="Карта розташування закладу"
            width="100%"
            height="150"
            loading="lazy"
            className="rounded-lg border border-border"
          />
          {siteContent.addressMapUrl && (
            <a
              href={siteContent.addressMapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground transition hover:bg-surface-hover active:scale-[0.98]"
            >
              <span aria-hidden>🧭</span>
              Отримати розташування
            </a>
          )}
        </div>
      </div>

      {legalLinks.length > 0 && (
        <div className="mx-auto mt-6 flex max-w-[1200px] flex-wrap gap-4 border-t border-separator pt-6 text-sm">
          {legalLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-muted transition hover:text-foreground">
              {link.label}
            </a>
          ))}
        </div>
      )}
    </footer>
  );
}
