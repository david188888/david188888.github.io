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
import { StatsDashboard } from "@/components/analytics/StatsDashboard";

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

        <StatsDashboard locale={locale} />

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
