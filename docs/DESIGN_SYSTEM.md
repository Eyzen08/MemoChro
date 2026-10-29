# Modern Memory Chronicles design system

The user's [Dribbble reference](https://dribbble.com/shots/26811996-Website-for-Discovering-and-Managing-Live-Events) informed content hierarchy and curated discovery; its event layout was not copied. The personal archive uses charcoal, photographic prints, editorial type and deliberate empty space.

Tokens live in `src/app/globals.css`: background #0c0b0a, sidebar #11100f, surface #191715, text #f4efe8, muted #a9a29a, copper #c4a087, line #2b2723. Light mode uses #faf7f2 paper, #29221c text and #805d43 copper. Semantic error and success colors are paired with readable messages. Theme is initialized before content from a saved device preference to avoid a visible theme flash.

DM Sans supplies controls and metadata; Libre Caslon Display supplies selected headings and reflections. Fonts and licenses are bundled locally; no runtime Google Fonts request. Photographs introduce color; native image ratios are preserved and private previews avoid shared optimization caches.

The fixed desktop rail has exactly six primary destinations. A mobile disclosure exposes the same links, account settings and sign-out. Secondary settings do not become another primary destination. Layout widths adapt at 540, 767, 1000, 1200 and 1500px. Visible focus outlines, native labels, semantic forms, skip link, modal focus containment and text errors support keyboard use. Empty states invite a real save instead of inventing activity.

Decorative lake and mountain photographs were downloaded from Unsplash to local files; they are brand artwork, never sample user memories. Source assets: [lake](https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1), [mountains](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b), [Unsplash license](https://unsplash.com/license). Font redistribution licenses are included beside the font files.

Browser layout checks cover 360, 390, 768, 1024, 1366 and 1440px. Screenshot evidence is stored locally under ignored `test-results/`. Automated layout checks do not substitute for assistive-technology testing; no screen-reader certification is claimed.
