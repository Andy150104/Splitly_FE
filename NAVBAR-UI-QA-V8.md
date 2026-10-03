# Navbar V8 UI QA

## Static/browser layout checks

The production navbar stylesheet was rendered in Chromium with a representative story state.

Checked states:

- 1440×900 — settled story HUD
- 1440×900 — quick chapter selector open
- 1440×900 — collapsed compact pill
- 2432×1440 — quick selector open
- 390×844 — compact state

Measured results after transitions settled:

| State          | Navbar width | Height | Horizontal overflow |
| -------------- | -----------: | -----: | ------------------- |
| 1440 story     |        760px |   68px | No                  |
| 1440 collapsed |        320px |   62px | No                  |
| 2432 story     |       1160px |   76px | No                  |
| 390 collapsed  |        224px |   56px | No                  |

At 1440px, the quick selector renders at 820px wide, giving the five chapters usable click targets without making the persistent HUD oversized.

## Source checks

- `Header.tsx` successfully type-parses against local React/lucide shims, including JSX structure and local story types.
- `tests/story.spec.ts` successfully type-parses against a Playwright shim.
- `navbar.css` parsed with `tinycss2`: **0 parse errors**.
- CSS brace count matched: **245 opening / 245 closing** at the time of QA.
- Added Playwright coverage for:
  - opening quick navigation after scroll settles,
  - selecting a story chapter,
  - collapsing the navbar,
  - restoring the expanded HUD.

## Environment limitation

The project dependencies are not fully installed in the working environment, so the complete Next.js + WebGL Playwright suite could not be executed. The navbar itself was browser-rendered with Chromium using the real production CSS, and source-level TypeScript/CSS checks were run separately.
