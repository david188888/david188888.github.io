"use client";

import { useState, useEffect } from "react";

const VALID_USER = "ZGF2aWRsaXU="; // base64 of username
const VALID_PASS = "TGh5MDQwNjE5"; // base64 of password
const GA_TRACKING_ID = "G-6S2MZXN5QQ";

export default function StatsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = sessionStorage.getItem("stats-auth");
    if (auth === "true") setAuthenticated(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (btoa(username) === VALID_USER && btoa(password) === VALID_PASS) {
      sessionStorage.setItem("stats-auth", "true");
      setAuthenticated(true);
      setError("");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("stats-auth");
    setAuthenticated(false);
    setUsername("");
    setPassword("");
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f17] via-[#0f1620] to-[#06080d]">
        <div className="w-full max-w-sm p-8 rounded-2xl shadow-2xl border border-[rgba(166,182,206,0.12)] bg-[rgba(10,15,24,0.7)] backdrop-blur-xl">
          <h1 className="text-2xl font-serif font-bold text-[#edf3ff] text-center mb-6">
            Site Statistics
          </h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[rgba(17,24,36,0.8)] border border-[rgba(161,176,201,0.4)] text-[#dde7f6] placeholder-[rgba(172,184,204,0.6)] focus:outline-none focus:border-[rgba(221,229,243,0.7)]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[rgba(17,24,36,0.8)] border border-[rgba(161,176,201,0.4)] text-[#dde7f6] placeholder-[rgba(172,184,204,0.6)] focus:outline-none focus:border-[rgba(221,229,243,0.7)]"
            />
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              className="py-2 px-4 rounded-lg font-medium text-[#0e1521] border border-[rgba(221,229,243,0.72)]"
              style={{
                background: "linear-gradient(140deg, #dde6f5, #bfccdf)",
              }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif font-bold text-[var(--global-text-color)]">
            Site Statistics Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--global-text-color-light)] hover:text-[var(--global-link-color)]"
          >
            Sign Out
          </button>
        </div>
        <div className="border border-[var(--global-border-color)] rounded-card p-6">
          <p className="text-[var(--global-text-color-light)] mb-4">
            Google Analytics data for david188888.github.io
          </p>
          <p className="text-sm text-[var(--global-text-color-light)]">
            Tracking ID: {GA_TRACKING_ID}
          </p>
          <p className="text-sm text-[var(--global-text-color-light)] mt-2">
            Full analytics dashboard available at{" "}
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--global-link-color)] underline"
            >
              Google Analytics
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
