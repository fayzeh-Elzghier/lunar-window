# Local renderer dependency

Three.js 0.170.0 (MIT), from the npm package `three@0.170.0`:

- `build/three.module.js`
- `examples/jsm/controls/OrbitControls.js`
- Original `LICENSE`

The OrbitControls bare `three` import is changed to `./three.module.js` for local, build-free loading. No runtime CDN or backend is required. Serve `docs/` over HTTP for ES-module loading.
