import { notFound } from "next/navigation";
import { getSiteContent } from "@/lib/site-content";
import { LegalArticle } from "@/components/LegalArticle";

export default async function CookiePolicyPage() {
  const siteContent = await getSiteContent();
  if (!siteContent?.cookiePolicyText) notFound();

  return <LegalArticle title="Політика використання cookie" text={siteContent.cookiePolicyText} />;
}
