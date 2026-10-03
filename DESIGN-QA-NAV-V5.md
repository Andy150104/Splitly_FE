# Design QA — Olive Glass Navbar V5

## Visual checks completed

- Desktop composition rendered at 1440×900 with the real project CSS loaded: capsule stays centered and leaves clear breathing room above/below.
- Mobile composition reviewed at 390×844: brand, wallet CTA and menu control fit in one row; the expanded menu stays inside the viewport width.
- Olive/cream palette remains consistent with the 3D wallet scene instead of introducing a disconnected black tech navbar.
- CTA is intentionally the highest-contrast element; nav labels are quieter and the active section gets a small lime marker.
- Scroll state increases opacity and tightens the pill slightly without changing its layout.

## Code / structure checks completed

- `Header.tsx`, `layout.tsx` and the updated Playwright spec pass TypeScript syntax transpilation.
- `styles.css`, `story.css` and `navbar.css` parse with zero CSS syntax errors via `tinycss2`.
- Header styling is isolated in `src/navbar.css` and imported after story styles to avoid breakpoint collisions.
- Hero sticky offsets now use one responsive `--header-space` token, keeping the 3D story aligned under the floating navigation.
- New Playwright assertions cover centering, width limits, backdrop blur, active nav state and 360px mobile overflow.

## Environment note

A full Next.js/Playwright run could not be completed in this workspace because `npm ci` could not finish fetching dependencies from the registry. The source keeps the existing dependency set unchanged.
