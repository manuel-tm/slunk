// The media context: registered files, and the library on disk they come
// from. Slunk only reads the files; it records them in its database.
import { fileTypeOf, type FileType } from "./media/file_types.ts"
import type { Library } from "./media/library.ts"
import type {
  FileRecord,
  FilesRepository,
  FileUse,
  NewFile,
} from "./media/repository.ts"

export type Media = ReturnType<typeof createMedia>

const SORTS = ["id", "path"] as const

export function createMedia({
  files,
  library,
}: {
  files: FilesRepository
  library: Library
}) {
  /** Registered files at these paths, by path. */
  async function registered(paths: string[]): Promise<Map<string, FileRecord>> {
    const found = await files.findByPaths(paths)
    return new Map(found.map((file) => [file.path, file]))
  }

  /** Whether any registered file is in the folder or its subfolders. */
  function holdsRegisteredFiles(folder: string): Promise<boolean> {
    // A folder at or above the database's folder holds everything but the
    // paths that climb out of it: "../.." holds all but "../../../…"
    const ups = folder === "" ? 0 : folder.split("/").length
    if (folder === "" || /^\.\.(\/\.\.)*$/.test(folder)) {
      return files.hasPathStartingWith("../".repeat(ups + 1), true)
    }
    return files.hasPathStartingWith(`${folder}/`)
  }

  return {
    /** A page of files. `sort` is a column, with `-` for descending. */
    async listFiles({
      page = 1,
      perPage = 50,
      sort = "-id",
      q,
      type,
      unused,
    }: {
      page?: number
      perPage?: number
      sort?: string | null
      q?: string | null
      type?: FileType | null
      unused?: boolean | null
    }) {
      const column = (sort ?? "-id").replace(/^-/, "")
      if (!SORTS.includes(column as (typeof SORTS)[number])) {
        throw new Error(`Files can't be sorted by ${column}`)
      }
      if (!Number.isInteger(page) || page < 1) throw new Error("No such page")
      perPage = Math.min(Math.max(perPage, 1), 200)
      return files.list({
        offset: (page - 1) * perPage,
        limit: perPage,
        sort: column as (typeof SORTS)[number],
        descending: (sort ?? "-id").startsWith("-"),
        search: q?.trim() || undefined,
        type: type ?? undefined,
        unused: unused ?? undefined,
      })
    },

    getFile: (id: number) => files.get(id),
    fileCounts: () => files.counts(),
    fileUses: (id: number): Promise<FileUse[]> => files.uses(id),
    tracksOfFiles: (ids: number[]) => files.tracksOf(ids),
    fileOnDisk: (file: FileRecord) => library.exists(file.path),
    absolutePath: (file: FileRecord) => library.absolute(file.path),

    /** A folder's subfolders and files, marking what's registered. */
    async browseFolder(path: string) {
      const folder = await library.listFolder(path)
      const known = await registered(folder.files.map((file) => file.path))
      return {
        ...folder,
        folders: await Promise.all(
          folder.folders.map(async (sub) => ({
            ...sub,
            hasRegisteredFiles: await holdsRegisteredFiles(sub.path),
          }))
        ),
        files: folder.files.map((file) => ({
          ...file,
          file: known.get(file.path) ?? null,
        })),
      }
    },

    /** Every file in a folder and its subfolders, with its registration. */
    async scanFolder(path: string) {
      const found = await library.scanFolder(path)
      const known = await registered(found.map((file) => file.path))
      return found.map((file) => ({
        ...file,
        file: known.get(file.path) ?? null,
      }))
    },

    /**
     * Registers files on disk: reads their size, mtime and hash, and types
     * them by extension. Paths already registered are returned as they are.
     */
    async registerFiles(paths: string[]): Promise<FileRecord[]> {
      const wanted = [...new Set(paths.map(library.normalize))]
      const known = await registered(wanted)
      const added: NewFile[] = []
      for (const path of wanted.filter((path) => !known.has(path))) {
        if (path === "") throw new Error("That's a folder, not a file")
        const facts = await library.readFacts(path)
        added.push({ path, type: fileTypeOf(path), ...facts })
      }
      for (const file of await files.insert(added)) known.set(file.path, file)
      return wanted.map((path) => known.get(path)!)
    },

    /**
     * Changes a file's type, or its path to relink a file that moved, in
     * which case its size, mtime and hash are read again.
     */
    async updateFile(
      id: number,
      changes: { path?: string | null; type?: FileType | null }
    ): Promise<FileRecord> {
      const file = await files.get(id)
      if (!file) throw new Error(`There's no file ${id}`)
      const update: Partial<NewFile> = {}
      if (changes.path != null) {
        const path = library.normalize(changes.path)
        if (path !== file.path) {
          const [taken] = await files.findByPaths([path])
          if (taken) {
            throw new Error(`File ${taken.id} is already registered at ${path}`)
          }
          Object.assign(update, { path }, await library.readFacts(path))
        }
      }
      if (changes.type != null) update.type = changes.type
      const updated = await files.update(id, update)
      if (!updated) throw new Error(`There's no file ${id}`)
      return updated
    },

    /** Deletes a file's record. The file on disk isn't touched. */
    async deleteFile(id: number): Promise<void> {
      const uses = await files.uses(id)
      if (uses.length > 0) {
        throw new Error(
          `The file is still used: ${uses.map(describeUse).join(", ")}`
        )
      }
      await files.delete(id)
    },
  }
}

function describeUse({ kind, name }: FileUse): string {
  const what = {
    track_audio: "the audio of track",
    release_cover: "the cover of",
    artist_picture: "the picture of",
    label_picture: "the logo of",
    release_link: "linked to release",
    artist_link: "linked to artist",
    track_link: "linked to track",
  }[kind]
  return `${what} "${name}"`
}
