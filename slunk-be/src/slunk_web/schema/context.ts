import type { Kysely } from "kysely"
import type { DB } from "../../repo/db_types.ts"

/** What every resolver gets as its context. */
export type Context = {
  db: Kysely<DB>
  dbPath: string
}
