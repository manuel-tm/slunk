# Frontend (`slunk-fe/`)

> Keep this page up to date: any change to the frontend's stack, structure or conventions updates it in the same change.

The frontend has phases 0 to 4:
- the app shell (sidebar with the Import button, page header) and a "not found" page;
- the dashboard: the backend's status, the catalog's totals, and the newest releases;
- the files pages: list, register, read and update;
- the catalog's pages: releases (with the release page and its edit tabs), artists (with their tabs), tracks, labels, release formats, release media and credit roles;
- tags: their definitions' pages, a release's Tags tab, its tags on the release page, a track's tags, and tag filters on the release and track lists;
- bulk edits on the release list: setting or removing a tag on many releases;
- the import: a release built from a folder, step by step;
- the library check: files missing, moved or changed on disk, unregistered files, and gaps in the catalog.

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
    routes/                one component per page (design §7.4)
      dashboard.tsx        /
      library-check.tsx    /library-check
      not-found.tsx        any unknown route or id
      files/               /files: list, create (register), read, update
      releases/
        list.tsx           /releases
        bulk-edit.tsx      the release list's bulk edits
        page.tsx           /releases/:id, the release page
        files.tsx          /releases/:id/files
        edit.tsx           /releases/create, and the edit tabs' frame
        forms/             details, tracks, files, credits and tags: the edit
                           tabs' forms, which the import's steps reuse
      artists/
        list.tsx, form.tsx /artists, create and update
        page.tsx           /artists/:id and its other tabs
      tracks/              /tracks: list, read, form
      labels/              /labels: list, read, form
      lists/               /release-formats, /release-media and
                           /credit-roles: one set of pages, by kind
      tags/                /tags: list, read, form
      import/steps.tsx     /import and its steps
    components/
      app-layout.tsx       the app shell: sidebar, and the page beside it
      app-sidebar.tsx      the sidebar: Import, the sections, the lists
      page-header.tsx      a page's breadcrumb title, buttons and tabs
      tab-links.tsx        tabs that are routes, for the header
      button-link.tsx      a link that looks like a button
      query-error.tsx      a failed request or save, with the backend's reason
      delete-button.tsx    Delete and its confirmation, or what blocks it
      list/                the list page frame, pager, search, sortable header
      picker.tsx           a combobox that searches the backend
      pickers.tsx          a picker per kind of row: artist, label, file, …
      ordered-list.tsx     picked rows in order, with up, down and remove
      chip-list.tsx        a compact picked list, for table rows
      credits-editor.tsx   credits as rows of role and artist
      file-links-editor.tsx  file links, each with a note
      file-uses.tsx        what uses a file, each linking to it
      tag-fields.tsx       a tag definition's fields, and the new-tag dialog
      tag-value-input.tsx  a tag value, suggesting a text tag's values
      tags-editor.tsx      a release's or track's tags, as rows to edit
      tag-values.tsx       a tag's values, each linking to the filtered list
      tag-filters.tsx      a list's tag filters: chips, and "Tag filter"
      release-table.tsx    the release table, with a column set per page
      names.tsx            names that link to their pages: "A, B & C"
      credit-lines.tsx     credits as "Producer – A, B", a line per role
      cover.tsx            a cover or picture, or a placeholder
      file-gallery.tsx     a primary image, then linked files
      folder-browser.tsx   browses the disk from the database's folder
      file-type.tsx        a file type's label and icon
      theme-provider.tsx   light / dark / system theme
      ui/                  shadcn components (see "Installed components" below)
    gql/                   GraphQL types and graphql() (generated)
    hooks/
      use-list-params.ts   a list's state in the query string
      use-debounced.ts     a value once it stops changing, for searches
      use-mobile.ts        useIsMobile(), used by the sidebar
    lib/
      apollo.ts            the Apollo client, and its cache's type policies
      format.ts            sizes, durations, dates, release dates, roles
      tags.ts              tag types, values, and the list's tag filters
      utils.ts             cn() helper
```

## Conventions

### Routes and pages

- **Routes** are defined in `src/router.tsx`, as children of the `AppLayout` route, which renders the sidebar beside the current page. They follow the route map in [design §7.4](../design/1_introduction.md#74-route-map), and are added as their phase is built. The last one, `*`, shows `NotFound`.
- **Pages** live in `src/routes/`, one component per route. Each one starts with a `PageHeader`: its breadcrumb title (`crumbs`), then its buttons and tabs as `children`, which go on the right. Every crumb but the last links to its `to`.
- **The sidebar** lists a section once its phase is built, in `sections` in `app-sidebar.tsx`, and the lists the user manages in their own group, `lists`. A section's link stays active on its pages below it (`/artists/12` keeps Artists active).
- **Tabs** that are routes, like an artist's or a release's edit tabs, use `TabLinks` (design §7.2: each tab is a route).
- **Wide tables** scroll inside the page: `SidebarInset` has `min-w-0`, so a table can't widen the page past the window.
- **Unknown ids:** a read or update page whose query returns null renders `NotFound` (design §7.2).
- **Links:** use React Router's `Link`.
  - shadcn components built on Base UI take it through their `render` prop: `<SidebarMenuButton render={<Link to="/" />}>`.
  - For a link that looks like a button, use `ButtonLink`. Don't render a `Link` inside `Button`: Base UI then gives the link `role="button"`, so assistive tech announces a button.
  - A plain `<a>` styled with `buttonVariants()` needs `cn()` around it, which drops the base classes the variant overrides. Otherwise `border-transparent` hides the outline's border.

### Data

- **Queries** are written with `graphql()` from `@/gql`, next to the component that uses them, and run with `useQuery` from `@apollo/client/react`. Each route sends one query, asking only for the fields it shows ([design §7.3](../design/1_introduction.md#73-loading-data)).
- **Types:** `npm run codegen` generates `src/gql/` from the backend's schema (`../slunk-be/src/slunk_web/schema/*.graphql`) and the `graphql()` calls in `src/`, so `graphql()` returns a typed document. Run it after writing a query, or after the backend's schema changes. The generated files are committed, and lint and Prettier skip them.
  - `graphql()` finds its types by the document's exact text, and Prettier may reformat a document. So run `npm run format` first, then `npm run codegen`.
  - Pieces several queries share are fragments, like `ArtistHeader`, spread with `...ArtistHeader`. Fragment masking is off, so their fields are on the query's data directly.
  - The types only have `__typename` when the query asks for it. To tell an interface's types apart, like a `TextTag` among tags, select `__typename` and compare it.
- **One query per route:** a page that needs a related name, like the release whose tracks a list filters on, asks for it in the same query, with `@include(if: …)`. The release edit tabs' header reads the release's title from the cache (`fetchPolicy: "cache-only"`), since each tab's own query fetched it.
- **Freshness:** queries use `cache-and-network`, set as the client's default. A page shows what's cached at once and asks the backend again, so a list never shows what was there before a change. After a delete, the page also evicts the deleted object from the cache.
- **Lists on cached objects,** like a release's tags, credits or artists, are always returned whole, so a new one replaces the cached one. `apollo.ts` marks them with `merge: false`. Without it, Apollo still replaces the list, but warns in the console when it gets shorter. A new list field on `Release`, `Track` or `Artist` goes there too.
- **Mutations** reject when they fail, so callers wrap them in `try`. The page shows the error with `QueryError`, from the hook's `error`, and stays where it is.
- **The backend:** the Apollo client sends requests to `/graphql`. Files are at `/raw/files/:id`, for `<img>`, `<audio>` and "Open the file". In development, Vite proxies `/graphql` and `/raw` to the backend at `127.0.0.1:4000`, and so does `vite preview`. Nothing else is proxied, so `/files/12` is always the app's page.

### Lists

Lists follow design §7.2:
- **State:** `useListParams()` keeps a list's state in the query string: `page`, `sort`, `q` and filters such as `?type=` and `?unused=1`. Changing anything but the page goes back to page 1. Typing in the search box replaces the history entry instead of adding one. Filters that can repeat, like tag filters, are added with `append` and removed one value at a time with `remove`.
- **Controls** (`components/list/`):
  - `Pager`: "1–50 of 172", with previous and next.
  - `SearchBox`: searches after a pause in typing.
  - `SortableHead`: a header that cycles ascending (`?sort=path`), descending (`?sort=-path`), then the default.
- **Size:** lists ask for 50 rows a page.
- **Frame:** `ListLayout` is a list page's frame: the header and its New button, the search box, filters, the pager, then the table, or what's there while it loads, fails or is empty.
- **The release table** (`ReleaseTable`) is shared by the release list and the label and artist pages, each with its own columns (design §7.6). With `selection`, each row gets a checkbox, and the header's selects the page.
- **The tags list** (`/tags`) is the exception to the frame: it shows a table per type (design §7.8), each with every tag of that type, up to 200, and a note to search when there are more. The search box and the name sort apply to all three.

### Forms

- **One form** serves both create and update, built from shadcn `field`s. It loads first, then renders a form component that keeps the values in state, starting from what loaded.
- **Labels:** every control has one. A `Select` gets an `id` on its `SelectTrigger`, which the `FieldLabel`'s `htmlFor` points at.
- **Saving** goes to the read page. When a save fails, the form stays and shows the backend's reason, which is often the database's own message (a CHECK or a trigger).
- **Pickers** (design §7.2): artists, labels, formats, media, credit roles, releases, files and tags are chosen with the pickers in `pickers.tsx`, each a `Picker` that searches the backend as the user types and offers the first 20 matches. Except for files and releases, a picker also offers to create what was typed ("Create artist 'Robbie Nevil'"). Each picker owns its query, so its results stay typed.
  - `Picker` is generic over its option type, so an option can carry more than an id and a name. A `TagOption` also has the tag's type, its id within the type, and whether it's multiple. Its `id` is `type:id`, since ids repeat across types.
  - `TagPicker` with `creatable` asks for the rest of a new tag in a dialog (`NewTagDialog`): its type, and single or multiple. Cancelling it creates nothing, since `onCreate` can return null.
  - `TagValuePicker` adds a value to a multi-value text tag: one that other releases already have, the most used first, or what was typed ("Add 'Funk'"). A single text value (`TagValueInput`) suggests the same values through a `<datalist>`.
- **Ordered lists** (release artists, labels, formats, media, a track's artists and features) use `OrderedList`, whose order sets `position`. A track row uses the compact `ChipList`. Credits use `CreditsEditor`, and file links `FileLinksEditor`.
- **The release forms** in `routes/releases/forms/` each take a release id and an `onSaved`, so the edit tabs and the import's steps use the same ones (design §7.6).
- **A dialog with its own form,** like `NewTagDialog`, calls `stopPropagation()` on submit. The dialog is portaled out of the page's form in the DOM, but React still bubbles the submit event to it, which would save the page's form too.

### Deleting

Delete is a button on the read page that opens an `alert-dialog` (design §7.2). `DeleteButton` does it for every entity:
- While something uses the row, the dialog lists what, instead of offering to delete. The reasons are the entity's `blockers`, from the backend.
- After a delete, the app goes to the list, with a toast.

### Import

`routes/import/steps.tsx` is the import (design §7.9), a route per step, with a stepper at the top whose steps are links once the release exists:
1. **Folder** (`/import?path=…`): the `FolderBrowser`.
2. **Release** (`/import/release?folder=…`): the details form, prefilled from `releaseSuggestion`. Tag artist names that match an artist are picked already, and the others are named so they can be created. Saving replaces the history entry with `/import/:id/release?folder=…`, where going back edits the release.
3. **Tracks:** the tracks form with `folder`. There's a row for each audio file in the folder that isn't a track yet, prefilled from `trackSuggestions`. On a regular release, tag artists who are release artists aren't added to the tracks.
4. **Cover & files:** the folder's images and other files. The cover is chosen among the images, defaulting to one named cover, folder or front. Each other file gets a checkbox and a note. The cover isn't also a file link.
5. **Credits:** the credits form.
6. **Tags:** the tags form. Finish opens the release page.

Files are registered only when a step saves them, together with what uses them.

### Tags

- **Routes** include the type, `/tags/:type/:id`, where the type is `text`, `number` or `date`. An unknown type shows `NotFound`.
- **The release page** shows a row per tag after Released, as "Genre: Pop, Rock". Each value links to the release list filtered by it (`TagValues`). Date values show as dates ("Mar 1, 2024").
- **The Tags tab** (`forms/tags.tsx`) edits the release's tags with `TagsEditor`. A single-value tag is one input, and a multi-value tag is a `ChipList`. "Add a tag" picks one, or creates it. Saving sends every tag, and an emptied one is removed.
- **Tracks** have tags too. The track form has a Tags section, the same `TagsEditor`, saved with the rest of the track. The track page shows them, each value linking to the track list filtered by it.
- **The tag pages** count releases and tracks. A text tag's values table has both counts, each linking to its filtered list.
- **List filters,** on `/releases` and `/tracks`, are query string parameters, one per filter, which all have to match (`lib/tags.ts`):

  | Parameter | Matches |
  |---|---|
  | `text.3=Rock` | Text tag 3 is Rock, ignoring case |
  | `text.3.contains=ro` | Text tag 3 contains "ro" |
  | `number.5=8` | Number tag 5 is 8 |
  | `number.5.min=8`, `number.5.max=10` | Number tag 5 is at least 8, at most 10 |
  | `date.2=2024` | Date tag 2 is in 2024: a date can be a year, a month or a day |
  | `date.2.min=2024-03`, `date.2.max=2024` | Date tag 2 is on or after March 1, 2024, on or before Dec 31, 2024 |

  "Genre is Rock and Score ≥ 8" is `?text.3=Rock&number.5.min=8`. Each filter is a chip ("Score ≥ 8") that removes it, and "Tag filter" adds one: "is" or "contains" for text, a range for numbers and dates (`TagFilters`). The list names the chips with `tagsByRef`, in its one query.

### Bulk edits

The release list's rows have checkboxes (`bulk-edit.tsx`). The selection is kept by id, across pages, until it's cleared.
- **Selecting:** a row's checkbox, or the header's for the page. "Select all N that match" asks `releaseIds` for every release the filters match.
- **Set a tag:** a tag and a value. A single-value tag gets the value instead of its old one, and a multi-value tag gets it added. The tag picker can create a tag.
- **Remove a tag:** a tag, and a value to remove only that one.
- After each, a toast says how many releases changed, and the list is fetched again (`refetchQueries`). The selection stays, for another edit.

### Library check

`/library-check` runs the check when it opens, and again after "Check again" or a fix. It's `network-only`, since a cached result would be out of date. Each kind of problem is a section with its count, and "None." when there's nothing:
- **Missing files:** what uses each one (`FileUses`), and where it may have moved. "Relink" points the record at a path, and "Relink all N found" does it for every file whose likely new path is clear. A file found nowhere links to its edit page.
- **Changed files:** the size change and modification time. "Rehash" reads one again, and "Rehash all" all of them.
- **Unregistered files,** by folder, with "Register…", which opens `/files/create?folder=…`.
- **Releases with no artist** and **tracks nobody performs,** each linking to the edit tab that fixes it.

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
