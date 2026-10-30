import '../vendor/liquid-glass.css';
import './glass.css';

/*
 * The edge-lens filter that glass.css points at when refraction is switched on.
 *
 * Adapted from LiquidGlass-UI (MIT — src/vendor/liquid-glass.LICENSE). Its
 * custom elements build this filter inside each shadow root and do not export
 * it, and Pikado builds its own menus and dialogs, so there is one copy here in
 * the page for every glass surface to share.
 *
 * Real glass bends light at its curved edge and leaves the middle alone, so the
 * displacement map is a smooth ramp, never noise: neutral 128 across the centre
 * and bending only in the outer band. Red carries x and blue carries y.
 *
 * One deliberate difference from the library: `primitiveUnits` is
 * objectBoundingBox. The library sizes its two maps as `width="100%"`, and in a
 * *backdrop* filter Chromium resolves that percentage to nothing, so the map is
 * empty, every pixel reads as "displace by minus half the scale", and the whole
 * backdrop slides up and left by 6px instead of bending at the rim. It hides
 * behind an 18px blur; with the blur off the options bar could be read through
 * the Filter menu, one row too low. Bounding-box units give the maps a size.
 * The price is that `scale` becomes a fraction of the surface too, so a tall
 * menu bends further than a toast — which is at least how a bigger lens behaves
 * (and is why glass.css keeps this off dialogs) — and that the library's
 * half-pixel softening of the map has to go, because half a bounding box is not
 * half a pixel. 0.2 was chosen on the two extremes, a 390px context menu and a
 * 35px toast: plainly bent at the rim of both, text area of neither disturbed.
 */
const EDGE = 0.18; // fraction of each side that refracts

function ramp(horizontal) {
  const dir = horizontal ? 'x2="1" y2="0"' : 'x2="0" y2="1"';
  const mid = horizontal ? 'rgb(128,0,0)' : 'rgb(0,0,128)';
  const hi = horizontal ? 'rgb(255,0,0)' : 'rgb(0,0,255)';
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" preserveAspectRatio="none">'
    + `<defs><linearGradient id="g" x1="0" y1="0" ${dir}>`
    + `<stop offset="0" stop-color="rgb(0,0,0)"/><stop offset="${EDGE}" stop-color="${mid}"/>`
    + `<stop offset="${1 - EDGE}" stop-color="${mid}"/><stop offset="1" stop-color="${hi}"/>`
    + '</linearGradient></defs><rect width="100" height="100" fill="url(#g)"/></svg>'
  );
}

/* sRGB interpolation keeps 128 a true neutral, so the flat centre of the map
   moves nothing; linearRGB would shift it and smear the whole surface. */
document.body.insertAdjacentHTML('beforeend',
  '<svg aria-hidden="true" width="0" height="0" style="position:absolute">'
  + '<filter id="pk-glass-refract" x="-8%" y="-8%" width="116%" height="116%"'
  + ' primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">'
  + `<feImage href="${ramp(true)}" preserveAspectRatio="none" x="0" y="0" width="1" height="1" result="mx"/>`
  + `<feImage href="${ramp(false)}" preserveAspectRatio="none" x="0" y="0" width="1" height="1" result="my"/>`
  + '<feBlend in="mx" in2="my" mode="screen" result="map"/>'
  + '<feDisplacementMap in="SourceGraphic" in2="map" scale="0.2" xChannelSelector="R" yChannelSelector="B"/>'
  + '</filter></svg>');
