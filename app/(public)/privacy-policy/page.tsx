import { notFound } from "next/navigation";
import { getSiteContent } from "@/lib/site-content";

export default async function PrivacyPolicyPage() {
  const siteContent = await getSiteContent();
  if (!siteContent?.privacyPolicyText) notFound();

  return (
    <main className="page">
      <h1>Політика конфіденційності</h1>
      <p style={{ whiteSpace: "pre-wrap" }}>{siteContent.privacyPolicyText}</p>
    </main>
  );
}
