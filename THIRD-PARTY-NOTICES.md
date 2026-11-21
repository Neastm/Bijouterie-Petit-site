# Third-party notices

## React Bits LiquidChrome
Source: https://github.com/DavidHDev/react-bits/tree/main/src/content/Backgrounds/LiquidChrome
The LiquidChrome GLSL shader is adapted in dist/liquid.js. React wrapper replaced with a vanilla WebGL2 renderer, cream/gold tone floor and a radial moving weight field. Original source is retained in blender/ReactBits-LiquidChrome.original.jsx.

+MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Three.js
Three.js and GLTFLoader, RoomEnvironment, BufferGeometryUtils are used under the MIT license. See dist/vendor/LICENSE.

## Branding and photography
Logo from the existing Bijouterie Petit website. The PRX visual study reproduces the user-supplied Tissot watch reference; trademarks remain the property of their owners. This is a design preview, not an official Tissot model or manufacturer asset.

## Refined version
ScrollReveal, BlurText and SpotlightCard were retrieved through the React Bits registry plugin. Their interaction patterns are adapted to vanilla DOM in dist/reactbits-adapted.js; this is not a React component import. The vitrine image is from the historic website solitaire_diamant__p353673.html. Decorative ring/clock are illustrations, not inventory photographs.


Glass surfaces (V7): design and backdrop displacement approach adapted from David Haz / React Bits GlassSurface. Official reference: https://reactbits.dev/components/glass-surface and https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/GlassSurface . Existing React Bits license notice applies. Vanilla DOM/SVG/CSS adaptation; Safari/Firefox use backdrop blur fallback.

## React Bits LaserFlow
The beam noise and advected streak motif in dist/gold-laser.js adapt David Haz / React Bits LaserFlow. Source: https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/LaserFlow/LaserFlow.jsx . The React Bits license notice above applies.


## Counter presentation
The timer and carousel lifecycle pattern was reviewed against React Bits Carousel
(https://reactbits.dev/components/carousel, David Haz). hero-counter.js is a
custom vanilla Web Animations implementation for the two presentation photographs.
Product images and counter interior are generated illustrative assets. The frontal
storefront is an AI reconstruction of the supplied street photograph and requires
owner validation before representing exact architectural details.


## Side presentation update
The counter and single-hand product photographs are generated illustrative assets.
hero-counter-v2.js changes presentations only at a scroll threshold. The withdrawal
(340 ms), brief empty counter (60 ms) and arrival (580 ms) are real-time transitions.
The final 24-pixel sleeve strip is composited into an SVG continuation so the arm
reaches the viewport edge at every aspect ratio. The watch, hand and ring remain
at their original image proportions. The interior and storefront require owner
validation before being used as exact representations of the real shop.
