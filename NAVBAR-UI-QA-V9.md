# Navbar / Hover QA — V9

## Static and syntax checks

- `Header.tsx`: TypeScript JSX transpile parse — PASS
- `Features.tsx`: TypeScript JSX transpile parse — PASS
- `tests/story.spec.ts`: TypeScript JSX transpile parse — PASS
- `navbar.css`: CSS parser — 0 errors
- `styles.css`: CSS parser — 0 errors
- `story.css`: CSS parser — 0 errors

## Chromium visual harness

The V9 interaction CSS was rendered in headless Chromium with the final styles at desktop, 2K and mobile sizes.

Measured navbar states:

| Viewport  |     Top | While moving |  Settled |
| --------- | ------: | -----------: | -------: |
| 1440×900  |  790×72 |       320×62 |  ~754×68 |
| 2432×1440 | 1240×82 |       380×68 | ~1158×76 |
| 390×844   |  370×56 |       224×56 |  ~363×56 |

The compact state centers correctly and returns to the expanded HUD after the settle delay.

## Hover stability regression

The first `.feature-card-shell` was hovered at 2–3 px from its bottom-right edge, where the previous implementation was most likely to oscillate.

- shell before hover: `385.328 × 460`
- shell during tilted hover: `385.328 × 460`
- shell transform: `none`
- inner card transform: active `matrix3d(...)`

The hitbox therefore remains stationary while the visual card moves.

## Full app note

A complete Next/Playwright run was attempted, but the environment cannot fetch all npm packages and the provided npm cache is missing `zustand@5.0.15`. The source tests were updated for the V9 behaviours, but the claim above is limited to syntax/CSS validation plus the Chromium visual harness rather than a full production build.
