import { type Expression, type Kysely, type SqlBool, sql } from "kysely"
import {
  type ReleaseTagValue,
  type Tag,
  TAG_TYPES,
  type TagFilter,
  type TagsRepository,
  type TagType,
} from "../slunk/tagging/repository.ts"
import type { DB } from "./db_types.ts"
import { chunks, contains, groupBy } from "./helpers.ts"

/** Each type's definition table and value table (design §4.3 Tags). */
export const TAG_TABLES = {
  text: { tags: "text_tags", values: "release_text_tags" },
  number: { tags: "real_number_tags", values: "release_real_number_tags" },
  date: { tags: "date_tags", values: "release_date_tags" },
} as const

// The order types are listed in when names tie
const RANK = { text: 0, number: 1, date: 2 }

type TagRow = { id: number; name: string; multiple: number }

/**
 * The three types' tables have the same columns, so one repository serves
 * them. The casts name one table for Kysely's types; all three work the same.
 */
export function createTagsRepository(db: Kysely<DB>): TagsRepository {
  const tags = (type: TagType) => TAG_TABLES[type].tags as "text_tags"
  const values = (type: TagType) =>
    TAG_TABLES[type].values as "release_text_tags"

  /** Every type's tags as one table, with a `type` column. */
  const allTags = (types: readonly TagType[]) =>
    sql.join(
      types.map(
        (type) => sql`
          select ${type} as type, ${RANK[type]} as rank, id, name, multiple
          from ${sql.table(TAG_TABLES[type].tags)}
        `
      ),
      sql` union all `
    )

  return {
    async list({ offset, limit, sort, descending, search, type }) {
      const from = sql`(${allTags(type ? [type] : TAG_TYPES)})`
      const where = search ? sql`where ${contains("name", search)}` : sql``
      const { rows: counted } = await sql<{ total: number }>`
        select count(*) as total from ${from} ${where}
      `.execute(db)
      const direction = descending ? sql`desc` : sql`asc`
      const { rows } = await sql<TagRow & { type: TagType }>`
        select type, id, name, multiple from ${from} ${where}
        order by ${sort === "name" ? sql`name collate nocase ${direction},` : sql``}
          id ${direction}, rank
        limit ${limit} offset ${offset}
      `.execute(db)
      return {
        items: rows.map((row) => toTag(row.type, row)),
        total: counted[0]?.total ?? 0,
      }
    },

    async get(type, id) {
      const row = await db
        .selectFrom(tags(type))
        .select(["id", "name", "multiple"])
        .where("id", "=", id)
        .executeTakeFirst()
      return row ? toTag(type, row) : null
    },

    async getMany(type, ids) {
      const found: Tag[] = []
      for (const chunk of chunks(ids)) {
        const rows = await db
          .selectFrom(tags(type))
          .select(["id", "name", "multiple"])
          .where("id", "in", chunk)
          .execute()
        found.push(...rows.map((row) => toTag(type, row)))
      }
      return found
    },

    async findByName(name) {
      const { rows } = await sql<TagRow & { type: TagType }>`
        select type, id, name, multiple from (${allTags(TAG_TYPES)})
        where name = ${name} collate nocase
        order by rank
      `.execute(db)
      return rows.map((row) => toTag(row.type, row))
    },

    async insert(type, { name, multiple }) {
      const row = await db
        .insertInto(tags(type))
        .values({ name, multiple: multiple ? 1 : 0 })
        .returning(["id", "name", "multiple"])
        .executeTakeFirstOrThrow()
      return toTag(type, row)
    },

    async update(type, id, { name, multiple }) {
      const row = await db
        .updateTable(tags(type))
        .set({ name, multiple: multiple ? 1 : 0 })
        .where("id", "=", id)
        .returning(["id", "name", "multiple"])
        .executeTakeFirst()
      return row ? toTag(type, row) : null
    },

    async delete(type, id) {
      await db.deleteFrom(tags(type)).where("id", "=", id).execute()
    },

    async releaseCount(type, id) {
      const row = await db
        .selectFrom(values(type))
        .select(sql<number>`count(distinct release_id)`.as("count"))
        .where("tag_id", "=", id)
        .executeTakeFirstOrThrow()
      return row.count
    },

    async values(id, { offset, limit, search }) {
      let query = db.selectFrom("release_text_tags").where("tag_id", "=", id)
      if (search) query = query.where(contains("value", search))
      // Values compare ignoring case, so "Rock" and "rock" count as one
      const { total } = await query
        .select(sql<number>`count(distinct value)`.as("total"))
        .executeTakeFirstOrThrow()
      const rows = await query
        .select(["value", sql<number>`count(*)`.as("releases")])
        .groupBy("value")
        .orderBy("releases", "desc")
        .orderBy("value")
        .limit(limit)
        .offset(offset)
        .execute()
      return { items: rows, total }
    },

    async multiValueReleases(type, id, { offset, limit }) {
      const several = db
        .selectFrom(values(type))
        .select("release_id")
        .where("tag_id", "=", id)
        .groupBy("release_id")
        .having(sql<number>`count(*)`, ">", 1)
      const { total } = await db
        .selectFrom(several.as("several"))
        .select((eb) => eb.fn.countAll<number>().as("total"))
        .executeTakeFirstOrThrow()
      const rows = await several
        .orderBy("release_id")
        .limit(limit)
        .offset(offset)
        .execute()
      return { items: rows.map((row) => row.release_id), total }
    },

    async valuesOf(releaseIds) {
      const rows: (ReleaseTagValue & { releaseId: number })[] = []
      for (const chunk of chunks(releaseIds)) {
        const { rows: found } = await sql<
          ReleaseTagValue & { releaseId: number }
        >`
          select type, releaseId, tagId, value from (${sql.join(
            TAG_TYPES.map(
              (type) => sql`
                select ${type} as type, ${RANK[type]} as rank,
                  v.release_id as releaseId, v.tag_id as tagId,
                  v.value as value, t.name as name, v.id as valueId
                from ${sql.table(TAG_TABLES[type].values)} v
                join ${sql.table(TAG_TABLES[type].tags)} t on t.id = v.tag_id
                where v.release_id in (${sql.join(chunk)})
              `
            ),
            sql` union all `
          )})
          order by releaseId, name collate nocase, rank, tagId, valueId
        `.execute(db)
        rows.push(...found)
      }
      return groupBy(
        rows,
        (row) => row.releaseId,
        ({ type, tagId, value }) => ({ type, tagId, value })
      )
    },

    async setValues(releaseId, list) {
      for (const type of TAG_TYPES) {
        await db
          .deleteFrom(values(type))
          .where("release_id", "=", releaseId)
          .execute()
      }
      // Rows are inserted in order, so ids keep the order they were given in
      for (const { type, tagId, value } of list) {
        await db
          .insertInto(values(type))
          .values({
            release_id: releaseId,
            tag_id: tagId,
            value: value as string,
          })
          .execute()
      }
    },
  }
}

/** A release list filter on a tag's values (design §7.6). */
export function tagMatches(filter: TagFilter) {
  const conditions: Expression<unknown>[] = [sql`tag_id = ${filter.tagId}`]
  if (filter.equals !== undefined) {
    conditions.push(sql`value = ${filter.equals}`)
  }
  if (filter.contains !== undefined) {
    conditions.push(contains("value", filter.contains))
  }
  if (filter.min !== undefined) conditions.push(sql`value >= ${filter.min}`)
  if (filter.max !== undefined) conditions.push(sql`value <= ${filter.max}`)
  // Uses the (tag_id, value) index
  return sql<SqlBool>`releases.id in (
    select release_id from ${sql.table(TAG_TABLES[filter.type].values)}
    where ${sql.join(conditions, sql` and `)}
  )`
}

function toTag(type: TagType, row: TagRow): Tag {
  return {
    type,
    id: row.id,
    name: row.name,
    multiple: row.multiple === 1,
  }
}
