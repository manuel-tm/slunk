// The catalog context: artists, labels, releases with their formats, media
// and labels, tracks, and credits (design §6).
import { basename, dirname } from "node:path"
import { formatReleaseDate, parseReleaseDate } from "./catalog/dates.ts"
import type {
  CatalogStore,
  CreditOwner,
  ListKind,
  Release,
  ReleaseLink,
  TrackArtist,
} from "./catalog/repository.ts"
import type { Media } from "./media.ts"
import type { FileRecord, LinkOwner } from "./media/repository.ts"
import { type ListArgs, pagingOf, searchOf, sortOf } from "./paging.ts"

export type Catalog = ReturnType<typeof createCatalog>

/** A file by id, or by a path to register first. */
export type FileRef = { fileId?: number | null; path?: string | null }

export type FileLinkInput = FileRef & { note?: string | null }

export type CreditInput = { artistId: number; roleId: number }

export type ReleaseInput = {
  title: string
  /** `2006`, `2006-01` or `2006-01-10` */
  released?: string | null
  catalogNumber?: string | null
  variousArtists: boolean
  artistIds: number[]
  labelIds: number[]
  formatIds: number[]
  mediumIds: number[]
}

/** A row of a release's tracks: an existing track, or a new one from a file. */
export type ReleaseTrackInput = FileRef & {
  id?: number | null
  cdNumber: number
  trackNumber: number
  title: string
  artistIds: number[]
  featureIds: number[]
}

export type TrackInput = {
  releaseId: number
  fileId: number
  cdNumber: number
  trackNumber: number
  title: string
  artistIds: number[]
  featureIds: number[]
  credits: CreditInput[]
  files: FileLinkInput[]
}

const LIST_NAMES: Record<ListKind, string> = {
  release_formats: "format",
  release_media: "medium",
  credit_roles: "credit role",
}

// Moves track numbers clear of the ones being saved, so renumbering a
// release never trips its unique (release, disc, number) index midway
const RENUMBER_OFFSET = 1_000_000

export function createCatalog({
  store,
  media,
}: {
  store: CatalogStore
  media: Media
}) {
  /** Registered files for refs, registering paths first. Reads outside the transaction. */
  async function prepareRefs(refs: FileRef[]) {
    const paths = refs.flatMap((ref) =>
      ref.fileId == null && ref.path ? [ref.path] : []
    )
    return media.prepareFiles(paths)
  }

  /** The file id of a ref, after `prepared` has been inserted in `tx`. */
  function refId(ref: FileRef, registered: Map<string, FileRecord>): number {
    if (ref.fileId != null) return ref.fileId
    if (!ref.path) throw new Error("A file needs an id or a path")
    const file = registered.get(media.normalizePath(ref.path))
    if (!file) throw new Error(`There's no file at ${ref.path}`)
    return file.id
  }

  async function setFileLinks(
    tx: CatalogStore,
    owner: LinkOwner,
    id: number,
    links: FileLinkInput[],
    registered: Map<string, FileRecord>
  ) {
    await tx.fileLinks.set(
      owner,
      id,
      links.map((link) => ({
        fileId: refId(link, registered),
        note: link.note?.trim() || null,
      }))
    )
  }

  function trackArtists(
    artistIds: number[],
    featureIds: number[]
  ): TrackArtist[] {
    const both = artistIds.filter((id) => featureIds.includes(id))
    if (both.length > 0) {
      throw new Error(
        "An artist can't both perform a track and be featured on it"
      )
    }
    return [
      ...artistIds.map((artistId) => ({ artistId, featured: false })),
      ...featureIds.map((artistId) => ({ artistId, featured: true })),
    ]
  }

  function releaseValues(input: ReleaseInput) {
    const released = input.released?.trim()
    return {
      title: input.title.trim(),
      ...(released
        ? parseReleaseDate(released)
        : { releaseDate: null, releaseDatePrecision: null }),
      catalogNumber: input.catalogNumber?.trim() || null,
      variousArtists: input.variousArtists,
    }
  }

  async function setReleaseLinks(
    tx: CatalogStore,
    id: number,
    input: ReleaseInput
  ) {
    await tx.releases.setLinks("artists", id, unique(input.artistIds))
    await tx.releases.setLinks("labels", id, unique(input.labelIds))
    await tx.releases.setLinks("formats", id, unique(input.formatIds))
    await tx.releases.setLinks("media", id, unique(input.mediumIds))
  }

  async function durationOf(fileId: number) {
    const file = await store.files.get(fileId)
    if (!file) throw new Error(`There's no file ${fileId}`)
    if (file.type !== "music")
      throw new Error(`${file.path} isn't a music file`)
    return (await media.readAudio(file)).durationMs
  }

  const notFound = (what: string, id: number) =>
    new Error(`There's no ${what} ${id}`)

  /** What keeps an artist from being deleted. */
  async function artistBlockers(id: number) {
    const { releases, tracks, credits } = await store.artists.usage(id)
    return [
      releases && `Release artist on ${count(releases, "release")}`,
      tracks && `Performs on ${count(tracks, "track")}`,
      credits && `Credited ${count(credits, "time")}`,
    ].filter((reason): reason is string => Boolean(reason))
  }

  return {
    // Lists: release formats, release media, credit roles

    listItems: (kind: ListKind, args: ListArgs) =>
      store.lists.list(kind, {
        ...pagingOf(args),
        ...sortOf(args.sort, ["name"] as const, "Lists"),
        search: searchOf(args.q),
      }),
    getListItem: (kind: ListKind, id: number) => store.lists.get(kind, id),
    listItemsByIds: (kind: ListKind, ids: readonly number[]) =>
      store.lists.getMany(kind, ids),
    listItemUses: (kind: ListKind, id: number) => store.lists.uses(kind, id),
    createListItem: (kind: ListKind, name: string) =>
      store.lists.insert(kind, name.trim()),
    async renameListItem(kind: ListKind, id: number, name: string) {
      const item = await store.lists.update(kind, id, name.trim())
      if (!item) throw notFound(LIST_NAMES[kind], id)
      return item
    },
    async listItemBlockers(kind: ListKind, id: number) {
      const uses = await store.lists.uses(kind, id)
      if (uses === 0) return []
      return kind === "credit_roles"
        ? [`Used by ${count(uses, "credit")}`]
        : [`Used by ${count(uses, "release")}`]
    },
    async deleteListItem(kind: ListKind, id: number) {
      const uses = await store.lists.uses(kind, id)
      if (uses > 0) {
        const what = kind === "credit_roles" ? "credit" : "release"
        throw new Error(
          `The ${LIST_NAMES[kind]} is used by ${count(uses, what)}`
        )
      }
      await store.lists.delete(kind, id)
    },

    // Artists and labels

    listArtists: (args: ListArgs) =>
      store.artists.list({
        ...pagingOf(args),
        ...sortOf(args.sort, ["name"] as const, "Artists"),
        search: searchOf(args.q),
      }),
    getArtist: (id: number) => store.artists.get(id),
    artistsByIds: (ids: readonly number[]) => store.artists.getMany(ids),
    findArtistsByNames: (names: string[]) => store.artists.findByNames(names),

    async createArtist(input: {
      name: string
      pictureId?: number | null
      files: FileLinkInput[]
    }) {
      const prepared = await prepareRefs(input.files)
      return store.transaction(async (tx) => {
        const registered = await media.insertPrepared(tx, prepared)
        const artist = await tx.artists.insert({
          name: input.name.trim(),
          picture: input.pictureId ?? null,
        })
        await setFileLinks(tx, "artist", artist.id, input.files, registered)
        return artist
      })
    },

    async updateArtist(
      id: number,
      input: { name: string; pictureId?: number | null; files: FileLinkInput[] }
    ) {
      const prepared = await prepareRefs(input.files)
      return store.transaction(async (tx) => {
        const registered = await media.insertPrepared(tx, prepared)
        const artist = await tx.artists.update(id, {
          name: input.name.trim(),
          picture: input.pictureId ?? null,
        })
        if (!artist) throw notFound("artist", id)
        await setFileLinks(tx, "artist", id, input.files, registered)
        return artist
      })
    },

    artistBlockers,

    async deleteArtist(id: number) {
      const blockers = await artistBlockers(id)
      if (blockers.length > 0) {
        throw new Error(
          `The artist is still used: ${blockers.join(", ").toLowerCase()}`
        )
      }
      await store.artists.delete(id)
    },

    /** Releases where the artist is on tracks without being a release artist. */
    async artistAppearances(id: number) {
      const rows = await store.artists.appearances(id)
      const byRelease = new Map<number, number[]>()
      for (const { releaseId, trackId } of rows) {
        byRelease.set(releaseId, [...(byRelease.get(releaseId) ?? []), trackId])
      }
      return [...byRelease].map(([releaseId, trackIds]) => ({
        releaseId,
        trackIds,
      }))
    },

    artistCredits: (id: number) => store.artists.credits(id),
    artistFormatCounts: (id: number) => store.artists.formatCounts(id),

    listLabels: (args: ListArgs) =>
      store.labels.list({
        ...pagingOf(args),
        ...sortOf(args.sort, ["name"] as const, "Labels"),
        search: searchOf(args.q),
      }),
    getLabel: (id: number) => store.labels.get(id),
    labelsByIds: (ids: readonly number[]) => store.labels.getMany(ids),
    labelReleaseCount: (id: number) => store.labels.releaseCount(id),
    createLabel: (input: { name: string; pictureId?: number | null }) =>
      store.labels.insert({
        name: input.name.trim(),
        picture: input.pictureId ?? null,
      }),
    async updateLabel(
      id: number,
      input: { name: string; pictureId?: number | null }
    ) {
      const label = await store.labels.update(id, {
        name: input.name.trim(),
        picture: input.pictureId ?? null,
      })
      if (!label) throw notFound("label", id)
      return label
    },
    async labelBlockers(id: number) {
      const releases = await store.labels.releaseCount(id)
      return releases ? [`On ${count(releases, "release")}`] : []
    },
    async deleteLabel(id: number) {
      const releases = await store.labels.releaseCount(id)
      if (releases > 0)
        throw new Error(`The label is on ${count(releases, "release")}`)
      await store.labels.delete(id)
    },

    // Releases

    listReleases: (
      args: ListArgs & {
        format?: number | null
        medium?: number | null
        label?: number | null
        artist?: number | null
      }
    ) =>
      store.releases.list({
        ...pagingOf(args),
        ...sortOf(args.sort, ["title", "released"] as const, "Releases"),
        search: searchOf(args.q),
        format: args.format ?? undefined,
        medium: args.medium ?? undefined,
        label: args.label ?? undefined,
        artist: args.artist ?? undefined,
      }),
    getRelease: (id: number) => store.releases.get(id),
    releasesByIds: (ids: readonly number[]) => store.releases.getMany(ids),
    releasesTitled: (title: string) => store.releases.findByTitle(title),
    releaseLinksOf: (link: ReleaseLink, ids: readonly number[]) =>
      store.releases.linksOf(link, ids),

    /** `2006`, `2006-01` or `2006-01-10`, with only the known parts */
    released: (release: Release) =>
      release.releaseDate === null || release.releaseDatePrecision === null
        ? null
        : formatReleaseDate(release.releaseDate, release.releaseDatePrecision),

    async createRelease(input: ReleaseInput) {
      const values = releaseValues(input)
      return store.transaction(async (tx) => {
        const release = await tx.releases.insert({
          ...values,
          coverPicture: null,
        })
        await setReleaseLinks(tx, release.id, input)
        return release
      })
    },

    async updateRelease(id: number, input: ReleaseInput) {
      const values = releaseValues(input)
      return store.transaction(async (tx) => {
        const release = await tx.releases.update(id, values)
        if (!release) throw notFound("release", id)
        await setReleaseLinks(tx, id, input)
        return release
      })
    },

    async releaseBlockers(id: number) {
      const tracks = await store.releases.trackCount(id)
      return tracks ? [`Has ${count(tracks, "track")}`] : []
    },

    async deleteRelease(id: number) {
      const tracks = await store.releases.trackCount(id)
      if (tracks > 0) {
        throw new Error(
          `The release still has ${count(tracks, "track")}. Delete them first.`
        )
      }
      await store.releases.delete(id)
    },

    /**
     * Saves a release's whole track list: updates the rows with an id,
     * creates tracks for the others (registering files given by path), and
     * deletes the tracks left out. Their files stay registered.
     */
    async setReleaseTracks(id: number, rows: ReleaseTrackInput[]) {
      const release = await store.releases.get(id)
      if (!release) throw notFound("release", id)
      const fresh = rows.filter((row) => row.id == null)
      const prepared = await prepareRefs(fresh)
      // Durations are read now, before the transaction holds the write lock
      const durations = new Map<string, number | null>()
      for (const row of fresh) {
        const file =
          row.fileId != null ? await store.files.get(row.fileId) : null
        const path = file?.path ?? media.normalizePath(row.path ?? "")
        durations.set(path, (await media.readAudioAt(path)).durationMs)
      }

      return store.transaction(async (tx) => {
        const existing = (await tx.tracks.ofReleases([id])).get(id) ?? []
        const kept = new Set(
          rows.flatMap((row) => (row.id != null ? [row.id] : []))
        )
        for (const track of existing) {
          if (!kept.has(track.id)) await tx.tracks.delete(track.id)
        }
        for (const trackId of kept) {
          if (!existing.some((track) => track.id === trackId)) {
            throw new Error(`Track ${trackId} isn't on this release`)
          }
        }
        await tx.tracks.shiftNumbers(id, RENUMBER_OFFSET)
        const registered = await media.insertPrepared(tx, prepared)

        for (const row of rows) {
          const values = {
            cdNumber: row.cdNumber,
            trackNumber: row.trackNumber,
            title: row.title.trim(),
          }
          let trackId = row.id
          if (trackId != null) {
            await tx.tracks.update(trackId, values)
          } else {
            const fileId = refId(row, registered)
            const file = await tx.files.get(fileId)
            const track = await tx.tracks.insert({
              ...values,
              releaseId: id,
              fileId,
              durationMs: durations.get(file?.path ?? "") ?? null,
            })
            trackId = track.id
          }
          await tx.tracks.setArtists(
            trackId,
            trackArtists(row.artistIds, row.featureIds)
          )
        }
        return release
      })
    },

    /** Replaces a release's credits, and its tracks' credits. */
    async setReleaseCredits(
      id: number,
      input: {
        credits: CreditInput[]
        tracks: { trackId: number; credits: CreditInput[] }[]
      }
    ) {
      return store.transaction(async (tx) => {
        const release = await tx.releases.get(id)
        if (!release) throw notFound("release", id)
        const tracks = new Set(
          ((await tx.tracks.ofReleases([id])).get(id) ?? []).map((t) => t.id)
        )
        await tx.credits.set("release", id, uniqueCredits(input.credits))
        for (const { trackId, credits } of input.tracks) {
          if (!tracks.has(trackId)) {
            throw new Error(`Track ${trackId} isn't on this release`)
          }
          await tx.credits.set("track", trackId, uniqueCredits(credits))
        }
        return release
      })
    },

    /** Sets a release's cover and replaces its file links, registering paths. */
    async setReleaseFiles(
      id: number,
      input: { cover?: FileRef | null; files: FileLinkInput[] }
    ) {
      const refs = [...(input.cover ? [input.cover] : []), ...input.files]
      const prepared = await prepareRefs(refs)
      return store.transaction(async (tx) => {
        const registered = await media.insertPrepared(tx, prepared)
        const release = await tx.releases.update(id, {
          coverPicture: input.cover ? refId(input.cover, registered) : null,
        })
        if (!release) throw notFound("release", id)
        await setFileLinks(tx, "release", id, input.files, registered)
        return release
      })
    },

    // Tracks

    listTracks: (args: ListArgs & { release?: number | null }) =>
      store.tracks.list({
        ...pagingOf(args),
        ...sortOf(args.sort, ["title"] as const, "Tracks"),
        search: searchOf(args.q),
        release: args.release ?? undefined,
      }),
    getTrack: (id: number) => store.tracks.get(id),
    tracksByIds: (ids: readonly number[]) => store.tracks.getMany(ids),
    tracksOfReleases: (ids: readonly number[]) => store.tracks.ofReleases(ids),
    tracksOfFiles: (fileIds: readonly number[]) =>
      store.tracks.ofFiles(fileIds),
    trackArtistsOf: (ids: readonly number[]) => store.tracks.artistsOf(ids),

    async createTrack(input: TrackInput) {
      const durationMs = await durationOf(input.fileId)
      const prepared = await prepareRefs(input.files)
      return store.transaction(async (tx) => {
        const registered = await media.insertPrepared(tx, prepared)
        const track = await tx.tracks.insert({
          title: input.title.trim(),
          cdNumber: input.cdNumber,
          trackNumber: input.trackNumber,
          releaseId: input.releaseId,
          fileId: input.fileId,
          durationMs,
        })
        await tx.tracks.setArtists(
          track.id,
          trackArtists(input.artistIds, input.featureIds)
        )
        await tx.credits.set("track", track.id, uniqueCredits(input.credits))
        await setFileLinks(tx, "track", track.id, input.files, registered)
        return track
      })
    },

    async updateTrack(id: number, input: TrackInput) {
      const current = await store.tracks.get(id)
      if (!current) throw notFound("track", id)
      // A new audio file means a new duration
      const durationMs =
        input.fileId === current.fileId
          ? current.durationMs
          : await durationOf(input.fileId)
      const prepared = await prepareRefs(input.files)
      return store.transaction(async (tx) => {
        const registered = await media.insertPrepared(tx, prepared)
        const track = await tx.tracks.update(id, {
          title: input.title.trim(),
          cdNumber: input.cdNumber,
          trackNumber: input.trackNumber,
          releaseId: input.releaseId,
          fileId: input.fileId,
          durationMs,
        })
        if (!track) throw notFound("track", id)
        await tx.tracks.setArtists(
          id,
          trackArtists(input.artistIds, input.featureIds)
        )
        await tx.credits.set("track", id, uniqueCredits(input.credits))
        await setFileLinks(tx, "track", id, input.files, registered)
        return track
      })
    },

    deleteTrack: (id: number) => store.tracks.delete(id),

    /** Who performs a track (design §4.3), as artist ids. */
    performers(
      release: Release,
      own: TrackArtist[],
      releaseArtists: number[]
    ): number[] {
      const performing = own.filter((a) => !a.featured).map((a) => a.artistId)
      if (performing.length > 0 || release.variousArtists) return performing
      return releaseArtists
    },

    creditsOf: (owner: CreditOwner, ids: readonly number[]) =>
      store.credits.of(owner, ids),
    totals: () => store.stats.totals(),

    // Import suggestions (design §7.9), from embedded tags or else names

    /** What a folder suggests for a new release. */
    async suggestRelease(folder: string) {
      const files = await media.scanFolder(folder)
      const music = files.filter((file) => file.type === "music")
      const tags = await Promise.all(
        music.slice(0, 50).map((file) => media.readAudioAt(file.path))
      )
      const album = mostCommon(tags.map((t) => t.tags.album))
      const date = mostCommon(tags.map((t) => t.tags.date))
      const names = mostCommon(
        tags.map((t) => {
          const names = t.tags.albumArtists.length
            ? t.tags.albumArtists
            : t.tags.artists
          return names.length ? names.join("\u0000") : null
        })
      )?.split("\u0000")
      const normalized = media.normalizePath(folder)
      const title =
        album ?? (normalized === "" ? null : basename(normalized)) ?? ""
      return {
        title,
        released: date && isValidDate(date) ? date : null,
        artistNames: names ?? [],
        sameTitle: title ? await store.releases.findByTitle(title) : [],
        music: music.length,
        images: files.filter((file) => file.type === "image").length,
        others: files.filter((file) => file.type === "other").length,
      }
    },

    /** Rows for a folder's audio files: from tags, or else the file's name. */
    async suggestTracks(folder: string) {
      const normalized = media.normalizePath(folder)
      const files = (await media.scanFolder(folder)).filter(
        (f) => f.type === "music"
      )
      const tracks = await store.tracks.ofFiles(
        files.flatMap((file) => (file.file ? [file.file.id] : []))
      )
      const numbers = new Map<number, number>()
      const rows = []
      for (const file of files) {
        const { durationMs, tags } = await media.readAudioAt(file.path)
        const fromName = fromFileName(file.path, normalized)
        const cdNumber = tags.discNumber ?? fromName.cdNumber
        const position = (numbers.get(cdNumber) ?? 0) + 1
        numbers.set(cdNumber, position)
        rows.push({
          path: file.path,
          file: file.file,
          track: file.file ? (tracks.get(file.file.id) ?? null) : null,
          cdNumber,
          trackNumber: tags.trackNumber ?? fromName.trackNumber ?? position,
          title: tags.title ?? fromName.title,
          artistNames: tags.artists,
          durationMs,
        })
      }
      return rows
    },
  }
}

/** `CD2/03 Title.flac` → disc 2, track 3, "Title" (design §7.9). */
function fromFileName(path: string, folder: string) {
  const relative =
    folder && path.startsWith(`${folder}/`)
      ? path.slice(folder.length + 1)
      : path
  const disc = /(?:^|\/)(?:cd|disc|disk)\s*(\d+)\//i.exec(
    `${dirname(relative)}/`
  )
  const name = basename(relative).replace(/\.[^.]+$/, "")
  const numbered = /^(\d{1,3})(?:[\s._-]+(.*))?$/.exec(name)
  return {
    cdNumber: disc ? Number(disc[1]) || 1 : 1,
    trackNumber: numbered ? Number(numbered[1]) || null : null,
    title: (numbered?.[2] ?? name).trim() || name,
  }
}

function isValidDate(text: string) {
  try {
    parseReleaseDate(text)
    return true
  } catch {
    return false
  }
}

function mostCommon(values: (string | null)[]): string | null {
  const counts = new Map<string, number>()
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  let best: string | null = null
  for (const [value, n] of counts)
    if (best === null || n > counts.get(best)!) best = value
  return best
}

function unique(ids: number[]): number[] {
  return [...new Set(ids)]
}

function uniqueCredits(credits: CreditInput[]): CreditInput[] {
  const seen = new Set<string>()
  return credits.filter(({ artistId, roleId }) => {
    const key = `${artistId}:${roleId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`
}
