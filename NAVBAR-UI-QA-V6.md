# Navbar UI QA — V6

## What changed

- Increased the floating capsule from laptop-sized proportions to responsive desktop sizing.
- Desktop links now render at 14px on 1440px screens, 15px at 1920px, and 16px at 2K+ widths.
- 2K+ navbar grows to 1180px wide instead of staying around the old ~500–600px visual scale.
- Increased text contrast and glass opacity while retaining the olive/cream identity.
- Added distinct top vs scrolled states: the capsule moves slightly upward, becomes more opaque, and settles at a slightly smaller scale.
- Added a restrained 150ms “breathing” compression only while the user is actively scrolling.
- Active navigation is a soft inner pill + lime dot, with clearer weight and contrast.
- Mobile keeps the same visual language while using a compact logo / wallet CTA / menu pattern.
- Added focus-visible rings and a non-backdrop-filter fallback.

## Visual QA run

A Chromium visual harness was rendered with the same `navbar.css` at these sizes:

| Viewport  | Navbar width |  Nav type size | Result                       |
| --------- | -----------: | -------------: | ---------------------------- |
| 1440×900  |      806.4px |           14px | PASS                         |
| 1920×1080 |       1040px |           15px | PASS                         |
| 2432×1440 |       1180px |           16px | PASS                         |
| 390×844   |        370px | compact mobile | PASS, no horizontal overflow |

The scrolled middle-story state was also checked at 1440×900: the navbar moved from `y=16px` to about `y=10px`, switched to the stronger olive glass, and the active item changed to `Khám phá`.

## Readability check

Approximate WCAG contrast after compositing the translucent layers over the site's cream background:

- top / idle: ~4.94:1
- scrolled: ~7.03:1
- discover section: ~7.42:1
- dreams section: ~6.88:1

This is intentionally stronger than V5, where the small low-opacity labels could look washed out on large screens.

## Code checks

- `Header.tsx`: TypeScript/TSX syntax transpile PASS.
- `tests/story.spec.ts`: TypeScript syntax transpile PASS.
- `navbar.css`: parsed with `tinycss2`, 0 parser errors.
- Added Playwright assertions for 1440, 1920, 2432 and 360px layouts, scroll state, active section, CTA height, text size and overflow.

Full Next.js Playwright execution still requires the project dependencies to be installed locally. The environment used for this revision could not complete `npm ci`, so browser QA was performed through a standalone Chromium harness using the exact navbar stylesheet rather than claiming a full-app e2e run.
