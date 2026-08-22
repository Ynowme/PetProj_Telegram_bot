import Link from "next/link";
import { buttonVariants, EmptyState } from "@heroui/react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-[720px] items-center justify-center px-6 py-10">
      <EmptyState className="text-center">
        <p className="m-0 text-4xl font-semibold tabular-nums text-muted" aria-hidden>
          404
        </p>
        <h1 className="mb-5 mt-2 text-2xl font-semibold text-foreground">Сторінку не знайдено</h1>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          На головну
        </Link>
      </EmptyState>
    </main>
  );
}
