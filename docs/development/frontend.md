# Frontend (`slunk-fe/`)

> Keep this page up to date: any change to the frontend's stack, structure or conventions updates it in the same change.

The frontend is a skeleton for now: a single placeholder page, with no routing or data fetching yet.

## Stack

| Piece | Choice |
|---|---|
| Build | Vite 8 |
| UI | React 19, TypeScript 6 |
| Components | shadcn/ui, style `base-lyra`, built on Base UI primitives (`@base-ui/react`) |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Fonts | Nunito Sans (body) and Outfit (headings), self-hosted through Fontsource |

## Structure

```
slunk-fe/
  components.json          shadcn configuration
  mise.toml                pinned Node version
  src/
    main.tsx               entry point: mounts <App /> inside ThemeProvider
    App.tsx                the app (a placeholder page for now)
    index.css              Tailwind setup, theme tokens (light and dark), fonts
    components/
      theme-provider.tsx   light / dark / system theme
      ui/                  shadcn components (only button so far)
    lib/utils.ts           cn() helper
```

## Conventions

### Components

- **Adding shadcn components:** use `npx shadcn@latest add <component>`. They're copied into `src/components/ui/` and become our code, so they get edited there rather than wrapped.
- **Building screens:** compose those components. Don't hand-build primitives that shadcn provides.
- **Icons:** they come from `lucide-react`.

### Styling

- **Configuration:** Tailwind 4 is configured in CSS (`src/index.css`); there's no `tailwind.config`. Theme tokens are CSS variables (`--background`, `--primary`, …), with a `.dark` block overriding them.
- **Colors:** use the tokens (`bg-background`, `text-muted-foreground`, …) rather than raw colors, so both light and dark themes work.
- **Classes:** merge them with `cn()`, exported from `@/lib/utils`.
- **Fonts:** `font-sans` (Nunito Sans) is the default; use `font-heading` (Outfit) for headings.

### Theme

`ThemeProvider` supports light, dark and system (the default). The choice is saved in `localStorage` under `theme`, and `useTheme()` reads and changes it.

Pressing `d` toggles between light and dark. It's ignored while typing in a field or when a modifier key is held.

### TypeScript

- **`strict`.**
- **`erasableSyntaxOnly`:** no `enum`, `namespace` or parameter properties.
- **`verbatimModuleSyntax`:** use `import type` for types.
- **Imports:** `@/` resolves to `src/`.

### Formatting and linting

- **Prettier:** no semicolons, double quotes, 2-space indent, ES5 trailing commas, 80 columns. `prettier-plugin-tailwindcss` sorts classes, including inside `cn()` and `cva()`. Run `npm run format` instead of formatting by hand.
- **ESLint:** the recommended JavaScript and typescript-eslint rules, plus react-hooks and react-refresh. Run `npm run lint`.
