# OUTBREAK LOG

## Concept

OUTBREAK LOG is a free-to-distribute, single-page web toy in which the player watches a small group of survivors try to outlast a zombie outbreak. The simulation resolves each day from the survivors' MBTI types, traits, relationships, and dwindling inventory, and reports the outcome as entries in a survival log.

No backend, no login, no analytics. It ships as static files to GitHub Pages or Vercel.

## Stack

- Vite + React 18 + TypeScript (strict, `any` is banned)
- Tailwind CSS v3 for layout and spacing utilities only; design tokens live in `src/styles/globals.css`
- Zustand — one store, sliced by domain
- No router; a single page
- Path alias `@/` → `src/`

## Design tokens

Defined as CSS custom properties in `src/styles/globals.css` and mirrored into `tailwind.config.js`. **These are the only colors in the product. Do not add new ones.**

| Token          | Value     | Use                                          |
| -------------- | --------- | -------------------------------------------- |
| `--ash-900`    | `#0B0D10` | Cold charcoal, blue-leaning — base background |
| `--ash-800`    | `#14171C` | Panel background                             |
| `--ash-700`    | `#1D2128` | Raised surface, input fields                 |
| `--oxblood`    | `#2A1518` | Dried blood — gradients and borders only      |
| `--blood`      | `#8E1B21` | Primary accent — dried arterial               |
| `--blood-hot`  | `#E85D52` | Critical / death states ONLY                  |
| `--bile`       | `#6E7A3A` | Infection meter and infected states ONLY      |
| `--bone`       | `#D8D2C6` | Primary text, warm off-white                  |
| `--fog`        | `#8A8F98` | Labels, secondary text, disabled              |

Derived: `--page-bottom: #0F0A0C` (bottom stop of the base gradient) and `--panel-border: color-mix(in srgb, var(--oxblood) 70%, transparent)`.

### Background rule

The page background is never a flat black. Three layers, all on `body`:

1. Base `linear-gradient` from `--ash-900` at top to `--page-bottom` at the bottom.
2. A large `radial-gradient` centered near the top of the viewport — `--oxblood` at ~18% opacity fading to transparent, as if light is bleeding through from above.
3. A film-grain overlay: inline SVG `feTurbulence` data URI on `body::after`, ~4% opacity, `position: fixed`, `pointer-events: none`.

Panels sit on `--ash-800` with a 1px `--panel-border` and **no border-radius above 2px**. This world is not friendly; keep corners sharp.

## Typography

Loaded from Google Fonts and jsDelivr in `index.html`.

- **Display** (headers, panel titles, numbers): `Bebas Neue` for Latin, `Black Han Sans` for Korean. Uppercase, letter-spacing `-0.01em`. Used sparingly. → `.type-display` / `font-display`
- **Body/UI**: `Pretendard Variable` (cdn.jsdelivr.net/gh/orioncactus/pretendard). Default for all Korean UI text. → `font-body`
- **Log/data**: `IBM Plex Mono` with Pretendard as the Korean fallback. The survival log and every numeric stat use this face. → `.type-data` / `font-mono`

Type scale: **11 / 13 / 15 / 20 / 28 / 44px** (Tailwind `text-xs`/`sm`/`base`/`lg`/`xl`/`2xl`). Body is 13–15px. Labels are 11px uppercase, letter-spacing `0.08em`, color `--fog` → `.type-label`.

## Folder structure

```
src/
  app/App.tsx            root shell
  components/            shared UI panels
  features/
    survivors/
    relationships/
    inventory/
    log/
    simulation/
  data/                  static tables: mbti, traits, items, event templates
  store/                 zustand store + one slice per domain
  styles/globals.css     tokens, background, base type
  types/index.ts         shared domain types
```

## Conventions

- **Korean UI copy, English code.** Every user-facing string is Korean; identifiers, comments, filenames, and commit messages are English.
- **No new colors.** Use only the tokens above. If a state seems to need a new color, it needs a different token, not a new hex.
- `--blood-hot` is reserved for critical and death states; `--bile` is reserved for infection. Never use them decoratively.
- **Sharp corners.** `border-radius` never exceeds 2px.
- **Tailwind for layout and spacing; tokens for color and type.** Don't inline hex values in class names or styles.
- **Every text/background pair clears 4.5:1.** `--blood-hot` was lightened from `#C8322B` for this; it measured 3.38:1 on `--ash-800`. `--fog` passes on every surface (5.53:1 on `--ash-800`). Re-measure before changing either.
- **`prefers-reduced-motion: reduce` is respected** — animations and transitions collapse globally in `globals.css`. Any new motion must degrade there too.
- **Strict TypeScript, no `any`.** Prefer explicit domain types from `@/types`.
- Store access goes through selectors: `useStore((s) => s.survivors)`.
- No backend calls, no persistence beyond `localStorage`, no analytics.

## Commands

```
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build to dist/
npm run typecheck
```
