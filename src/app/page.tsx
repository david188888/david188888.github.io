import { defaultLocale } from "@/i18n/locales";
import { HomePageView } from "@/components/pages/HomePageView";

export default function HomePage() {
  return <HomePageView locale={defaultLocale} />;
}
