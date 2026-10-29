# Modern Memory Chronicles design system

The user's [Dribbble reference](https://dribbble.com/shots/26811996-Website-for-Discovering-and-Managing-Live-Events) informed content hierarchy and curated discovery; its event layout was not copied. The personal archive uses warm ivory by default, an optional charcoal theme, photographic prints, editorial type and deliberate empty space.

Tokens live in `src/app/globals.css`: background #0c0b0a, sidebar #11100f, surface #191715, text #f4efe8, muted #a9a29a, copper #c4a087, line #2b2723. Light mode uses #faf7f2 paper, #29221c text and #805d43 copper. Semantic error and success colors are paired with readable messages. Theme is initialized before content: a saved preference wins; otherwise light is the default. Muted/placeholder text uses contrast-safe theme tokens.

DM Sans supplies controls and metadata; Libre Caslon Display supplies selected headings and reflections. Fonts and licenses are bundled locally; no runtime Google Fonts request. Photographs introduce color; native image ratios are preserved and private previews avoid shared optimization caches.

The fixed desktop rail has exactly six primary destinations. Below 1200px a native modal drawer exposes the same links, account settings and sign-out, with a Tab cycle, Escape dismissal and focus restoration. Secondary settings do not become another primary destination. Layout widths adapt at 540, 767, 1000, 1200 and 1500px. Visible focus outlines, native labels, semantic forms, skip link, modal focus containment and text errors support keyboard use. Empty states invite a real save instead of inventing activity.

Decorative lake and mountain photographs were downloaded from Unsplash to local files; they are brand artwork, never sample user memories. Source assets: [lake](https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1), [mountains](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b), [Unsplash license](https://unsplash.com/license). Font redistribution licenses are included beside the font files.

Browser layout checks cover 360, 390, 768, 1024, 1366 and 1440px. Screenshot evidence is stored locally under ignored `test-results/`. Automated layout checks do not substitute for assistive-technology testing; no screen-reader certification is claimed.

## October 29 frontend refinement

Shared 1280px content measure, aligned header gutters, 16px body/inputs, 14px navigation/labels and 12px helper text. Essential text no longer shrinks at narrower breakpoints. The memory editor uses a 280px details column on wide screens and stacks below 1200px. Its keyboard-focusable field scroller reserves a separate sticky action and feedback row, so controls are never obscured. Short screens retain at least 220px of field space and use ordinary page scrolling for the action row.

People-focused prints introduce the welcome page; an explicitly labelled sample section leads to `/demo`. See [photo credits](PHOTO_CREDITS.md) for all six local licensed assets. The demo reuses shell, navigation, cards and photo viewer through explicit presentation options. Fictional sample narratives do not describe the photographed people.
