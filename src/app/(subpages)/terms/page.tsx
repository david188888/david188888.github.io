export default function TermsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--global-text-color)]">
        Terms and Privacy Policy
      </h1>
      <div className="prose dark:prose-invert max-w-none text-[var(--global-text-color)]">
        <p>
          This is a personal academic homepage. No personal data is collected
          beyond standard server access logs.
        </p>
        <h2>Analytics</h2>
        <p>
          This site uses Google Analytics 4 to collect anonymous usage data.
          You may opt out by using browser privacy settings or ad blockers.
        </p>
        <h2>External Links</h2>
        <p>
          This site contains links to external sites (arXiv, GitHub, Google
          Scholar). We are not responsible for their privacy practices.
        </p>
      </div>
    </div>
  );
}
