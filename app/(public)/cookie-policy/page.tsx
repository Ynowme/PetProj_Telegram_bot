import { notFound } from "next/navigation";
import { getSiteContent } from "@/lib/site-content";

export default async function CookiePolicyPage() {
  const siteContent = await getSiteContent();
  if (!siteContent?.cookiePolicyText) notFound();

  return (
    <main className="page">
      <h1>Політика використання cookie</h1>
      <p style={{ whiteSpace: "pre-wrap" }}>{siteContent.cookiePolicyText}</p>
    </main>
  );
}
