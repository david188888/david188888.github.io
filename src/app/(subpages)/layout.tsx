import { defaultLocale } from "@/i18n/locales";
import { SubpageShell } from "@/components/pages/SubpageViews";

export default function SubpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SubpageShell locale={defaultLocale}>{children}</SubpageShell>;
}
