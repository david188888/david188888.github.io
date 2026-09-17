import { defaultLocale } from "@/i18n/locales";
import { PostsPageView } from "@/components/pages/SubpageViews";

export default function PostsPage() {
  return <PostsPageView locale={defaultLocale} />;
}
