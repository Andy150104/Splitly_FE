# Navbar V8 — Interactive Story Navigator

## What changed

- The scrolled chapter label is now a real button with a chevron, so the user can stop scrolling and deliberately open navigation.
- Added a glass quick-navigation tray with:
  - Main sections: Trang đầu / Khám phá / Điều đang mơ / Câu chuyện.
  - All five story chapters with chapter number, title and short label.
- Existing progress dots remain directly clickable, now with larger hit areas and hover/focus tooltips.
- Added manual collapse/expand control.
  - Expanded: full story HUD + CTA.
  - Collapsed: compact `mơ. + current position + expand` pill.
  - Current chapter remains visible while compact, so the user never loses context.
- Quick navigation closes automatically when scrolling resumes, but the HUD stays interactive after scrolling settles.
- Mobile menu now includes the five chapter shortcuts while inside the story.
- Large desktop tuning was increased so the scrolled HUD and selector remain legible at 2K widths.

## Interaction model

1. Scroll: navbar follows story progress.
2. Stop: chapter copy + chevron clearly reads as a clickable navigation control.
3. Click current chapter: open the selector tray.
4. Select any chapter: smooth-scroll to that exact story chapter.
5. Click the chevron button at far right: collapse the whole navbar.
6. Compact pill keeps the current chapter visible; click the compact label or expand chevron to restore the full navbar.

## Files changed

- `src/components/Header.tsx`
- `src/navbar.css`
- `tests/story.spec.ts`
