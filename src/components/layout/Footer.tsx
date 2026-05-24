import Link from "next/link";

export function Footer() {
  return (
    <div className="page__footer w-full mt-8 bg-[var(--global-footer-bg-color)] text-[var(--global-text-color-light)] border-t border-[var(--global-dark-border-color)] text-xs">
      <footer className="max-w-[1280px] mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wider">
            <Link href="/sitemap/" className="text-inherit no-underline hover:underline">
              Sitemap
            </Link>
            <Link href="/terms/" className="text-inherit no-underline hover:underline">
              Terms &amp; Privacy
            </Link>
          </div>
          <div className="text-xs text-[var(--global-text-color-light)]">
            &copy; {new Date().getFullYear()} HongYu Liu. Powered by{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-inherit underline"
            >
              Next.js
            </a>
            .
          </div>
        </div>
      </footer>
    </div>
  );
}
