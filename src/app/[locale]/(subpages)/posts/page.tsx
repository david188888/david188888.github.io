import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authorConfig } from "@/config/author";
import { PostsPageView } from "@/components/pages/SubpageViews";
import { isLocale, locales } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";

interface LocaleSubpageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleSubpageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { posts } = getMessages(locale).pages;
  return {
    title: `${posts.title} | ${authorConfig.nameLocalized[locale]}`,
    description: posts.description,
  };
}

export default async function LocalePostsPage({ params }: LocaleSubpageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <PostsPageView locale={locale} />;
}
