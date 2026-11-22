Logo Loop - React Bits by David Haz.

Upstream: https://github.com/DavidHDev/react-bits/blob/80e1a686142ac7b4a21fcb4b75e3a9606314c9ef/src/content/Animations/LogoLoop/LogoLoop.jsx
License: LICENSE.md (MIT + Commons Clause, commercial website use permitted).

The horizontal Logo Loop mechanism is adapted for this buildless site in
../../logo-loop.js and ../../exclusivities.css: duplicated sequences sized by
ResizeObserver, modulo-wrapped offsets, exponential velocity smoothing with
SMOOTH_TAU 0.25, and faded edges. GSAP's existing ticker replaces the React
hook/requestAnimationFrame loop. Animation suspends offscreen and on hidden tabs;
reduced motion displays a static wrapping list. Mouse hover gently stops motion.
The section is passive and never captures touch or wheel gestures.
