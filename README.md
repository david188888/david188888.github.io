# HongYu Liu Homepage

This repository contains the source code for my personal academic website, built with Jekyll and deployed on GitHub Pages.

## Website

- Live site: [https://david188888.github.io](https://david188888.github.io)
- GitHub profile: [https://github.com/david188888](https://github.com/david188888)

## Tech Stack

- Jekyll
- Academic Pages (customized)
- SCSS + JavaScript
- GitHub Actions (automatic Pages deployment)

## Local Development

1. Install dependencies:

```bash
bundle install
```

2. Run the site locally:

```bash
bundle exec jekyll serve -l -H localhost
```

3. Open:

```text
http://localhost:4000
```

## Deployment

Deployment is automatic. Any push to `master` triggers GitHub Pages build and deployment through `.github/workflows/pages.yml`.
