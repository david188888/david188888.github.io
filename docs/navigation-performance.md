# Navigation performance

The site is a static Next.js export hosted on GitHub Pages. These changes reduce
avoidable navigation work; they do not change the hosting service or guarantee
network latency.

## Navigation contract

- Use `next/link` for routes within the site, including links from an article or
  project page back to a homepage section. Keep plain anchors for sections on the
  current page, external destinations and file downloads.
- The language button prefetches only the current page's alternate locale on
  pointer entry, keyboard focus, or opening the menu. Next.js owns the prefetch
  cache; no separate application cache or background full-site download is added.
- Language options remain real links. The framework's `useLinkStatus` supplies a
  localized pending message without replacing native modified-click behavior.
  Selecting the active locale closes the menu without navigating; a completed
  route change closes it and synchronizes the document's language.
- Editorial and global theme preferences remain separate. Fonts, article content,
  translation caches and carousel behavior are outside this change.

## Verification

Use a production export, not `next dev`: development-mode compilation and
prefetch behavior do not represent GitHub Pages.

```sh
npm run test:run
npm run build
python3 -m http.server 4174 --bind 127.0.0.1 --directory out
```

In Chrome, check desktop and mobile viewport sizes:

1. Home → Industry Memos → article; return to a homepage section. Confirm the
   document's `performance.timeOrigin` stays unchanged across client navigation.
2. Hover or focus Language before opening it. In Network, verify the alternate
   locale's `index.txt` request starts while the menu is still closed.
3. With an uncached alternate route and network throttling, open the menu and
   immediately switch languages. Verify pending feedback, translated content,
   `html[lang]`, and the closed menu after completion.
4. Select the current language, use Escape and outside clicks, navigate backward
   and forward, and open a language link in a new tab using a modified click.
5. Check homepage anchor positioning, both editorial display modes, and mobile
   horizontal overflow. Restore any browser emulation after testing.

For before/after measurements, serve exports from the same source baseline and
modified checkout on separate localhost ports. Repeat each path at least three
times. Record HTTP-cache and route-prefetch conditions, and compare medians and
maximums. A warm router cache is distinct from the browser's HTTP cache.

The measurement used here is click to destination title appearing in the DOM,
not full-page paint, LCP, or a field Core Web Vitals measurement. Local results
must not be presented as measurements of the deployed website.

## Results — 2026-09-29

Baseline: commit `6bcc686a`, Next.js 15.5.18. Both versions were built with
`npm run build` and served as static files on localhost. Chrome was controlled
through the project browser harness. Focus emulation kept the test tab visible
and focused; background tabs can suppress prefetching and are not representative
of a visitor actively using the page.

The homepage loaded on an unthrottled connection. Before each measured click,
network emulation was set to 300 ms latency, 200,000 bytes/s download and 100,000
bytes/s upload, with HTTP caching disabled. Each run began with a fresh document
(fresh Next.js router cache). The navigation case waited two seconds on the
homepage; the language case focused the language button for two seconds before
opening the menu and selecting English. These waits let the new prefetching
work: the results describe a prepared navigation, not an immediate cold click.

| Operation | Before, three samples (ms) | After, three samples (ms) | Median before → after | Maximum before → after |
| --- | --- | --- | --- | --- |
| Homepage → Industry Memos | 1066, 1079, 1074 | 13, 18, 19 | 1074 → 18 ms | 1079 → 19 ms |
| Chinese homepage → English | 408, 397, 388 | 8, 9, 12 | 397 → 9 ms | 408 → 12 ms |

All baseline homepage-to-list clicks created a new document; all modified clicks
kept the existing document. In all three modified language runs, the English
route request completed while the menu was still closed; none did in the
baseline. The baseline also left `html[lang]` at `zh` after switching to English;
the modified version correctly set it to `en`.

Additional checks completed:

- 377 Vitest tests passed; all 45 static pages built successfully.
- With 1500 ms network latency and a quick language selection, `切换中…` appeared
  before navigation completed, and the menu closed afterward. This also worked
  with touch input in a 390 × 844 mobile viewport; the pending menu stayed within
  the viewport (visually checked in a browser screenshot).
- Article language switching, browser back/forward, selecting the active locale,
  Escape, outside clicks, and Cmd-clicking a language option into a new tab worked.
  Cmd-click did not show a false pending state in the original tab.
- Same-page education anchors and cross-page project anchors reached their
  sections, about 60 px from the viewport top. The project footer return link
  also retained the current document.
- Editorial dark mode persisted across page/language changes; light mode and
  mobile English-to-Chinese switching worked. No JavaScript errors were captured
  during these flows. Mobile verification used Chrome emulation, not a physical
  phone.

Known pre-existing issue: at a 390 px viewport, the English homepage has a 612 px
document scroll width due to the long navigation labels. The baseline and modified
builds have identical overflow; the Chinese homepage remains 390 px wide. Fixing
this requires a separate choice between wrapping or horizontally scrolling the
mobile navigation, so it is outside the approved performance-only scope.

These changes have been validated locally; this report does not claim deployment
or a post-deployment improvement on GitHub Pages.
