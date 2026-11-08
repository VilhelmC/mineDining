# app — mineDining PWA

*React + TypeScript + Vite PWA. Thread C-APP; ledger rows C-1..C-6.*

## Run (Windows PowerShell, from the project root)

```
npm install
npm run dev
```

First time after the switch to workspaces (2026-11-08): delete `spec\validator\node_modules` and the root `node_modules` before installing — a leftover `spec\validator\node_modules\.bin\tsc` breaks the spec package's build. `npm install` at the root installs both workspaces (`spec/validator`, `app`) and builds the spec package. `npm run dev` serves on the LAN (`--host`); open `http://localhost:5173` on the PC. A phone on the LAN over plain http gets no Wake Lock and no service worker (secure context needed) — see LEDGER row C-6.

```
npm test
npm run build -w app
```

## Layout

| Path | What |
|---|---|
| `src/recipes.ts` | loads `spec/fixtures/*.recipe.json` (bundled) through `migrate()` + `validate()` |
| `src/router.ts` | hash routes `#/`, `#/r/<id>`, `#/r/<id>/graph`, `#/r/<id>/cook` |
| `src/views/` | `RecipeList`, `RecipeView`, `GraphView` (React Flow + dagre, lazy-loaded), `CookingMode` |
| `src/cook/scheduler.ts` | live scheduler on `Step.dependsOn` — pure; rules in its header comment; tests beside it |
| `src/cook/alerts.ts`, `wakeLock.ts`, `storage.ts` | sound/vibration/notification, screen wake lock, session persistence |
| `public/` | icons; `icon.svg` is the source |

## Cooking-mode behaviour (settled with Vilhelm 2026-11-08)

- Passive steps are started by the cook and run in a background tray; active steps are worked one at a time. Ready = all `dependsOn` done. Steps complete only on Done.
- Fixed duration → alert at the end. Range → "check" alert at min, "end" alert at max. `until` only → stopwatch, no alert.
- Timers are wall-clock, so they survive a locked phone; alerts cannot ring while the page is suspended — overdue timers show on return. Sound + vibration (not iOS Safari) + flashing banner; optional system notification when the page is hidden (permission asked; unreliable on iOS).
- Session saved in localStorage per recipe (resume / start over).
- Prep steps (preheat) start at their latest start: due when the step waiting on them can begin within the prep's duration (critical path with live timers, or the cook's remaining hands-on work, whichever is longer). A "Start now" alert fires once. Untimed steps count 5 min hands-on, 10 min waiting (estimates).
- Everywhere in the app, steps follow the plan cook mode would suggest (`plan()` simulates it) and are numbered in that order; the recipe page shows planned start times and the estimated total.
