import type { ReactNode } from "react";
import { EmptyState } from "@heroui/react";

// Обгортка над HeroUI EmptyState (той самий патерн, що AdminEmptyState у CastaPOS):
// порожній стан має виглядати як свідомий стан інтерфейсу, а не як зламаний рендер.
export function AccountEmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <EmptyState className={`grid justify-items-center gap-1 py-10 text-center ${className ?? ""}`}>
      <span
        aria-hidden
        className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-muted"
      >
        {icon ?? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8" />
          </svg>
        )}
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </EmptyState>
  );
}
