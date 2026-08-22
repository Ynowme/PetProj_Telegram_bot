import Link from "next/link";

// Єдиний стиль "хлібної крихти назад" для сторінок кабінету: тач-зона не менше 44px,
// приглушений колір, щоб не сперечатися із заголовком сторінки.
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground active:scale-[0.98]"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {children}
    </Link>
  );
}
