# Navbar UI QA — V7

## Visual/layout render checks

A lightweight Chromium/Playwright render harness using the real V7 navbar CSS was checked at:

| Viewport    |   Opening | Story HUD |   Page context |
| ----------- | --------: | --------: | -------------: |
| 1440 × 900  |  790 × 72 |  700 × 66 |       700 × 66 |
| 1920 × 1080 | 1040 × 76 |  950 × 68 |       950 × 68 |
| 2432 × 1440 | 1180 × 80 | 1080 × 70 |      1080 × 70 |
| 390 × 844   |  370 × 56 |  370 × 56 | mobile pattern |

11 automated render/layout checks passed:

- navbar centered within 2 px
- no horizontal overflow
- safe 8px+ viewport side clearance
- story context visible on desktop
- current chapter title readable at each desktop scale
- story progress fill tracks the expected 47% sample position
- exactly five chapter markers rendered
- page-context percentage visible
- mobile chapter badge visible in story state

## Source checks

- `Header.tsx`: TypeScript/TSX syntax diagnostics = 0
- `tests/story.spec.ts`: TypeScript/TSX syntax diagnostics = 0
- `navbar.css`: CSS parse errors = 0
- chapter navigation accessible names were intentionally separated from the existing hero chapter controls to avoid strict-locator collisions in Playwright.

## Full application test limitation

`npm ci` was attempted in the container but dependency installation stalled/timed out before the project dependencies were available. Because of that, the complete Next.js build and the repository's full Playwright suite could not be executed here. The navbar-specific layout was browser-rendered independently, and the repository tests were updated for the new Story HUD behaviour.
