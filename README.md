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

## Related Docs

- [Navigation performance](docs/navigation-performance.md)
- [Insights markup](docs/insights-markup.md)
- [Homepage contact layout and palette note](docs/superpowers/specs/2026-10-10-homepage-contact-palette-design.md)
