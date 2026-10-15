import type {
  FileLinksRepository,
  FilesRepository,
} from "../media/repository.ts"
import type { ListQuery, Page } from "../paging.ts"
import type { DatePrecision } from "../dates.ts"
import type { TagFilter, TagsRepository } from "../tagging/repository.ts"

export type Artist = {
  id: number
  name: string
  /** A file id */
  picture: number | null
  insertedAt: number
  updatedAt: number
}

/** Labels have the same shape: `picture` is the logo. */
export type Label = Artist

export type Release = {
  id: number
  title: string
  /** Epoch seconds, midnight UTC */
  releaseDate: number | null
  releaseDatePrecision: DatePrecision | null
  catalogNumber: string | null
  /** A file id */
  coverPicture: number | null
  variousArtists: boolean
  insertedAt: number
  updatedAt: number
}

export type Track = {
  id: number
  title: string
  durationMs: number | null
  trackNumber: number
  cdNumber: number
  releaseId: number
  fileId: number
  insertedAt: number
  updatedAt: number
}

export type TrackArtist = { artistId: number; featured: boolean }

/** A disc's own title, as printed. Only discs with a title have one. */
export type DiscTitle = { cdNumber: number; title: string }

/** A credit line: a role as printed, and the artists who hold it, in order. */
export type Credit = { role: string; artistIds: number[] }

/** The lists the user manages, which are just names. */
export type ListKind = "release_formats" | "release_media"

export type ListItem = { kind: ListKind; id: number; name: string }

/** A release the artist is on as a track artist only, with those tracks. */
export type Appearance = { releaseId: number; trackIds: number[] }

/** A credit line the artist is on */
export type ArtistCredit = {
  role: string
  releaseId: number
  trackId: number | null
}

export type FormatCount = { formatId: number; count: number }

export type NamedValues = { name: string; picture: number | null }

/** Artists and labels: named entities with a picture. */
export interface NamedRepository<T> {
  list(query: ListQuery<"name">): Promise<Page<T>>
  get(id: number): Promise<T | null>
  getMany(ids: readonly number[]): Promise<T[]>
  /** Exact names, ignoring case */
  findByNames(names: string[]): Promise<T[]>
  insert(values: NamedValues): Promise<T>
  update(id: number, values: Partial<NamedValues>): Promise<T | null>
  delete(id: number): Promise<void>
}

export interface ArtistsRepository extends NamedRepository<Artist> {
  /** Where the artist is used, which keeps it from being deleted */
  usage(
    id: number
  ): Promise<{ releases: number; tracks: number; credits: number }>
  /** Releases where the artist is on tracks but isn't a release artist */
  appearances(id: number): Promise<{ releaseId: number; trackId: number }[]>
  credits(id: number): Promise<ArtistCredit[]>
  /** How many of the artist's releases have each format */
  formatCounts(id: number): Promise<FormatCount[]>
}

export interface LabelsRepository extends NamedRepository<Label> {
  releaseCount(id: number): Promise<number>
}

/** A release list's search and filters. They all have to match. */
export type ReleaseFilters = {
  search?: string
  format?: number
  medium?: number
  label?: number
  artist?: number
  tags?: TagFilter[]
}

export type ReleaseQuery = ListQuery<"title" | "released"> & ReleaseFilters

export type ReleaseValues = Omit<Release, "id" | "insertedAt" | "updatedAt">

/** The rows that link a release to artists, labels, formats or media. */
export type ReleaseLink = "artists" | "labels" | "formats" | "media"

export interface ReleasesRepository {
  list(query: ReleaseQuery): Promise<Page<Release>>
  /** Every matching release's id, newest first, for selecting them all */
  ids(query: ReleaseFilters): Promise<number[]>
  get(id: number): Promise<Release | null>
  getMany(ids: readonly number[]): Promise<Release[]>
  /** Same title, ignoring case */
  findByTitle(title: string): Promise<Release[]>
  insert(values: ReleaseValues): Promise<Release>
  update(id: number, values: Partial<ReleaseValues>): Promise<Release | null>
  delete(id: number): Promise<void>
  /** Linked ids by release, in display order */
  linksOf(
    link: ReleaseLink,
    releaseIds: readonly number[]
  ): Promise<Map<number, number[]>>
  /** Replaces the links; their order is the display order */
  setLinks(link: ReleaseLink, releaseId: number, ids: number[]): Promise<void>
  /** Disc titles by release, by disc number */
  discTitlesOf(releaseIds: readonly number[]): Promise<Map<number, DiscTitle[]>>
  /** Replaces the disc titles. Each disc needs a track already. */
  setDiscTitles(releaseId: number, titles: DiscTitle[]): Promise<void>
  trackCount(id: number): Promise<number>
  /** Releases with no artist of their own, for the library check */
  withoutArtists(): Promise<Release[]>
}

export type TrackValues = Omit<Track, "id" | "insertedAt" | "updatedAt">

export interface TracksRepository {
  list(
    query: ListQuery<"title"> & { release?: number; tags?: TagFilter[] }
  ): Promise<Page<Track>>
  get(id: number): Promise<Track | null>
  getMany(ids: readonly number[]): Promise<Track[]>
  /** The track each file is the audio of, by file id */
  ofFiles(fileIds: readonly number[]): Promise<Map<number, Track>>
  /** By release, in order: disc, then number */
  ofReleases(releaseIds: readonly number[]): Promise<Map<number, Track[]>>
  insert(values: TrackValues): Promise<Track>
  update(id: number, values: Partial<TrackValues>): Promise<Track | null>
  delete(id: number): Promise<void>
  /** Moves a release's track numbers out of the way, to renumber them */
  shiftNumbers(releaseId: number, by: number): Promise<void>
  /** Own artists by track, in display order */
  artistsOf(trackIds: readonly number[]): Promise<Map<number, TrackArtist[]>>
  setArtists(trackId: number, artists: TrackArtist[]): Promise<void>
  /**
   * Tracks on various-artists releases with no non-featured artist of their
   * own, so nobody performs them (design §4.3), for the library check
   */
  withoutPerformers(): Promise<Track[]>
}

export interface ListsRepository {
  list(kind: ListKind, query: ListQuery<"name">): Promise<Page<ListItem>>
  get(kind: ListKind, id: number): Promise<ListItem | null>
  getMany(kind: ListKind, ids: readonly number[]): Promise<ListItem[]>
  insert(kind: ListKind, name: string): Promise<ListItem>
  update(kind: ListKind, id: number, name: string): Promise<ListItem | null>
  delete(kind: ListKind, id: number): Promise<void>
  /** Releases with the format or medium */
  uses(kind: ListKind, id: number): Promise<number>
}

export type CreditOwner = "release" | "track"

export interface CreditsRepository {
  /** Credit lines by release or track, in display order */
  of(owner: CreditOwner, ids: readonly number[]): Promise<Map<number, Credit[]>>
  /**
   * Replaces the lines, in display order. Call it inside a transaction: the
   * database checks that each line has an artist at commit.
   */
  set(owner: CreditOwner, id: number, credits: Credit[]): Promise<void>
  /** Roles in use on releases and tracks, each spelling once, the most used first */
  roles(query: { search?: string; limit: number }): Promise<string[]>
}

export interface StatsRepository {
  totals(): Promise<{
    releases: number
    artists: number
    tracks: number
    labels: number
    durationMs: number
  }>
}

/** Every repository the catalog needs, and a way to use them in one transaction. */
export interface CatalogStore {
  artists: ArtistsRepository
  labels: LabelsRepository
  releases: ReleasesRepository
  tracks: TracksRepository
  lists: ListsRepository
  credits: CreditsRepository
  stats: StatsRepository
  files: FilesRepository
  fileLinks: FileLinksRepository
  /** A track's tags are saved with the track, through tagging */
  tags: TagsRepository
  /** Runs `fn` in one transaction, with repositories bound to it. */
  transaction<T>(fn: (store: CatalogStore) => Promise<T>): Promise<T>
}
