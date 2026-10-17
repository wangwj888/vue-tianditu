# heatmap.js 2.0.5

This directory contains the Canvas core from the published `heatmap.js@2.0.5`
package, licensed under MIT. See `LICENSE`; the full notice is also embedded in
the JavaScript file so it remains available to distribution bundles.

Upstream package: https://registry.npmjs.org/heatmap.js/2.0.5

Original file: `build/heatmap.js`, retrieved from
https://cdn.jsdelivr.net/npm/heatmap.js@2.0.5/build/heatmap.js

Original UTF-8 source SHA-256:
`855f883ebd15ab81c07636b2721ddf5f2435aa74327ec34797c34c4aa7de2b23`

The local source has two behavioral adaptations:

1. Replace the UMD loader wrapper with an ES module default export.
2. Remove the redundant `img.data = imgData` assignment. `imgData` already
   references `img.data`, and the preceding loop mutates that typed array in
   place. Assigning the read-only property throws in strict ES modules.

The overlay adapter uses public `create` and `setData` APIs. It re-creates the
Canvas instance when its size or rendering options change, without accessing
private renderer fields. This upstream source is intentionally not reformatted.
