import type { Metadata } from "next";
import { defaultLocale } from "@/i18n/locales";
import { PostsPageView } from "@/components/pages/SubpageViews";
import { authorConfig } from "@/config/author";
import { getMessages } from "@/i18n/messages";

const { posts } = getMessages(defaultLocale).pages;

export function generateMetadata(): Metadata {
  return {
    title: `${posts.title} | ${authorConfig.nameLocalized.zh}`,
    description: posts.description,
  };
}

export default function PostsPage() {
  return <PostsPageView locale={defaultLocale} />;
}
