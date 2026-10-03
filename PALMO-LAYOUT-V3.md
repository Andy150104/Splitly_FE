# PALMO layout balance — v3

This revision corrects the over-zoom seen on wide desktop screenshots.

- The WebGL canvas remains almost full-width so drag/parallax interaction still works across the hero.
- The wallet object is now camera-fitted inside an editorial safe area rather than scaled to the edges.
- At 2K/wide desktop the object receives an extra width-fit reduction; shorter viewports also scale down automatically.
- Scroll focus now grows the hero product moderately instead of jumping from ~1x to ~1.4x.
- Sharing cards, bills and savings scenes use the same calmer visual scale.
- Camera dolly/FOV changes are intentionally subtle so scroll feels cinematic without creating a giant crop.
- Direct drag remains available, with lower sensitivity for a smoother product-inspection feel.
