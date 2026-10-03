# Navbar Story HUD — V7

V7 turns the floating olive-glass navbar into part of the storytelling experience instead of leaving it as a static menu above the animation.

## Behaviour

### Opening state

- Full navigation stays visible at the top.
- The capsule is denser and slightly narrower than V6.
- `01 — 05` is added as a subtle story cue so the right side no longer feels empty.
- Contrast of cream text against olive glass is increased.

### While scrolling through the cinematic hero

The menu morphs into a contextual Story HUD:

- current chapter, e.g. `03 — HÓA ĐƠN`
- current chapter label, e.g. `BỚT ĐIỀU PHẢI NHỚ`
- a live scroll-progress rail
- five clickable chapter markers
- current index, e.g. `03 / 05`
- persistent `MỞ VÍ` CTA

The chapter copy uses a short vertical fade/slide when the active scene changes. The progress rail is reversible with scroll.

### After the cinematic hero

The same compact capsule becomes page context rather than reverting to an empty menu:

- current section, e.g. `KHÁM PHÁ`
- a short section description
- whole-page progress percentage
- persistent CTA

### Mobile

- Keeps the simpler `mơ. + MỞ VÍ + menu` pattern.
- During the cinematic story a small `02/05`, `03/05`, etc. badge appears without squeezing the navigation.

## Responsive scale

- 1440px: opening ~790px / story ~700px
- 1920px: opening ~1040px / story ~950px
- 2432px: opening ~1180px / story ~1080px
- 390px: 370px capsule with no horizontal overflow

## Files changed

- `src/components/Header.tsx`
- `src/navbar.css`
- `tests/story.spec.ts`

Visual QA captures are in `QA/nav-v7/`.
