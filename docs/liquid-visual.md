# WebGL visual implementation

The user explicitly rejected the leaf illustration and provided a reference image naming four projects. The current page replaces that image with an interactive V brand mark.

| Project | Actual use |
| --- | --- |
| pmndrs/react-three-fiber 9.8.2 | Real Three.js bevelled geometry, lighting, environment reflections, pointer-responsive motion and lifecycle |
| ruucm/shadergradient 2.4.20 | Actual renderer package, animated water-plane field behind the brand mark |
| dashersw/liquid-glass-js | MIT rounded-rectangle optical/refraction functions adapted into a WebGL decorative glass panel; not its DOM-screenshot engine |
| collidingScopes/liquid-logo | MIT fragment shader rendered into a local texture, used by the V metal material |

Vendor source and full MIT notices are under `visuals/vendor/`. No account data or DOM screenshots are sent anywhere by the graphics. Sources, exact revisions and renderer settings are documented in DESIGN.md. The original SVG leaf is not referenced by the UI.

Build: `npm run build:visual` (also runs as part of `npm run build`). `public/liquid-hero.js` is the minified browser bundle committed for the dependency-free local HTTP launcher. Existing Vite toolchain provides esbuild.

The visual is decorative, not a chart or return forecast. It has a motion toggle, reduced-motion default, capped pixel density, offscreen/page-hidden unmounting and a non-WebGL V fallback. Confirmed on the deployed app: two actual visible WebGL canvases, no captured browser error logs, working pause/resume control and no horizontal overflow at checked desktop/mobile widths. Screenshots were captured with motion paused. Full-page WebGL capture was unavailable; viewport captures are retained instead.

![Desktop](images/verdant-liquid-desktop.jpg)
![Mobile](images/verdant-liquid-mobile.jpg)

The previous static design audit reports are historical, not a claim that this intentionally shader-led visual has no warnings. The 27 research/API regression tests passed; price/scoring/financial calculations were not changed.
