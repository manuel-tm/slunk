# Slunk documentation

This folder documents Slunk as it's actually built, and it's kept up to date with the code (see [Keeping docs up to date](#keeping-docs-up-to-date)). Plans live separately, in [`design/`](design/).

## Contents

| Path | What's in it |
|---|---|
| [`design/`](design/) | Design docs: numbered plans used for planning and prompting, and a history of the project. Start with [1_introduction.md](design/1_introduction.md). |
| [`development/getting-started.md`](development/getting-started.md) | Setting up and running the project |
| [`development/frontend.md`](development/frontend.md) | How the frontend is built, and its conventions |

New docs are added as the code they describe lands:
- `development/` holds how to set up, run and work on each project (e.g. `development/backend.md` once `slunk-be/` exists).
- A new folder like `reference/` can hold the data model or the GraphQL API once they exist.

## Repository layout

```
docs/            documentation (this folder)
  design/        design docs (plans)
  development/   setup and conventions for the code
slunk-fe/        frontend
AGENTS.md        instructions for AI coding agents (CLAUDE.md points to it)
```

The backend, `slunk-be/`, doesn't exist yet. It's planned in [design §6](design/1_introduction.md#6-backend-shape).

## How we work

Work flows from design to code to docs:

1. **Design.** A topic is planned in `design/N_topic.md`. While a design is being developed, it's edited freely. After that it becomes part of the project's history: its text stays as it was, and only appendices are added (step 4).
2. **Code.** The code is built from the design.
3. **Document.** When code lands, what it does is documented here, in the same change. Docs describe only what exists. Plans stay in the design docs, so nothing is written twice.
4. **Record design changes as appendices.** When the code shows that a design has to change, the design text isn't rewritten:
   - an appendix is added at the end of that design doc;
   - a one-line note is added at the affected section, so nobody follows the old text by mistake.

Appendices are lettered in order (A, B, …). For example (this one is made up):

```markdown
## Appendix A: Releases store their disc count

- **Date:** 2026-11-02
- **Affects:** §4.3 Releases
- **Was:** the number of discs is computed from the tracks.
- **Now:** releases store `total_cds`.
- **Why:** box sets with missing discs showed the wrong count.
```

And at the affected section:

```markdown
> Changed during implementation, see [Appendix A](#appendix-a-releases-store-their-disc-count).
```

### Keeping docs up to date

The docs outside `design/` must always match the code.
- **Update them in the same change as the code.** Any change that affects something documented updates the docs with it: requirements and setup, commands and scripts, project structure, conventions, and behavior.
- **A doc that no longer matches the code is a bug.** Fix it when you find it, even if your change didn't cause it.

`design/` is the exception. A design doc is only edited while that design is being developed. After that it's a record of what was planned, and it changes only through appendices.
