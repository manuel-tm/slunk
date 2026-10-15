import { type Kysely, sql } from "kysely"
import type {
  ArtistsRepository,
  LabelsRepository,
} from "../slunk/catalog/repository.ts"
import type { DB } from "./db_types.ts"
import { createNamedRepository } from "./named_repository.ts"

export function createArtistsRepository(db: Kysely<DB>): ArtistsRepository {
  return {
    ...createNamedRepository(db, "artists"),

    async usage(id) {
      const { rows } = await sql<{
        releases: number
        tracks: number
        credits: number
      }>`
        select
          (select count(*) from artists_releases where artist_id = ${id}) as releases,
          (select count(*) from artists_tracks where artist_id = ${id}) as tracks,
          (select count(*) from artists_release_credits where artist_id = ${id})
            + (select count(*) from artists_track_credits where artist_id = ${id})
            as credits
      `.execute(db)
      return rows[0]
    },

    async appearances(id) {
      const { rows } = await sql<{ releaseId: number; trackId: number }>`
        select t.release_id as releaseId, t.id as trackId
        from artists_tracks a join tracks t on t.id = a.track_id
        where a.artist_id = ${id}
          and not exists (
            select 1 from artists_releases r
            where r.release_id = t.release_id and r.artist_id = ${id}
          )
        order by t.release_id, t.cd_number, t.track_number
      `.execute(db)
      return rows
    },

    // A row per line the artist is on
    async credits(id) {
      const { rows } = await sql<{
        role: string
        releaseId: number
        trackId: number | null
      }>`
        select l.role, l.release_id as releaseId, null as trackId
        from artists_release_credits a
        join release_credits l on l.id = a.credit_id
        where a.artist_id = ${id}
        union all
        select l.role, t.release_id, t.id
        from artists_track_credits a
        join track_credits l on l.id = a.credit_id
        join tracks t on t.id = l.track_id
        where a.artist_id = ${id}
      `.execute(db)
      return rows
    },

    async formatCounts(id) {
      const { rows } = await sql<{ formatId: number; count: number }>`
        select f.format_id as formatId, count(*) as count
        from release_formats_releases f
        join artists_releases a on a.release_id = f.release_id
        where a.artist_id = ${id}
        group by f.format_id
      `.execute(db)
      return rows
    },
  }
}

export function createLabelsRepository(db: Kysely<DB>): LabelsRepository {
  return {
    ...createNamedRepository(db, "labels"),

    async releaseCount(id) {
      const row = await db
        .selectFrom("labels_releases")
        .select((eb) => eb.fn.countAll<number>().as("count"))
        .where("label_id", "=", id)
        .executeTakeFirstOrThrow()
      return row.count
    },
  }
}
