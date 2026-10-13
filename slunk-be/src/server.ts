import { databasePath, port } from "./config.ts"
import { openDb } from "./repo/db.ts"
import { migrate } from "./repo/migrator.ts"
import { createStore } from "./repo/store.ts"
import { createCatalog } from "./slunk/catalog.ts"
import { createMedia } from "./slunk/media.ts"
import { createLibrary } from "./slunk/media/library.ts"
import { startEndpoint } from "./slunk_web/endpoint.ts"

const dbPath = databasePath()

// Users never migrate by hand: the server does it on start (design §5.4)
const { names, backup } = await migrate(dbPath)
if (backup) console.log(`Backed up the database to ${backup}`)
for (const name of names) console.log(`Applied migration ${name}`)

// Wires each context to its SQLite repositories (design §6)
const db = openDb(dbPath)
const store = createStore(db)
const media = createMedia({
  files: store.files,
  fileLinks: store.fileLinks,
  library: createLibrary(dbPath),
})
const catalog = createCatalog({ store, media })
await startEndpoint({ db, dbPath, media, catalog }, port())
console.log(`Slunk is serving ${dbPath} at http://127.0.0.1:${port()}/graphql`)

// Closing the database checkpoints the WAL and removes the -wal/-shm files
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => void db.destroy().then(() => process.exit()))
}
