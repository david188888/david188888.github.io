import { defaultLocale } from "@/i18n/locales";
import { StatsPageView } from "@/components/pages/StatsPageView";

export default function StatsPage() {
  return <StatsPageView locale={defaultLocale} />;
}
