import type { Catalog, FileLinkInput, FileRef } from "../../slunk/catalog.ts"
import type { ListKind } from "../../slunk/catalog/repository.ts"
import { loadAll, loadRequired } from "./loaders.ts"
import type { Resolvers } from "./resolvers_types.ts"

const LIST_TYPES = {
  release_formats: "ReleaseFormat",
  release_media: "ReleaseMedium",
  credit_roles: "CreditRole",
} as const

/** A GraphQL id, as the database's number. */
const n = (id: string | number) => Number(id)
const ids = (list: readonly (string | number)[]) => list.map(n)
const optional = (id: string | number | null | undefined) =>
  id == null ? null : n(id)

const fileRef = (ref: {
  fileId?: string | null
  path?: string | null
}): FileRef => ({
  fileId: optional(ref.fileId),
  path: ref.path,
})
const fileLinks = (
  links: {
    fileId?: string | null
    path?: string | null
    note?: string | null
  }[]
): FileLinkInput[] =>
  links.map((link) => ({ ...fileRef(link), note: link.note }))
const credits = (list: { artistId: string; roleId: string }[]) =>
  list.map((c) => ({ artistId: n(c.artistId), roleId: n(c.roleId) }))

/** Pairs tag names with the artists that have exactly those names. */
async function suggestArtists(catalog: Catalog, names: string[]) {
  const found = await catalog.findArtistsByNames(names)
  const byName = new Map(
    found.map((artist) => [artist.name.toLowerCase(), artist])
  )
  return names.map((name) => ({
    name,
    artist: byName.get(name.toLowerCase()) ?? null,
  }))
}

/** `uses` and `blockers` for any of the three list types. */
const listItemFields = {
  uses: (
    item: { kind: ListKind; id: number },
    _args: unknown,
    { catalog }: { catalog: Catalog }
  ) => catalog.listItemUses(item.kind, item.id),
  blockers: (
    item: { kind: ListKind; id: number },
    _args: unknown,
    { catalog }: { catalog: Catalog }
  ) => catalog.listItemBlockers(item.kind, item.id),
}

export const catalogResolvers: Resolvers = {
  Query: {
    artists: (_parent, args, { catalog }) => catalog.listArtists(args),
    artist: (_parent, { id }, { catalog }) => catalog.getArtist(n(id)),
    labels: (_parent, args, { catalog }) => catalog.listLabels(args),
    label: (_parent, { id }, { catalog }) => catalog.getLabel(n(id)),
    releases: (_parent, args, { catalog }) =>
      catalog.listReleases({
        ...args,
        format: optional(args.format),
        medium: optional(args.medium),
        label: optional(args.label),
        artist: optional(args.artist),
      }),
    release: (_parent, { id }, { catalog }) => catalog.getRelease(n(id)),
    releasesTitled: (_parent, { title }, { catalog }) =>
      catalog.releasesTitled(title),
    tracks: (_parent, args, { catalog }) =>
      catalog.listTracks({ ...args, release: optional(args.release) }),
    track: (_parent, { id }, { catalog }) => catalog.getTrack(n(id)),
    listItems: (_parent, { kind, ...args }, { catalog }) =>
      catalog.listItems(kind, args),
    listItem: (_parent, { kind, id }, { catalog }) =>
      catalog.getListItem(kind, n(id)),
    catalogTotals: (_parent, _args, { catalog }) => catalog.totals(),
    releaseSuggestion: async (_parent, { folder }, { catalog }) => {
      const { artistNames, ...suggestion } =
        await catalog.suggestRelease(folder)
      return {
        ...suggestion,
        artists: await suggestArtists(catalog, artistNames),
      }
    },
    trackSuggestions: async (_parent, { folder }, { catalog }) => {
      const rows = await catalog.suggestTracks(folder)
      return Promise.all(
        rows.map(async ({ artistNames, ...row }) => ({
          ...row,
          artists: await suggestArtists(catalog, artistNames),
        }))
      )
    },
  },

  Mutation: {
    createArtist: (_parent, { input }, { catalog }) =>
      catalog.createArtist({
        name: input.name,
        pictureId: optional(input.pictureId),
        files: fileLinks(input.files),
      }),
    updateArtist: (_parent, { id, input }, { catalog }) =>
      catalog.updateArtist(n(id), {
        name: input.name,
        pictureId: optional(input.pictureId),
        files: fileLinks(input.files),
      }),
    deleteArtist: async (_parent, { id }, { catalog }) => {
      await catalog.deleteArtist(n(id))
      return id
    },
    createLabel: (_parent, { input }, { catalog }) =>
      catalog.createLabel({
        name: input.name,
        pictureId: optional(input.pictureId),
      }),
    updateLabel: (_parent, { id, input }, { catalog }) =>
      catalog.updateLabel(n(id), {
        name: input.name,
        pictureId: optional(input.pictureId),
      }),
    deleteLabel: async (_parent, { id }, { catalog }) => {
      await catalog.deleteLabel(n(id))
      return id
    },
    createRelease: (_parent, { input }, { catalog }) =>
      catalog.createRelease(releaseInput(input)),
    updateRelease: (_parent, { id, input }, { catalog }) =>
      catalog.updateRelease(n(id), releaseInput(input)),
    deleteRelease: async (_parent, { id }, { catalog }) => {
      await catalog.deleteRelease(n(id))
      return id
    },
    setReleaseTracks: (_parent, { id, tracks }, { catalog }) =>
      catalog.setReleaseTracks(
        n(id),
        tracks.map((row) => ({
          ...fileRef(row),
          id: optional(row.id),
          cdNumber: row.cdNumber,
          trackNumber: row.trackNumber,
          title: row.title,
          artistIds: ids(row.artistIds),
          featureIds: ids(row.featureIds),
        }))
      ),
    setReleaseFiles: (_parent, { id, input }, { catalog }) =>
      catalog.setReleaseFiles(n(id), {
        cover: input.cover ? fileRef(input.cover) : null,
        files: fileLinks(input.files),
      }),
    setReleaseCredits: (_parent, { id, input }, { catalog }) =>
      catalog.setReleaseCredits(n(id), {
        credits: credits(input.credits),
        tracks: input.tracks.map((track) => ({
          trackId: n(track.trackId),
          credits: credits(track.credits),
        })),
      }),
    createTrack: (_parent, { input }, { catalog }) =>
      catalog.createTrack(trackInput(input)),
    updateTrack: (_parent, { id, input }, { catalog }) =>
      catalog.updateTrack(n(id), trackInput(input)),
    deleteTrack: async (_parent, { id }, { catalog }) => {
      await catalog.deleteTrack(n(id))
      return id
    },
    createListItem: (_parent, { kind, name }, { catalog }) =>
      catalog.createListItem(kind, name),
    renameListItem: (_parent, { kind, id, name }, { catalog }) =>
      catalog.renameListItem(kind, n(id), name),
    deleteListItem: async (_parent, { kind, id }, { catalog }) => {
      await catalog.deleteListItem(kind, n(id))
      return id
    },
  },

  Artist: {
    picture: (artist, _args, { loaders }) =>
      artist.picture === null ? null : loaders.file.load(artist.picture),
    files: (artist, _args, { loaders }) => loaders.artistFiles.load(artist.id),
    blockers: (artist, _args, { catalog }) => catalog.artistBlockers(artist.id),
    appearances: (artist, _args, { catalog }) =>
      catalog.artistAppearances(artist.id),
    credits: (artist, _args, { catalog }) => catalog.artistCredits(artist.id),
    formatCounts: (artist, _args, { catalog }) =>
      catalog.artistFormatCounts(artist.id),
    counts: async (artist, _args, { catalog, loaders }) => ({
      releases: (await catalog.listReleases({ artist: artist.id, perPage: 1 }))
        .total,
      appearances: (await catalog.artistAppearances(artist.id)).length,
      credits: (await catalog.artistCredits(artist.id)).length,
      files:
        (await loaders.artistFiles.load(artist.id)).length +
        (artist.picture === null ? 0 : 1),
    }),
  },

  Appearance: {
    release: (appearance, _args, { loaders }) =>
      loadRequired(loaders.release, appearance.releaseId),
    tracks: (appearance, _args, { loaders }) =>
      loadAll(loaders.track, appearance.trackIds),
  },

  ArtistCredit: {
    role: (credit, _args, { loaders }) =>
      loadRequired(loaders.role, credit.roleId),
    release: (credit, _args, { loaders }) =>
      loadRequired(loaders.release, credit.releaseId),
    track: (credit, _args, { loaders }) =>
      credit.trackId === null ? null : loaders.track.load(credit.trackId),
  },

  FormatCount: {
    format: (count, _args, { loaders }) =>
      loadRequired(loaders.format, count.formatId),
  },

  Label: {
    picture: (label, _args, { loaders }) =>
      label.picture === null ? null : loaders.file.load(label.picture),
    releaseCount: (label, _args, { catalog }) =>
      catalog.labelReleaseCount(label.id),
    blockers: (label, _args, { catalog }) => catalog.labelBlockers(label.id),
  },

  Release: {
    released: (release, _args, { catalog }) => catalog.released(release),
    cover: (release, _args, { loaders }) =>
      release.coverPicture === null
        ? null
        : loaders.file.load(release.coverPicture),
    artists: async (release, _args, { loaders }) =>
      loadAll(loaders.artist, await loaders.releaseArtists.load(release.id)),
    labels: async (release, _args, { loaders }) =>
      loadAll(loaders.label, await loaders.releaseLabels.load(release.id)),
    formats: async (release, _args, { loaders }) =>
      loadAll(loaders.format, await loaders.releaseFormats.load(release.id)),
    media: async (release, _args, { loaders }) =>
      loadAll(loaders.medium, await loaders.releaseMedia.load(release.id)),
    tracks: (release, _args, { loaders }) =>
      loaders.releaseTracks.load(release.id),
    credits: (release, _args, { loaders }) =>
      loaders.releaseCredits.load(release.id),
    files: (release, _args, { loaders }) =>
      loaders.releaseFiles.load(release.id),
    fileCount: async (release, _args, { loaders }) => {
      const links = await loaders.releaseFiles.load(release.id)
      const files = new Set(links.map((link) => link.fileId))
      if (release.coverPicture !== null) files.add(release.coverPicture)
      return files.size
    },
    durationMs: async (release, _args, { loaders }) => {
      const durations = (await loaders.releaseTracks.load(release.id)).flatMap(
        (track) => (track.durationMs === null ? [] : [track.durationMs])
      )
      return durations.length ? durations.reduce((a, b) => a + b, 0) : null
    },
    blockers: (release, _args, { catalog }) =>
      catalog.releaseBlockers(release.id),
  },

  Track: {
    release: (track, _args, { loaders }) =>
      loadRequired(loaders.release, track.releaseId),
    file: (track, _args, { loaders }) =>
      loadRequired(loaders.file, track.fileId),
    artists: async (track, _args, { loaders }) => {
      const own = await loaders.trackArtists.load(track.id)
      return loadAll(
        loaders.artist,
        own.filter((a) => !a.featured).map((a) => a.artistId)
      )
    },
    features: async (track, _args, { loaders }) => {
      const own = await loaders.trackArtists.load(track.id)
      return loadAll(
        loaders.artist,
        own.filter((a) => a.featured).map((a) => a.artistId)
      )
    },
    performers: async (track, _args, { catalog, loaders }) => {
      const [release, own, releaseArtists] = await Promise.all([
        loadRequired(loaders.release, track.releaseId),
        loaders.trackArtists.load(track.id),
        loaders.releaseArtists.load(track.releaseId),
      ])
      return loadAll(
        loaders.artist,
        catalog.performers(release, own, releaseArtists)
      )
    },
    credits: (track, _args, { loaders }) => loaders.trackCredits.load(track.id),
    files: (track, _args, { loaders }) => loaders.trackFiles.load(track.id),
  },

  Credit: {
    artist: (credit, _args, { loaders }) =>
      loadRequired(loaders.artist, credit.artistId),
    role: (credit, _args, { loaders }) =>
      loadRequired(loaders.role, credit.roleId),
  },

  ListItem: {
    __resolveType: (item) => LIST_TYPES[item.kind],
  },
  ReleaseFormat: listItemFields,
  ReleaseMedium: listItemFields,
  CreditRole: listItemFields,

  FileLink: {
    file: (link, _args, { loaders }) => loadRequired(loaders.file, link.fileId),
  },
}

function releaseInput(input: {
  title: string
  released?: string | null
  catalogNumber?: string | null
  variousArtists: boolean
  artistIds: string[]
  labelIds: string[]
  formatIds: string[]
  mediumIds: string[]
}) {
  return {
    title: input.title,
    released: input.released,
    catalogNumber: input.catalogNumber,
    variousArtists: input.variousArtists,
    artistIds: ids(input.artistIds),
    labelIds: ids(input.labelIds),
    formatIds: ids(input.formatIds),
    mediumIds: ids(input.mediumIds),
  }
}

function trackInput(input: {
  releaseId: string
  fileId: string
  cdNumber: number
  trackNumber: number
  title: string
  artistIds: string[]
  featureIds: string[]
  credits: { artistId: string; roleId: string }[]
  files: {
    fileId?: string | null
    path?: string | null
    note?: string | null
  }[]
}) {
  return {
    releaseId: n(input.releaseId),
    fileId: n(input.fileId),
    cdNumber: input.cdNumber,
    trackNumber: input.trackNumber,
    title: input.title,
    artistIds: ids(input.artistIds),
    featureIds: ids(input.featureIds),
    credits: credits(input.credits),
    files: fileLinks(input.files),
  }
}
