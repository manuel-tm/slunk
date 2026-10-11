import { resolve } from "node:path"

/** The database file from `SLUNK_DB`, as an absolute path. */
export function databasePath(): string {
  const value = process.env.SLUNK_DB
  if (!value) {
    throw new Error(
      "SLUNK_DB is not set. Point it at a library's slunk.db (see .env.example)."
    )
  }
  return resolve(value)
}

/** The port the server listens on, from `PORT`. */
export function port(): number {
  return Number(process.env.PORT ?? 4000)
}
