import { AuthorProfile } from "@/components/AuthorProfile";

export function Sidebar() {
  return (
    <aside
      className="sidebar hidden lg:block lg:w-[16.666%] lg:fixed lg:h-screen lg:overflow-y-auto lg:pt-[70px] lg:border-r lg:border-[var(--global-border-color)]"
      style={{ width: "calc(100% / 12 * 2)" }}
    >
      <AuthorProfile />
    </aside>
  );
}
