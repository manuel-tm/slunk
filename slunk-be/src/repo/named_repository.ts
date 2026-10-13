import { type Kysely, type Selectable, sql } from "kysely"
import type {
  Artist,
  NamedRepository,
  NamedValues,
} from "../slunk/catalog/repository.ts"
import type { Artists, DB } from "./db_types.ts"
import { chunks, contains } from "./helpers.ts"

/**
 * Artists and labels have the same columns, so they share this repository.
 * The casts name one table for Kysely's types; both work the same.
 */
export function createNamedRepository(
  db: Kysely<DB>,
  table: "artists" | "labels"
): NamedRepository<Artist> {
  const t = table as "artists"
  return {
    async list({ offset, limit, sort, descending, search }) {
      let query = db.selectFrom(t)
      if (search) query = query.where(contains("name", search))
      const { total } = await query
        .select((eb) => eb.fn.countAll<number>().as("total"))
        .executeTakeFirstOrThrow()
      const rows = await query
        .selectAll()
        .orderBy(
          sort === "name" ? sql`name collate nocase` : sql`id`,
          descending ? "desc" : "asc"
        )
        .orderBy("id", descending ? "desc" : "asc")
        .limit(limit)
        .offset(offset)
        .execute()
      return { items: rows.map(toNamed), total }
    },

    async get(id) {
      const row = await db
        .selectFrom(t)
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst()
      return row ? toNamed(row) : null
    },

    async getMany(ids) {
      const found: Artist[] = []
      for (const chunk of chunks(ids)) {
        const rows = await db
          .selectFrom(t)
          .selectAll()
          .where("id", "in", chunk)
          .execute()
        found.push(...rows.map(toNamed))
      }
      return found
    },

    async findByNames(names) {
      if (names.length === 0) return []
      const rows = await db
        .selectFrom(t)
        .selectAll()
        .where(sql`name collate nocase`, "in", names)
        .execute()
      return rows.map(toNamed)
    },

    async insert(values) {
      const row = await db
        .insertInto(t)
        .values(values)
        .returningAll()
        .executeTakeFirstOrThrow()
      return toNamed(row)
    },

    async update(id, values: Partial<NamedValues>) {
      const row = await db
        .updateTable(t)
        .set({ ...values, updated_at: sql`unixepoch()` })
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst()
      return row ? toNamed(row) : null
    },

    async delete(id) {
      await db.deleteFrom(t).where("id", "=", id).execute()
    },
  }
}

function toNamed(row: Selectable<Artists>): Artist {
  return {
    id: row.id,
    name: row.name,
    picture: row.picture,
    insertedAt: row.inserted_at,
    updatedAt: row.updated_at,
  }
}
