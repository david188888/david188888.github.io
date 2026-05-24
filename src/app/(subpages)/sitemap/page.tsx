import Link from "next/link";

const allPages = [
  { title: "Home", url: "/" },
  { title: "Publications", url: "/publications/" },
  { title: "CV", url: "/cv/" },
  { title: "Teaching", url: "/teaching/" },
  { title: "Talks", url: "/talks/" },
  { title: "Posts", url: "/posts/" },
  { title: "Stats", url: "/stats/" },
  { title: "Sitemap", url: "/sitemap/" },
  { title: "Terms & Privacy", url: "/terms/" },
];

export default function SitemapPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        Sitemap
      </h1>
      <ul className="list-none p-0">
        {allPages.map((page) => (
          <li key={page.url} className="mb-3">
            <Link
              href={page.url}
              className="text-[var(--global-link-color)] no-underline hover:underline"
            >
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
