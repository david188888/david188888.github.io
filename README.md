# HongYu Liu Homepage

Personal academic homepage for HongYu Liu, built with Next.js, React,
TypeScript, and Tailwind CSS.

- Website: https://david188888.github.io
- GitHub: https://github.com/david188888

## Development

```bash
npm install
npm run dev       # start the local server
npm run test:run  # run the test suite
npm run build     # build the static site in out/
```

The site is exported as static files for GitHub Pages. The default locale is
Chinese (`/`); English pages use the `/en/` prefix.

## Project Layout

```text
src/app/                         Pages and routes
src/components/                  Shared React components
src/config/                      Profile, project, and site data
src/i18n/                        Locale helpers and UI messages
content/posts/                   Published Insights posts
content/drafts/                  Unpublished drafts
content/generated/translations/  Generated translation cache
public/                          Images, files, and other static assets
```

Blog posts are plain Markdown with YAML frontmatter. They use the `.mdx`
extension for naming only; the site parses them with `markdown-it` and does not
use an MDX compiler. The filename becomes the article URL under `/insights/`.

## Homepage content

The shared homepage, Insights, and project masthead wraps navigation links and
places them on a full second row at window widths of 1100px or less, keeping
the home link and language/theme controls clear in both locales.

Latest-article cards display each localized article’s complete opening body
paragraph, preserving Markdown emphasis instead of combining the frontmatter
excerpt with an unrelated highlight. They rotate every 12 seconds, pause on
hover or focus, and respect reduced motion.

Publication demos are configured in `src/config/profile.ts`. Project descriptions,
dated GitHub star snapshots, and competition report URLs live in
`src/config/projects.ts`. The three original competition reports are served from
`public/files/reports/`; report links work in both locales.

## Website analytics

GA4 is initialized once in the root layout for every HTML page, including direct
article visits and both languages. All pages use the same property. Google’s
enhanced measurement records page loads and history changes; do not add manual
`page_view` events alongside it. Only `david188888.github.io` loads the tag, so
local development and previews stay out of the real statistics.

Open `/stats/` (or `/en/stats/`) and connect an authorized Google account for
read-only access to the inline dashboard: 7/30-day sitewide views, active users,
sessions, daily views, top pages and traffic channels, plus independent realtime
users in the last 30 minutes. The original Google dashboard link remains available.
Google tokens and reports stay in page memory; reloading requires reconnecting.
The optional website author login only unlocks article annotation tools.

The dashboard also shows top-ten countries, country/region/city combinations,
device categories, browsers and session source/medium. These are approximate
aggregates, not individual visitor records; users across rows must not be added
to infer sitewide people. Audience errors do not hide the overview or realtime.

Use **Exclude this browser** above the dashboard on each of your browsers/devices
to keep future visits out of collection. The setting is saved locally and checked
before loading the Google tag. Saving reloads this page and other open site tabs,
so reconnect Google afterward. Clearing site data resets it; incognito and other
browser profiles need separate setup. Historical visits cannot be subtracted by
this switch. Opening the statistics page does not automatically exclude anyone.

Set `NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID` locally and the public GitHub Actions
repository variable `GOOGLE_ANALYTICS_CLIENT_ID` for deployment. The static site
uses no OAuth client secret. Without a configured client ID, the page clearly
shows setup is pending and retains the external dashboard link.

See [analytics setup and verification](docs/analytics.md) for Cloud/OAuth setup,
metric definitions and the remaining live-account acceptance steps.

## Related Docs

- [Navigation performance](docs/navigation-performance.md)
- [Insights markup](docs/insights-markup.md)
- [Homepage contact layout and palette note](docs/superpowers/specs/2026-10-10-homepage-contact-palette-design.md)
