"use client";

import { Button, EmptyState } from "@heroui/react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-[720px] items-center justify-center px-6 py-10">
      <EmptyState className="text-center">
        <h1 className="mb-2 mt-0 text-2xl font-semibold text-foreground">Щось пішло не так</h1>
        <p className="mb-5 mt-0 text-muted">Спробуйте оновити сторінку.</p>
        <Button variant="primary" className="min-h-11" onPress={reset}>
          Повторити
        </Button>
      </EmptyState>
    </main>
  );
}
