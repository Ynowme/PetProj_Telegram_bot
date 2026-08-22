import { notFound } from "next/navigation";
import { getSiteContent } from "@/lib/site-content";
import { LegalArticle } from "@/components/LegalArticle";

export default async function PrivacyPolicyPage() {
  const siteContent = await getSiteContent();
  if (!siteContent?.privacyPolicyText) notFound();

  return <LegalArticle title="Політика конфіденційності" text={siteContent.privacyPolicyText} />;
}
