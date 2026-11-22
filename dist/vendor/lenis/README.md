Lenis 1.3.27 - https://github.com/darkroomengineering/lenis/tree/v1.3.27

MIT license in LICENSE. Vendored locally: no runtime CDN dependency.

These seven JavaScript modules are the official packages/core/src/*.ts files
(excluding the type-only types.ts), transpiled using Node 24
module.stripTypeScriptTypes(source, {mode:'transform'}). Relative module imports
have explicit .js extensions, and the package.json version import is replaced
with its pinned value '1.3.27'. No scrolling algorithms were rewritten.
lenis.css is the official packages/core/lenis.css from the same release.

Site integration: ../../smooth-scroll.js. Native window coordinates, smooth
wheel with lerp 0.12 and multiplier 0.9, native touch, no transformed wrapper.
The GSAP ticker drives Lenis only during easing and is removed after settling.
Reduced motion destroys the instance and restores native browser scrolling.
Anchors retain URL hashes and move keyboard focus to their destination.
