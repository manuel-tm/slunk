# Database

> Keep this page up to date: any migration that changes the schema updates it in the same change.

This is the schema as built, by these migrations in `slunk-be/priv/repo/migrations/`:

| Migration | Adds |
|---|---|
| `20261011141955_create_baseline` | Every table, index and trigger, except those below |
| `20261013060918_add_tag_value_rules` | The triggers that check date and number tag values |

The reasoning behind it is in [design §4](../design/1_introduction.md#4-data-model), and its appendices [A](../design/1_introduction.md#appendix-a-more-integrity-rules-in-the-database) and [D](../design/1_introduction.md#appendix-d-tag-values-are-checked-in-the-database). Every column's type is in `slunk-be/src/repo/db_types.ts`, which is generated from the database.

How to connect, migrate and seed: [development/backend.md](../development/backend.md#the-database).

## Conventions

- Every table is `STRICT`, so SQLite rejects a value of the wrong type.
- `files`, `artists`, `labels`, `releases` and `tracks` use `INTEGER PRIMARY KEY AUTOINCREMENT`, so a deleted id is never reused. They also have `inserted_at` and `updated_at`, which default to `unixepoch()`. The app sets `updated_at`.
- Other tables use `INTEGER PRIMARY KEY`.
- Booleans are `INTEGER` 0 or 1, with a CHECK.
- Instants are Unix epoch seconds, UTC. Durations are milliseconds.
- Every foreign key column leads an index. Indexes are named `<table>_<columns>_index`.

## Tables

| Table | Holds |
|---|---|
| `files` | Registered files: `path` (relative to the database's folder), `type` (`music`, `image` or `other`), `size_bytes`, `mtime`, `sha256` |
| `artists` | `name`, and `picture` → `files` |
| `labels` | `name`, and `picture` → `files` (the logo) |
| `releases` | `title`, `release_date` with `release_date_precision`, `catalog_number`, `cover_picture` → `files`, `various_artists` |
| `tracks` | `title`, `duration_ms`, `track_number`, `cd_number` (default 1), `release_id`, and `file_id` (its audio) |
| `artists_releases` | Who a release is by, with `position` |
| `artists_tracks` | Who performs a track, with `featured` and `position` |
| `labels_releases` | A release's labels, with `position` |
| `credit_roles` | The roles credits use, a list the user manages |
| `release_credits`, `track_credits` | An artist with a role on a release or track, with `position` |
| `release_formats`, `release_media` | Lists the user manages |
| `release_formats_releases`, `release_media_releases` | A release's formats and media |
| `files_releases`, `artists_files`, `files_tracks` | File links, each with an optional `note` |
| `text_tags`, `real_number_tags`, `date_tags` | Tag definitions: `name`, and `multiple` (0 for single-value) |
| `release_text_tags`, `release_real_number_tags`, `release_date_tags` | A release's tag values. `value` is `TEXT`, `REAL` or `INTEGER` (epoch seconds) |
| `migrations` | Applied migrations (`name`, `applied_at`), kept by the migration runner |

## What the database enforces

### Values

- **Files:**
  - `path` is unique, non-empty, and doesn't start with `/`.
  - `type` is `music`, `image` or `other`.
  - `size_bytes >= 0`.
  - `sha256` is 64 lowercase hex characters.
- **Text:** these values are non-empty, with no leading or trailing spaces:
  - names: of artists, labels, credit roles, formats, media and tag definitions;
  - titles: of releases and tracks;
  - `catalog_number`, `release_text_tags.value` and file link notes.

  A nullable one (`catalog_number`, `note`) may also be NULL.
- **Unique ignoring case** (`COLLATE NOCASE`):
  - names of credit roles, formats, media and tag definitions;
  - a text tag's value per release and tag.

  `catalog_number` also compares ignoring case, but isn't unique. Artist names, label names and release titles aren't unique; their indexes ignore case, for search and sorting.
- **Release dates:**
  - `release_date` and `release_date_precision` are both set or both NULL (`releases_release_date_precision_set`);
  - the precision is `year`, `month` or `day`;
  - the date is midnight UTC, on the 1st for `month`, and on January 1st for `year` (`releases_release_date_matches_precision`).
- **Tracks:**
  - `(release_id, cd_number, track_number)` is unique;
  - `file_id` is unique: a file is the audio of at most one track;
  - `track_number > 0`, `cd_number > 0`, `duration_ms >= 0`.
- **Links:** an artist, label, format, medium or file appears at most once per release or track. A credit (release or track, artist, role) appears once. `position >= 0`.
- **Tag values:**
  - `(release_id, tag_id, value)` is unique;
  - a date tag's value is a day, at midnight UTC, and a number tag's value is finite (triggers below).
- **Flags:** `various_artists`, `featured` and `multiple` are 0 or 1.

### Triggers

Each trigger aborts the statement with the error shown.

| Triggers | Error | Fires when |
|---|---|---|
| `release_<type>_tags_single_value_insert`, `…_update` | `single-value tag already set on this release` | A release would get a second value for a tag with `multiple = 0`: on insert, or on changing `release_id` or `tag_id`. Changing `value` always works. |
| `<type>_tags_multiple_off` | `some releases have several values for this tag` | `multiple` changes from 1 to 0 while a release has several values |
| `tracks_file_is_music_insert`, `…_update` | `a track's file must be music` | A track's `file_id` points to a file that isn't `music` |
| `files_type_stays_music` | `a track's file must stay music` | A track's file changes `type` |
| `releases_cover_picture_is_image_insert`, `…_update` | `a release cover must be an image` | `cover_picture` points to a file that isn't an `image` |
| `artists_picture_is_image_insert`, `…_update` | `an artist picture must be an image` | `picture` points to a file that isn't an `image` |
| `labels_picture_is_image_insert`, `…_update` | `a label picture must be an image` | `picture` points to a file that isn't an `image` |
| `files_type_stays_image` | `a cover or picture must stay an image` | A file used as a cover or picture changes `type` |
| `release_date_tags_value_is_day_insert`, `…_update` | `a date tag's value must be a day, at midnight UTC` | `value % 86400 <> 0`, on insert or on changing `value` |
| `release_real_number_tags_value_is_finite_insert`, `…_update` | `a number tag's value must be finite` | `value` is infinite, on insert or on changing `value`. NaN is already NULL, which `NOT NULL` rejects. |

`<type>` is `text`, `real_number` or `date`.

### Deletes

Foreign keys decide what a delete does.

- **RESTRICT:** the delete fails with `FOREIGN KEY constraint failed` while the row is in use:
  - a file used as a track's audio, a cover, a picture or in a file link;
  - a release with tracks;
  - an artist who is a release or track artist, or is credited;
  - a label on a release;
  - a credit role, format, medium or tag definition in use.
- **CASCADE:** deleting a row also deletes the link rows that describe it:
  - a release: its artists, labels, formats, media, credits, file links and tag values;
  - a track: its artists, credits and file links;
  - an artist: its file links.

## Starter rows

The baseline migration adds these rows. Nothing depends on them, so the user can rename or delete them.

- `credit_roles`: composer, conductor, producer, remixer, writer
- `release_formats`: Album, Compilation, EP, Live, LP, Mixtape, Single, Soundtrack
- `release_media`: Cassette, CD, Digital, Vinyl

## Left to the app

- A tag name used by another type ("Score" as both a text and a real number tag) is allowed by the database. The app refuses it, ignoring case.
- Paths are only checked to be non-empty and relative. Normalizing them (forward slashes, no `./` or `a/../b`) is up to the app.
- `updated_at` isn't updated automatically.
