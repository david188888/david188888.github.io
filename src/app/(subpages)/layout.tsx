import { SubpageShell } from "@/components/pages/SubpageViews";

export default function SubpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SubpageShell locale="en">{children}</SubpageShell>;
}
