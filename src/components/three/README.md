# Splitly studio components

Shared procedural geometry for the login and landing scenes. Import directly from each file.

- `materials.ts`: common indigo/lavender palette, satin polymer and soft metal parameters.
- `StudioLighting.tsx`: neutral key, lavender rim and restrained studio reflections.
- `LinkedLoop.tsx`: capped loop geometry used by the signature sculpture and token stamp.
- `SplitToken.tsx`: beveled token with a recessed face and Splitly relief on both sides.
- `WalletPocket.tsx`: shaped pocket opening with an extruded bevel and raised seam.
- `useSurfaceGrain.ts`: deterministic micro bump texture, disposed when unmounted.

Landing refinement:

- `landingMaterials.ts`: matte plum leather, brushed lavender card and silver metal presets.
- `LandingLighting.tsx`: warm key and narrow violet/cool softboxes for directional reflections.
- `ProductUniverse.tsx`: local haze, 72 stars (24 on small stages), two 3D orbits and light nodes.
- `PaperReceipt.tsx`: a single curved, perforated print surface without intersecting ink layers.
- `SavingsVessel.tsx`: hollow refractive glass, a curved paper wrap and an anodized metal lid.
- `ScrollParticles.tsx`: a paused GSAP timeline follows the existing story progress; dust
  spirals between chapters and stretches into short light trails while scrolling. It settles
  within 140ms after scrolling stops and is disabled for reduced motion. Desktop uses 96 points,
  small stages 24. A screen-space mask protects the desktop headline.

The atmosphere lives inside the wallet rig. Cards lift along a curved path every 12 seconds
at the start of the hero and separate during manual inspection. Reading poses remain driven
by scroll. Shared tokens, loops and pocket keep their default finish for the login scene;
landing opts into the alternate finishes explicitly.

Visual captures and a motion video: `node scripts/capture-universe.mjs` → `QA/universe/`.
The receipt, chart and glass review: `node scripts/capture-scroll-polish.mjs` → `QA/scroll-polish/`.

GSAP controls only the particle score, using its [paused timeline API](https://gsap.com/docs/v3/GSAP/Timeline/).
The scene's existing scroll source remains authoritative; there is no second scroll listener or
smooth scrolling layer. Glass transmission renders at 75% resolution (50% on mobile).

Token edges use instanced milling; keep these small details in one draw call per token.

Visual references reviewed for composition and motion: [EverSwap by Lusion](https://lusion.co/projects/everswap/),
[Spline finance examples](https://spline.design/solutions/finance-and-banking), and
[Hermetica's consistent model system](https://blog.spline.design/how-hermetica-elevated-its-fintech-brand-with-3d-design).
These are visual references; all shipped model geometry is built locally in this folder.

Keep scroll choreography and pointer state inside their owning scenes. These components do not
own a canvas or event handlers. ProductUniverse reads its parent's motion clock so its animation
pauses with the product. Retain reduced motion and WebGL fallback
at the scene boundary. Supporting CSS illustrations should follow the same palette without
adding extra WebGL contexts.
