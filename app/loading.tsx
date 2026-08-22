import { Spinner } from "@heroui/react";

export default function Loading() {
  return (
    <main className="flex min-h-[50vh] items-center justify-center px-6 py-10" aria-label="Завантаження">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Spinner size="lg" />
        <p className="m-0 text-sm">Завантаження…</p>
      </div>
    </main>
  );
}
