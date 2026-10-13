import { type Kysely, sql } from "kysely"
import type {
  CreditsRepository,
  StatsRepository,
} from "../slunk/catalog/repository.ts"
import type { FileLinksRepository } from "../slunk/media/repository.ts"
import type { DB } from "./db_types.ts"
import { chunks, groupBy } from "./helpers.ts"

const CREDITS = {
  release: { table: "release_credits", column: "release_id" },
  track: { table: "track_credits", column: "track_id" },
} as const

export function createCreditsRepository(db: Kysely<DB>): CreditsRepository {
  return {
    async of(owner, ids) {
      const { table, column } = CREDITS[owner]
      const rows: {
        ownerId: number
        id: number
        artistId: number
        roleId: number
      }[] = []
      for (const chunk of chunks(ids)) {
        const { rows: found } = await sql<(typeof rows)[number]>`
          select ${sql.ref(column)} as ownerId, id, artist_id as artistId,
            role_id as roleId
          from ${sql.table(table)}
          where ${sql.ref(column)} in (${sql.join(chunk)})
          order by ${sql.ref(column)}, position
        `.execute(db)
        rows.push(...found)
      }
      return groupBy(
        rows,
        (row) => row.ownerId,
        ({ id, artistId, roleId }) => ({ id, artistId, roleId })
      )
    },

    async set(owner, id, credits) {
      const { table, column } = CREDITS[owner]
      await sql`
        delete from ${sql.table(table)} where ${sql.ref(column)} = ${id}
      `.execute(db)
      for (const [position, { artistId, roleId }] of credits.entries()) {
        await sql`
          insert into ${sql.table(table)}
            (${sql.ref(column)}, artist_id, role_id, position)
          values (${id}, ${artistId}, ${roleId}, ${position})
        `.execute(db)
      }
    },
  }
}

const FILE_LINKS = {
  release: { table: "files_releases", column: "release_id" },
  artist: { table: "artists_files", column: "artist_id" },
  track: { table: "files_tracks", column: "track_id" },
} as const

export function createFileLinksRepository(db: Kysely<DB>): FileLinksRepository {
  return {
    async of(owner, ids) {
      const { table, column } = FILE_LINKS[owner]
      const rows: { ownerId: number; fileId: number; note: string | null }[] =
        []
      for (const chunk of chunks(ids)) {
        const { rows: found } = await sql<(typeof rows)[number]>`
          select ${sql.ref(column)} as ownerId, file_id as fileId, note
          from ${sql.table(table)}
          where ${sql.ref(column)} in (${sql.join(chunk)})
          order by ${sql.ref(column)}, id
        `.execute(db)
        rows.push(...found)
      }
      return groupBy(
        rows,
        (row) => row.ownerId,
        ({ fileId, note }) => ({ fileId, note })
      )
    },

    async set(owner, id, links) {
      const { table, column } = FILE_LINKS[owner]
      await sql`
        delete from ${sql.table(table)} where ${sql.ref(column)} = ${id}
      `.execute(db)
      for (const { fileId, note } of links) {
        await sql`
          insert into ${sql.table(table)} (${sql.ref(column)}, file_id, note)
          values (${id}, ${fileId}, ${note})
        `.execute(db)
      }
    },
  }
}

export function createStatsRepository(db: Kysely<DB>): StatsRepository {
  return {
    async totals() {
      const { rows } = await sql<{
        releases: number
        artists: number
        tracks: number
        labels: number
        durationMs: number
      }>`
        select
          (select count(*) from releases) as releases,
          (select count(*) from artists) as artists,
          (select count(*) from tracks) as tracks,
          (select count(*) from labels) as labels,
          (select coalesce(sum(duration_ms), 0) from tracks) as durationMs
      `.execute(db)
      return rows[0]
    },
  }
}
