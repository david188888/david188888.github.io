# Contributing

This repository is HongYu Liu's personal Next.js website. Keep changes focused
and preserve the static GitHub Pages export.

## Development

1. Install dependencies with `npm install`.
2. Run the site with `npm run dev`.
3. Run `npm run test:run` and `npm run build` before opening a pull request.

Profile content belongs in `src/config/profile.ts`. Blog source belongs in
`content/posts/`, with reviewed translation caches committed under
`content/generated/translations/posts/`. See `README.md` for the authoring
workflow.

Do not commit API keys, `.env.local` files, build output, or local diagnostic
files.
