import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <h1>Сторінку не знайдено</h1>
      <p>
        <Link href="/" className="pill">
          На головну
        </Link>
      </p>
    </main>
  );
}
