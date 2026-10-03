# Navbar Interaction V9

## What changed

### 1. `Trang đầu` is reversible again

The active top-level section no longer depends on IntersectionObserver history. The header derives `home / discover / dreams` from the current scroll position on every animation frame. Scrolling upward therefore restores `Trang đầu` deterministically.

All explicit Home routes now use `window.scrollTo({ top: 0 })`: the logo, desktop `Trang đầu`, mobile `Trang đầu`, and the quick-navigation `Trang đầu` action. This avoids stopping at a stale anchor offset after navigating between sections.

### 2. Auto-compact while scrolling, auto-expand after settle

The header now has two distinct compact states:

- **Auto compact:** while scrolling down past a 14 px hysteresis threshold, the navbar shrinks to a context pill so it does not cover the story. Scrolling upward restores the full HUD immediately.
- **Manual compact:** pressing the collapse control pins the compact state until the user expands it again.

When scrolling stops for ~340 ms, auto compact releases smoothly and the full story HUD returns without rapid expand-collapse flickering during reading micro-pauses. Manual compact does not release on settle.

### 3. Deliberate navigation after settle

The expanded HUD remains fully interactive after settle. The chapter/context control opens Quick Navigation, where the user can jump to top-level sections or any of the five story chapters.

### 4. Feature-card hover jitter removed

The old card was both the pointer hit-area and the transformed element. Near a bottom/side edge, hover lift + 3D tilt moved that same hit-area under the mouse, producing enter/leave feedback and visible jitter.

V9 introduces `.feature-card-shell` as a stable, non-transformed hit-area. The visual `.feature-card` tilts inside that shell. Tilt strength was also reduced from `7°/9°` to `3.8°/5.2°` and hover lift from `-8px` to `-4px`.
