# Changelog

## Unreleased

- Add a private inline GA4 dashboard to both statistics pages, with Google
  read-only authorization, 7/30-day sitewide totals, daily trends, top pages,
  traffic channels and independent realtime users.
- Keep authorization and reports in memory, clear them on disconnect/expiry,
  and isolate canceled or stale requests. Report failures and empty data explicitly.
- Add public OAuth client ID build configuration and Google Cloud setup guidance.

## 2026-10-16 — Sitewide tracking (PR #21, deployed)

- Add GA4 to the shared root layout so all HTML pages and both languages use
  one property, with automatic page-load/history measurement and preview exclusion.
- Make `/stats/` a one-click entry to the existing private Google Analytics
  dashboard, with metric explanations and optional article-author login.
- Document setup, scope and post-deployment verification; update the analytics
  notice to describe cookies and identifiers without promising anonymous data.
