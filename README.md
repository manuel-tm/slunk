# Slunk

A local music library manager. Slunk keeps its own database as the source of truth for your music's metadata, and only reads your music files.

> **Status:** early. Phase 0 (foundations) is built: the database with its full schema and migrations, a backend that serves a GraphQL API over it, and a frontend with its app shell and a dashboard.

## Documentation

- [**Documentation**](docs/README.md): what's built, how the docs are organized, and how we work.
- [**Getting started**](docs/development/getting-started.md): setting up and running the project.
- [**Design**](docs/design/): the plans, starting with [Introduction to Slunk](docs/design/1_introduction.md).

The docs in `docs/` are kept up to date with the code: a change that affects something documented updates the docs in the same change. The exception is `docs/design/`, which is mostly a history of the project. A design doc is only edited while that design is being developed.

AI coding agents: see [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)
