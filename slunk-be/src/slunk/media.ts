// The media context: registered files, and the library on disk they come
// from. Slunk only reads the files; it records them in its database.
import { fileTypeOf, type FileType } from "./media/file_types.ts"
import type { Library } from "./media/library.ts"
import { type ListArgs, pagingOf, searchOf, sortOf } from "./paging.ts"
import { readAudio } from "./media/audio.ts"
import type {
  FileLinksRepository,
  FileRecord,
  FilesRepository,
  FileUse,
  LinkOwner,
  NewFile,
} from "./media/repository.ts"

export type Media = ReturnType<typeof createMedia>

/** Files read from disk and ready to insert, and those already registered. */
export type PreparedFiles = { existing: FileRecord[]; fresh: NewFile[] }

export function createMedia({
  files,
  fileLinks,
  library,
}: {
  files: FilesRepository
  fileLinks: FileLinksRepository
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

  /** Reads the files at these paths that aren't registered yet. Writes nothing. */
  async function prepareFiles(paths: string[]): Promise<PreparedFiles> {
    const wanted = [...new Set(paths.map(library.normalize))]
    const known = await registered(wanted)
    const fresh: NewFile[] = []
    for (const path of wanted.filter((path) => !known.has(path))) {
      if (path === "") throw new Error("That's a folder, not a file")
      const facts = await library.readFacts(path)
      fresh.push({ path, type: fileTypeOf(path), ...facts })
    }
    return { existing: [...known.values()], fresh }
  }

  /** Inserts prepared files, maybe in a transaction. Returns them all by path. */
  async function insertPrepared(
    store: { files: FilesRepository },
    { existing, fresh }: PreparedFiles
  ): Promise<Map<string, FileRecord>> {
    const byPath = new Map(existing.map((file) => [file.path, file]))
    for (const file of await store.files.insert(fresh))
      byPath.set(file.path, file)
    return byPath
  }

  return {
    normalizePath: (path: string) => library.normalize(path),
    prepareFiles,
    insertPrepared,
    filesByIds: (ids: readonly number[]) => files.getMany(ids),
    fileLinksOf: (owner: LinkOwner, ids: readonly number[]) =>
      fileLinks.of(owner, ids),
    /** An audio file's duration and embedded tags. */
    readAudio: (file: FileRecord) => readAudio(library.absolute(file.path)),
    readAudioAt: (path: string) => readAudio(library.absolute(path)),

    /** A page of files. */
    listFiles(
      args: ListArgs & {
        type?: FileType | null
        unused?: boolean | null
        withoutTrack?: boolean | null
      }
    ) {
      return files.list({
        ...pagingOf(args),
        ...sortOf(args.sort, ["path"] as const, "Files"),
        search: searchOf(args.q),
        type: args.type ?? undefined,
        unused: args.unused ?? undefined,
        withoutTrack: args.withoutTrack ?? undefined,
      })
    },

    getFile: (id: number) => files.get(id),
    fileCounts: () => files.counts(),
    fileUses: (id: number): Promise<FileUse[]> => files.uses(id),
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
      const byPath = await insertPrepared({ files }, await prepareFiles(paths))
      return [...new Set(paths.map(library.normalize))].map((path) =>
        byPath.get(path)!
      )
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
