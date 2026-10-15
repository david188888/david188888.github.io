"use client";

import { useEffect, useState } from "react";
import {
  isStatsAuthenticated,
  matchesAuthorCredentials,
  signInAsAuthor,
  signOutOfStats,
} from "@/lib/auth/author";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";
import { analyticsConfig } from "@/config/analytics";

interface StatsPageViewProps {
  locale?: Locale;
}

export function StatsPageView({ locale = defaultLocale }: StatsPageViewProps) {
  const { stats } = getMessages(locale).pages;
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isStatsAuthenticated()) setAuthenticated(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (matchesAuthorCredentials(username, password)) {
      // Signing in here also unlocks the article annotation tools on this
      // browser, so the author never has to unlock them separately.
      signInAsAuthor();
      setAuthenticated(true);
      setError("");
    } else {
      setError(stats.invalidCredentials);
    }
  }

  function handleLogout() {
    signOutOfStats();
    setAuthenticated(false);
    setUsername("");
    setPassword("");
  }

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="mt-0 text-3xl font-serif">{stats.dashboardTitle}</h1>
          <p className="text-sm text-[var(--global-text-color-light)] break-words">
            {stats.analyticsFor}
          </p>
        </header>

        <section aria-labelledby="stats-coverage" className="border border-[var(--global-border-color)] rounded-card p-5 sm:p-8">
          <h2 id="stats-coverage" className="mt-0 text-xl">{stats.coverageTitle}</h2>
          <p className="text-[var(--global-text-color-light)]">{stats.coverageDescription}</p>
          <a
            href={analyticsConfig.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-5 px-5 py-3 rounded-lg bg-[var(--global-text-color)] text-[var(--global-bg-color)] font-medium hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {stats.openDashboard}
          </a>
          <p className="mt-3 text-sm text-[var(--global-text-color-light)]">{stats.googleSignInNote}</p>
        </section>

        <dl className="grid gap-5 sm:grid-cols-3">
          {[
            [stats.viewsTitle, stats.viewsDescription],
            [stats.usersTitle, stats.usersDescription],
            [stats.sessionsTitle, stats.sessionsDescription],
          ].map(([title, description]) => (
            <div key={title}>
              <dt className="font-semibold">{title}</dt>
              <dd className="mt-2 text-sm text-[var(--global-text-color-light)]">{description}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="stats-reading">
          <h2 id="stats-reading" className="mt-0 text-xl">{stats.readingTitle}</h2>
          <ol className="list-decimal pl-5 space-y-3 text-[var(--global-text-color-light)]">
            {stats.readingSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="mt-5 text-sm text-[var(--global-text-color-light)]">{stats.dataNote}</p>
          <p className="mt-3 text-xs text-[var(--global-text-color-light)]">
            {stats.trackingId}: {analyticsConfig.trackingId}
          </p>
        </section>

        <details className="border-t border-[var(--global-border-color)] pt-5">
          <summary className="cursor-pointer text-sm text-[var(--global-text-color-light)]">{stats.authorToolsTitle}</summary>
          <p className="mt-3 text-sm text-[var(--global-text-color-light)]">{stats.authorToolsDescription}</p>
          {authenticated ? (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <p>{stats.authorToolsUnlocked}</p>
              <button onClick={handleLogout} className="text-[var(--global-link-color)] underline">{stats.signOut}</button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="mt-4 max-w-sm flex flex-col gap-3">
              <label htmlFor="stats-username" className="text-sm">{stats.username}</label>
              <input
                id="stats-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--global-bg-color)] border border-[var(--global-dark-border-color)]"
              />
              <label htmlFor="stats-password" className="text-sm">{stats.password}</label>
              <input
                id="stats-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--global-bg-color)] border border-[var(--global-dark-border-color)]"
              />
              {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
              <button type="submit" className="py-2 px-4 rounded-lg border border-[var(--global-dark-border-color)] font-medium">{stats.signIn}</button>
            </form>
          )}
        </details>
      </div>
    </main>
  );
}
