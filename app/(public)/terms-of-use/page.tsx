import { notFound } from "next/navigation";
import { getSiteContent } from "@/lib/site-content";
import { LegalArticle } from "@/components/LegalArticle";

export default async function TermsOfUsePage() {
  const siteContent = await getSiteContent();
  if (!siteContent?.termsOfUseText) notFound();

  return <LegalArticle title="Умови користування" text={siteContent.termsOfUseText} />;
}
