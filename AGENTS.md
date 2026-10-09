# AGENTS.md

Guidance for AI coding agents working in this repository. People should start with [README.md](README.md).

## Project

Slunk is a local music library manager. Its SQLite database is the source of truth for all music metadata, and it only *reads* the user's music files.

## Where things are

- **[`docs/design/`](docs/design/): design docs.** These are the plans, used for planning and prompting. [`1_introduction.md`](docs/design/1_introduction.md) is the base design. Read its relevant sections before changing the data model, migrations, backend structure, or anything that touches files.
- **The rest of [`docs/`](docs/README.md): what's actually built,** kept up to date with the code. Start at `docs/README.md`.
- **`slunk-fe/`: the frontend skeleton.** How it's built: [`docs/development/frontend.md`](docs/development/frontend.md).
- **`slunk-be/`: doesn't exist yet.** It's planned in design doc §5–§6. Don't assume any backend code or `db:*` scripts exist until phase 0 creates them.

Work happens in phases (design doc §7). Stay within the current phase unless asked otherwise.

## Workflow: design → code → docs

The full process is in [docs/README.md](docs/README.md#how-we-work).

- **Build from the design docs.**
- **Keep `docs/` up to date.**
  - Any change that affects something documented updates the docs in the same change: requirements and setup, commands and scripts, project structure, conventions, and behavior.
  - If you find a doc that no longer matches the code, fix it, even if your change didn't cause it.
  - Document only what exists, and never copy plans from `docs/design/` into the rest of `docs/`.
- **Leave finished design docs alone.** `docs/design/` is mostly the project's history. A design doc is only edited while that design is being developed; after that, it changes only through appendices.
- **When the code shows a design has to change:**
  - Don't rewrite the design text. Add an appendix at the end of that design doc, plus a one-line note at the affected section.
  - If it changes a design decision (not just a detail), ask before going ahead.
- **New design topics** get a new numbered doc, `docs/design/N_topic.md`, and a row in the index table at the top of `1_introduction.md`.

## Rules

### Never write to the user's music files

- Slunk never moves, copies, renames, deletes or retags a user's file. Code that touches the user's files may only read them.
- The only things Slunk writes are next to its database: `slunk.db`, SQLite's `-wal`/`-shm` files, and `slunk-backups/`.
- For development and tests, point `SLUNK_DB` at a scratch folder with sample files. Never point it at a real music library.

### The database is the part built to last

Everything else is a proof of concept, so favor speed there. For the database:

- Follow design doc §4: the conventions (§4.2) and the design decisions (§4.3), including the delete rules and how credits work.
- Change the schema only through a new migration. Never edit a migration that has already been committed.
- Enforce integrity in the database (constraints, triggers) wherever it can be expressed, not only in app code.

### Not designed yet: external libraries

Don't implement export or sync, and don't add tables for it. It needs `docs/design/2_external_libraries.md` written and agreed first.

## Before you finish

- **Frontend:** in `slunk-fe/`, `npm run typecheck` and `npm run lint` pass, and `npm run format` has been run.
- **Backend** (once it exists): the same checks, plus migrations apply and roll back cleanly on a fresh database.
- **Docs:** everything in `docs/` outside `docs/design/` matches the code after your change, and any design change is recorded as an appendix.
- **Report:** say what you verified and what you didn't.
