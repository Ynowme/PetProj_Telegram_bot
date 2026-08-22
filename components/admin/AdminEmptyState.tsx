import type { ReactNode } from "react";
import { EmptyState } from "@heroui/react";

// Обгортка над HeroUI EmptyState: голі <p class="text-muted"> у списках виглядали як зламаний
// рендер, а не як свідомий стан "тут порожньо". Тут порожній стан має однакову вертикальну
// композицію (іконка + заголовок + пояснення + необовʼязкова дія) по всій адмінці.
export function AdminEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <EmptyState className={`grid justify-items-center gap-1 py-10 text-center ${className ?? ""}`}>
      <span
        aria-hidden
        className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-muted"
      >
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
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </EmptyState>
  );
}
