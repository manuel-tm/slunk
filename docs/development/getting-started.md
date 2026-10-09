# Getting started

> Keep this page up to date: any change to requirements, setup or scripts updates it in the same change.

## Requirements

- [mise](https://mise.jdx.dev/), which installs the pinned Node version
- Node 26.10.0, pinned in `slunk-fe/mise.toml`
- npm, which comes with Node

## Frontend

```sh
cd slunk-fe
mise install
npm install
npm run dev
```

Vite prints the local URL when it starts.

Scripts, run inside `slunk-fe/`:

| Script | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server |
| `npm run build` | Type-checks and builds for production |
| `npm run typecheck` | Runs TypeScript without emitting |
| `npm run lint` | Runs ESLint |
| `npm run format` | Formats `.ts`/`.tsx` files with Prettier |
| `npm run preview` | Serves the production build |

How the frontend is built is described in [frontend.md](frontend.md).

## Backend

The backend doesn't exist yet. It arrives in phase 0 ([design §7](../design/1_introduction.md#7-phases)), and its setup will be documented here then.
