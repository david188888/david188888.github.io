import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[var(--global-text-color)] mb-4">
          Page Not Found
        </h1>
        <p className="text-[var(--global-text-color-light)] mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="text-[var(--global-link-color)] underline hover:text-[var(--global-link-color-hover)]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
