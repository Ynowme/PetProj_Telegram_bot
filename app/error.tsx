"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page">
      <h1>Щось пішло не так</h1>
      <p className="text-muted">Спробуйте оновити сторінку.</p>
      <button type="button" onClick={reset}>
        Повторити
      </button>
    </main>
  );
}
