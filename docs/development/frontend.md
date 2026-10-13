# Frontend (`slunk-fe/`)

> Keep this page up to date: any change to the frontend's stack, structure or conventions updates it in the same change.

The frontend has phases 0 and 1:
- the app shell (sidebar and page header) and a "not found" page;
- the dashboard: the backend's status, and how many files are registered and unused;
- the files pages: list, register, read and update.

## Stack

| Piece | Choice |
|---|---|
| Build | Vite 8 |
| UI | React 19, TypeScript 6 |
| Routing | React Router 8, in data mode (`createBrowserRouter`) |
| Data | Apollo Client 4, with types from graphql-codegen's client preset |
| Components | shadcn/ui, style `base-lyra`, built on Base UI primitives (`@base-ui/react`) |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Fonts | Nunito Sans (body) and Outfit (headings), self-hosted through Fontsource |
| Toasts | sonner |
| Dates | react-day-picker and date-fns, used by `calendar` |

## Structure

```
slunk-fe/
  codegen.ts               graphql-codegen configuration
  components.json          shadcn configuration
  mise.toml                pinned Node version
  vite.config.ts           Vite configuration, with the proxy to the backend
  src/
    main.tsx               entry point: mounts the router and the <Toaster />
                           inside ThemeProvider, ApolloProvider and
                           TooltipProvider
    router.tsx             the routes
    index.css              Tailwind setup, theme tokens (light and dark), fonts
    routes/                one component per page
      dashboard.tsx        /
      not-found.tsx        any unknown route or id
      files/
        list.tsx           /files
        create.tsx         /files/create: browse for a folder, register files
        read.tsx           /files/:id
        update.tsx         /files/:id/update
    components/
      app-layout.tsx       the app shell: sidebar, and the page beside it
      app-sidebar.tsx      the sidebar and its section links
      page-header.tsx      a page's breadcrumb title, buttons and tabs
      button-link.tsx      a link that looks like a button
      query-error.tsx      a failed request or save, with the backend's reason
      list/                pager, search box and sortable column header
      folder-browser.tsx   browses the disk from the database's folder
      file-type.tsx        a file type's label and icon
      theme-provider.tsx   light / dark / system theme
      ui/                  shadcn components (see "Installed components" below)
    gql/                   GraphQL types and graphql() (generated)
    hooks/
      use-list-params.ts   a list's state in the query string
      use-mobile.ts        useIsMobile(), used by the sidebar
    lib/
      apollo.ts            the Apollo client
      format.ts            sizes, dates and times
      utils.ts             cn() helper
```

## Conventions

### Routes and pages

- **Routes** are defined in `src/router.tsx`, as children of the `AppLayout` route, which renders the sidebar beside the current page. They follow the route map in [design §7.4](../design/1_introduction.md#74-route-map), and are added as their phase is built. The last one, `*`, shows `NotFound`.
- **Pages** live in `src/routes/`, one component per route. Each one starts with a `PageHeader`: its breadcrumb title (`crumbs`), then its buttons and tabs as `children`, which go on the right. Every crumb but the last links to its `to`.
- **The sidebar** lists a section once its phase is built, in `sections` in `app-sidebar.tsx`. A section's link stays active on its pages below it (`/artists/12` keeps Artists active).
- **Unknown ids:** a read or update page whose query returns null renders `NotFound` (design §7.2).
- **Links:** use React Router's `Link`.
  - shadcn components built on Base UI take it through their `render` prop: `<SidebarMenuButton render={<Link to="/" />}>`.
  - For a link that looks like a button, use `ButtonLink`. Don't render a `Link` inside `Button`: Base UI then gives the link `role="button"`, so assistive tech announces a button.
  - A plain `<a>` styled with `buttonVariants()` needs `cn()` around it, which drops the base classes the variant overrides. Otherwise `border-transparent` hides the outline's border.

### Data

- **Queries** are written with `graphql()` from `@/gql`, next to the component that uses them, and run with `useQuery` from `@apollo/client/react`. Each route sends one query, asking only for the fields it shows ([design §7.3](../design/1_introduction.md#73-loading-data)).
- **Types:** `npm run codegen` generates `src/gql/` from the backend's schema (`../slunk-be/src/slunk_web/schema/*.graphql`) and the `graphql()` calls in `src/`, so `graphql()` returns a typed document. Run it after writing a query, or after the backend's schema changes. The generated files are committed, and lint and Prettier skip them.
- **Freshness:** queries use `cache-and-network`, set as the client's default. A page shows what's cached at once and asks the backend again, so a list never shows what was there before a change. After a delete, the page also evicts the deleted object from the cache.
- **Mutations** reject when they fail, so callers wrap them in `try`. The page shows the error with `QueryError`, from the hook's `error`, and stays where it is.
- **The backend:** the Apollo client sends requests to `/graphql`. Files are at `/raw/files/:id`, for `<img>`, `<audio>` and "Open the file". In development, Vite proxies `/graphql` and `/raw` to the backend at `127.0.0.1:4000`, and so does `vite preview`. Nothing else is proxied, so `/files/12` is always the app's page.

### Lists

Lists follow design §7.2:
- **State:** `useListParams()` keeps a list's state in the query string: `page`, `sort`, `q` and filters such as `?type=` and `?unused=1`. Changing anything but the page goes back to page 1. Typing in the search box replaces the history entry instead of adding one.
- **Controls** (`components/list/`):
  - `Pager`: "1–50 of 172", with previous and next.
  - `SearchBox`: searches after a pause in typing.
  - `SortableHead`: a header that cycles ascending (`?sort=path`), descending (`?sort=-path`), then the default.
- **Size:** lists ask for 50 rows a page.

### Forms

- **One form** serves both create and update, built from shadcn `field`s.
- **Labels:** every control has one. A `Select` gets an `id` on its `SelectTrigger`, which the `FieldLabel`'s `htmlFor` points at.
- **Saving** goes to the read page. When a save fails, the form stays and shows the backend's reason, which is often the database's own message (a CHECK or a trigger).

### Deleting

Delete is a button on the read page that opens an `alert-dialog` (design §7.2):
- While something uses the row, the dialog lists what, instead of offering to delete.
- After a delete, the app goes to the list, with a toast.

### Components

- **Adding shadcn components:** use `npx shadcn@latest add <component>`. They're copied into `src/components/ui/` and become our code, so they get edited there rather than wrapped.
- **Building screens:** compose those components. Don't hand-build primitives that shadcn provides.
- **Icons:** they come from `lucide-react`.

**Installed components**, in `src/components/ui/`:

| Purpose | Components |
|---|---|
| Layout and navigation | `sidebar`, `breadcrumb`, `separator`, `scroll-area`, `tabs` |
| Showing data | `table`, `card`, `item`, `badge`, `avatar`, `skeleton`, `empty`, `tooltip` |
| Forms | `field`, `label`, `input`, `input-group`, `textarea`, `select`, `combobox`, `checkbox`, `switch`, `toggle`, `toggle-group`, `calendar` |
| Overlays | `dialog`, `alert-dialog`, `sheet`, `popover`, `dropdown-menu` |
| Feedback | `sonner` (toasts), `alert`, `progress`, `spinner` |
| Actions | `button` |

**Local changes to shadcn files.** Re-adding a component with `--overwrite` replaces it with the registry version, so reapply these afterwards:
- `sonner.tsx` reads the theme from our `ThemeProvider` (`@/components/theme-provider`) instead of `next-themes`, which isn't installed.
- `hooks/use-mobile.ts` subscribes to the media query with `useSyncExternalStore`. The registry version sets state inside an effect, which the react-hooks lint rule rejects.
- `scroll-area.tsx` has its unused `React` import removed, which `tsc -b` rejects.

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
