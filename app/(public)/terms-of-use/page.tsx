import { notFound } from "next/navigation";
import { getSiteContent } from "@/lib/site-content";

export default async function TermsOfUsePage() {
  const siteContent = await getSiteContent();
  if (!siteContent?.termsOfUseText) notFound();

  return (
    <main className="page">
      <h1>Умови користування</h1>
      <p style={{ whiteSpace: "pre-wrap" }}>{siteContent.termsOfUseText}</p>
    </main>
  );
}
