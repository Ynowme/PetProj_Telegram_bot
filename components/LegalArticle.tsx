// Єдиний шаблон трьох сторінок політик (privacy/terms/cookie) — текст приходить одним
// полем із CastaPOS-адмінки без розмітки, тож верстаємо як довгий преформатований
// абзац: вузька колонка 65ch для комфортного читання, спокійна типографіка.
export function LegalArticle({ title, text }: { title: string; text: string }) {
  return (
    <main className="mx-auto w-full max-w-[65ch] px-6 py-12">
      <article>
        <h1 className="mb-6 mt-0 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="m-0 whitespace-pre-wrap text-base leading-7 text-muted">{text}</p>
      </article>
    </main>
  );
}
