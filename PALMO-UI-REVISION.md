# Palmo-style UI revision

This pass specifically addresses the two issues visible on wide desktop recordings: the 3D scene being trapped in a centered/narrow island, and interaction feeling too passive.

## What changed

- Removed the 1600 px hero cap and 1328 px section cap. Wide screens now keep editorial side margins but use the viewport instead of leaving hundreds of pixels empty on both sides.
- The pinned Three.js canvas is now a true full-stage layer. On a 2432×1440 viewport it is expected to cover almost the entire hero width and over 1050 px of height.
- The wallet is positioned in 3D rather than by shrinking the HTML canvas. It starts to the right while the intro copy is visible, then moves to the centre as the copy fades.
- Scroll now drives real camera zoom plus model scale. The wallet also separates into front/back/card/receipt layers before the next scene, making the transition much more physical.
- Sharing, bill and saving scenes are larger and intentionally allowed to approach/crop against the viewport edges, matching the oversized product-film composition.
- Mouse movement has stronger parallax. Hold + drag directly on the 3D stage to orbit the scene; the existing “XOAY MỘT VÒNG” control still works.
- Feature cards now use pointer-position perspective tilt and a moving highlight rather than only a fixed hover lift.
- Viewports >= 1800 px receive larger typography and feature cards so 2K/4K layouts do not look like a laptop layout surrounded by empty space.

## Manual check

Run `npm ci --include=dev` then `npm run dev`, open `http://localhost:3000`, and test at 2432×1440 (or the same browser size as the reference recording):

1. At the top, the model sits on the right of the intro without the whole canvas being confined to that side.
2. Scroll a little: the copy fades, the wallet moves to the exact centre and becomes visibly larger.
3. Continue scrolling: the wallet layers separate, then each new scene enters as one continuous pinned sequence.
4. Stop scrolling: the current 3D pose should hold. Scroll backwards: the sequence should reverse.
5. Move the mouse over the scene and drag left/right/up/down: the 3D rig should respond immediately.
6. In the dark feature section, move the pointer around each card: the whole card should tilt toward the pointer and the highlight should follow it.

`tests/story.spec.ts` now contains a dedicated 2432×1440 full-stage assertion and a direct mouse-drag interaction check.
