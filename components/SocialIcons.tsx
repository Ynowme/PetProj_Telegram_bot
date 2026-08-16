// Спільні іконки соцмереж — раніше жили лише в SiteFooter.tsx, тепер той самий набір
// показує й SiteHeaderNav.tsx (мобільна шухляда, reference: easy.choiceqr.com).
export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M14 8.5h-1.5a1.5 1.5 0 0 0-1.5 1.5v2h3l-.4 2.5h-2.6V21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12h5.5a5.5 5.5 0 1 1-1.7-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="m7.5 12.2 9.8-4.4-3 9.9-2.9-2.6-2 1.9-.1-2.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
