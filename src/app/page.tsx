import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { HomePageView } from "@/components/pages/HomePageView";
import { getMessages } from "@/i18n/messages";

// The root layout's metadata is a single non-localized block, so the Chinese
// homepage sets its own title and description here instead of inheriting the
// English fallback.
export function generateMetadata(): Metadata {
  const { home } = getMessages(defaultLocale).pages;
  return {
    title: home.metadataTitle,
    description: home.metadataDescription,
  };
}

export default function HomePage() {
  return <HomePageView locale={defaultLocale} />;
}
