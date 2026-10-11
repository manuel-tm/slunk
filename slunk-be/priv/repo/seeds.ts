// Sample data for development: `npm run db:seed`, or `npm run db:reset` to
// start over. There are no files or tracks, which need real files on disk.
import type { Insertable, Kysely } from "kysely"
import type { DB, Releases } from "../../src/repo/db_types.ts"

export async function seed(db: Kysely<DB>): Promise<void> {
  if (await db.selectFrom("releases").select("id").executeTakeFirst()) {
    console.log("Skipped seeding: the database already has releases.")
    return
  }

  const artist = await insertNamed(db, "artists", [
    "Drake",
    "Majid Jordan",
    "The High School Musical Cast",
    "Zac Efron",
    "Vanessa Anne Hudgens",
  ])
  const label = await insertNamed(db, "labels", [
    "October's Very Own",
    "Young Money",
    "Cash Money",
    "Republic Records",
    "Walt Disney Records",
  ])
  const format = await upsertNamed(db, "release_formats", [
    "Album",
    "Soundtrack",
  ])
  const medium = await upsertNamed(db, "release_media", ["CD"])

  await insertRelease(db, {
    release: {
      title: "Nothing Was the Same",
      release_date: Date.UTC(2013, 8, 24) / 1000,
      release_date_precision: "day",
      catalog_number: "B0019141-02",
    },
    artists: [artist["Drake"]],
    labels: [
      label["October's Very Own"],
      label["Young Money"],
      label["Cash Money"],
      label["Republic Records"],
    ],
    formats: [format["Album"]],
    media: [medium["CD"]],
  })
  await insertRelease(db, {
    release: {
      title: "High School Musical (Soundtrack)",
      release_date: Date.UTC(2006, 0, 10) / 1000,
      release_date_precision: "day",
      catalog_number: "365 4622",
      various_artists: 1,
    },
    artists: [artist["The High School Musical Cast"]],
    labels: [label["Walt Disney Records"]],
    formats: [format["Album"], format["Soundtrack"]],
    media: [medium["CD"]],
  })

  console.log("Seeded 2 releases, 5 artists and 5 labels.")
}

/** Inserts rows by name, returning their ids by name. */
async function insertNamed(
  db: Kysely<DB>,
  table: "artists" | "labels",
  names: string[]
): Promise<Record<string, number>> {
  const rows = await db
    .insertInto(table)
    .values(names.map((name) => ({ name })))
    .returning(["id", "name"])
    .execute()
  return Object.fromEntries(rows.map((row) => [row.name, row.id]))
}

/** Like insertNamed, for lists whose names are unique: keeps existing rows. */
async function upsertNamed(
  db: Kysely<DB>,
  table: "release_formats" | "release_media",
  names: string[]
): Promise<Record<string, number>> {
  await db
    .insertInto(table)
    .values(names.map((name) => ({ name })))
    .onConflict((oc) => oc.column("name").doNothing())
    .execute()
  const rows = await db
    .selectFrom(table)
    .select(["id", "name"])
    .where("name", "in", names)
    .execute()
  return Object.fromEntries(rows.map((row) => [row.name, row.id]))
}

async function insertRelease(
  db: Kysely<DB>,
  {
    release,
    artists,
    labels,
    formats,
    media,
  }: {
    release: Insertable<Releases>
    artists: number[]
    labels: number[]
    formats: number[]
    media: number[]
  }
) {
  const { id } = await db
    .insertInto("releases")
    .values(release)
    .returning("id")
    .executeTakeFirstOrThrow()
  await db
    .insertInto("artists_releases")
    .values(
      artists.map((artist_id, position) => ({
        artist_id,
        release_id: id,
        position,
      }))
    )
    .execute()
  await db
    .insertInto("labels_releases")
    .values(
      labels.map((label_id, position) => ({
        label_id,
        release_id: id,
        position,
      }))
    )
    .execute()
  await db
    .insertInto("release_formats_releases")
    .values(formats.map((format_id) => ({ format_id, release_id: id })))
    .execute()
  await db
    .insertInto("release_media_releases")
    .values(media.map((medium_id) => ({ medium_id, release_id: id })))
    .execute()
}
