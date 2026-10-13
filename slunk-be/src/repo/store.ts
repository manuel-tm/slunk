import type { Kysely } from "kysely"
import type { CatalogStore } from "../slunk/catalog/repository.ts"
import {
  createArtistsRepository,
  createLabelsRepository,
} from "./artists_repository.ts"
import type { DB } from "./db_types.ts"
import { createFilesRepository } from "./files_repository.ts"
import {
  createCreditsRepository,
  createFileLinksRepository,
  createStatsRepository,
} from "./links_repositories.ts"
import { createListsRepository } from "./lists_repository.ts"
import { createReleasesRepository } from "./releases_repository.ts"
import { createTracksRepository } from "./tracks_repository.ts"

/**
 * Every SQLite repository over one connection, or over one transaction.
 * It's what the contexts' store interfaces describe.
 */
export function createStore(db: Kysely<DB>): CatalogStore {
  const store: CatalogStore = {
    artists: createArtistsRepository(db),
    labels: createLabelsRepository(db),
    releases: createReleasesRepository(db),
    tracks: createTracksRepository(db),
    lists: createListsRepository(db),
    credits: createCreditsRepository(db),
    stats: createStatsRepository(db),
    files: createFilesRepository(db),
    fileLinks: createFileLinksRepository(db),
    // Inside a transaction already, nested work just joins it
    transaction: (fn) =>
      db.isTransaction
        ? fn(store)
        : db.transaction().execute((trx) => fn(createStore(trx))),
  }
  return store
}
