# Slunk

A local music library manager. Slunk keeps its own database as the source of truth for your music's metadata, and only reads your music files.

> **Status:** early. The base design, [Introduction to Slunk](docs/design/1_introduction.md), is complete: its phases 0 to 4 (foundations, files, catalog, tags and integrity) are all built. Slunk now has:
> - the database, with its full schema and migrations, backed up before each migration;
> - a backend that serves a GraphQL API over it;
> - a frontend where you register files from your library, then catalog them: import a folder as a release, step by step, and edit releases, artists, tracks, labels and credits;
> - tags on releases and tracks, like Genre, Score or Date purchased, lists filtered by them ("Genre is Rock and Score ≥ 8"), and a tag set or removed on many releases at once;
> - a library check that finds files that moved, changed or went missing on disk, and gaps in the catalog.

## Documentation

- [**Documentation**](docs/README.md): what's built, how the docs are organized, and how we work.
- [**Getting started**](docs/development/getting-started.md): setting up and running the project.
- [**Design**](docs/design/): the plans, starting with [Introduction to Slunk](docs/design/1_introduction.md).

The docs in `docs/` are kept up to date with the code: a change that affects something documented updates the docs in the same change. The exception is `docs/design/`, which is mostly a history of the project. A design doc is only edited while that design is being developed.

AI coding agents: see [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)
