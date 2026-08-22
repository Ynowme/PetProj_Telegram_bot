import type { ReactNode } from "react";
import { Breadcrumbs } from "@heroui/react";

export type AdminCrumb = { label: string; href?: string };

// Єдиний заголовок сторінок адмінки (той самий ритм, що в CastaPOS): раніше кожен екран
// верстав <h1> зі своїми відступами, через що шапки "стрибали" між розділами. Тут заголовок,
// підпис, хлібні крихти та блок дій живуть в одному компоненті з єдиною композицією.
export function AdminPageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: AdminCrumb[];
}) {
  return (
    <header className="grid gap-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs>
          {breadcrumbs.map((crumb, index) => (
            <Breadcrumbs.Item key={index} href={crumb.href}>
              {crumb.label}
            </Breadcrumbs.Item>
          ))}
        </Breadcrumbs>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
