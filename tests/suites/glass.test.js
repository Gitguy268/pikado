import { suite } from '../harness.js';
import { el } from '/src/core/util.js';
import { getPref, setPrefs } from '/src/ui/dialogs/preferences.js';

/*
 * Someone who has asked their OS for less transparency, or for forced colours,
 * gets no glass whatever the preference says, and Chrome passes both settings
 * through from macOS and Windows. On such a machine "glass on" cannot be
 * observed, so these suites check the opaque look there instead of going red
 * for a contributor whose only fault is an accessibility setting.
 */
const osWantsOpaque = matchMedia('(prefers-reduced-transparency: reduce)').matches
  || matchMedia('(forced-colors: active)').matches;

/** Computed look of a throwaway surface of the given class. */
function look(cls) {
  const node = el(`div.${cls}`);
  document.body.appendChild(node);
  try {
    const cs = getComputedStyle(node);
    return {
      image: cs.backgroundImage,
      colour: cs.backgroundColor,
      filter: cs.backdropFilter || cs.webkitBackdropFilter,
    };
  } finally {
    node.remove();
  }
}

suite('glass / floating surfaces are glass, and Off gives back what was there', (t) => {
  const before = getPref('glass');
  try {
    /*
     * glass.css overrides each surface's own opaque look by specificity, so the
     * order the stylesheets load in does not matter. What this catches is that
     * override losing — the selector weakened, or glass.css dropping out of the
     * import graph.
     * Verified to fail: with `:root:not(.pk-glass-off)` cut from the glass rule,
     * menubar.css loads later and wins, and .pk-menu reports "none"; with the
     * glass.js import removed from main.js all four fail.
     */
    setPrefs({ glass: 'full' });
    for (const cls of ['pk-menu', 'pk-dialog']) {
      const s = look(cls);
      if (osWantsOpaque) {
        t.eq(s.image, 'none', `.${cls} is a flat colour when the OS wants no transparency`);
        t.eq(s.filter, 'none', `.${cls} leaves its backdrop alone when the OS wants no transparency`);
      } else {
        t.ok(s.image.includes('gradient'), `.${cls} is filled with the glass gradient, got ${s.image}`);
        t.ok(/blur\(/.test(s.filter), `.${cls} blurs its backdrop, got ${s.filter}`);
      }
    }

    /*
     * Off is not "glass made opaque", it is the surfaces Pikado had before: a
     * dialog on --s2 and a menu on --s3, which are different greys.
     * Verified to fail by dropping `p.glass === 'off'` from
     * applyStoredPreferences: the menu keeps its gradient and its blur.
     */
    setPrefs({ glass: 'off' });
    const menu = look('pk-menu');
    t.eq(menu.image, 'none', 'Off: a menu has no gradient');
    t.eq(menu.filter, 'none', 'Off: a menu does not filter its backdrop');
    /* Under forced colours the browser repaints every background in a system
       colour, so there the two greys cannot be told apart, or checked. */
    if (!matchMedia('(forced-colors: active)').matches) {
      t.eq(menu.colour, 'rgb(36, 36, 44)', 'Off: a menu is --s3 again');
      t.eq(look('pk-dialog').colour, 'rgb(28, 28, 34)', 'Off: a dialog is --s2 again');
    }
  } finally {
    setPrefs({ glass: before });
  }
});

suite('glass / refraction is a preference', (t) => {
  const root = document.documentElement;
  const before = { glass: getPref('glass'), glassRefraction: getPref('glassRefraction') };
  try {
    /* Verified to fail (in Chromium) by removing the classList.toggle from
       applyStoredPreferences: the first assertion then reports false.
       Refraction is deliberately never switched on outside Chromium, where the
       filter is accepted and not painted, nor where the OS wants no
       transparency, so that is what "on" means in those places. */
    const paints = 'userAgentData' in navigator && !osWantsOpaque;
    setPrefs({ glass: 'full', glassRefraction: true });
    t.eq(root.classList.contains('pk-glass-refract'), paints, 'switching it on marks the root, where it can be drawn');

    /* A lens over an opaque surface would be a filter with nothing to bend.
       Verified to fail by removing `!glassOff &&` from that toggle. */
    setPrefs({ glass: 'off' });
    t.eq(root.classList.contains('pk-glass-refract'), false, 'glass Off switches refraction off with it');

    setPrefs({ glass: 'full', glassRefraction: false });
    t.eq(root.classList.contains('pk-glass-refract'), false, 'and unticking it clears it');

    /* glass.css refers to this filter by id, so it has to be in the page. */
    const filter = document.getElementById('pk-glass-refract');
    t.ok(filter instanceof SVGFilterElement, 'the filter the stylesheet points at is in the page');
  } finally {
    setPrefs(before);
  }
});
