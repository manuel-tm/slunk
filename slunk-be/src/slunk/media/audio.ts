import { parseFile } from "music-metadata"

/** What an audio file's embedded tags say, as suggestions only. */
export type AudioTags = {
  title: string | null
  artists: string[]
  album: string | null
  albumArtists: string[]
  trackNumber: number | null
  discNumber: number | null
  /** `2006`, `2006-01` or `2006-01-10` */
  date: string | null
}

/**
 * Reads an audio file's duration and embedded tags. It only reads the file.
 * A file it can't parse has no duration and no tags.
 */
export async function readAudio(
  absolutePath: string
): Promise<{ durationMs: number | null; tags: AudioTags }> {
  try {
    const { format, common } = await parseFile(absolutePath, {
      duration: true,
      skipCovers: true,
    })
    const albumArtist = common.albumartist?.trim()
    return {
      durationMs:
        format.duration === undefined
          ? null
          : Math.round(format.duration * 1000),
      tags: {
        title: common.title?.trim() || null,
        artists: (common.artists ?? []).map((a) => a.trim()).filter(Boolean),
        album: common.album?.trim() || null,
        albumArtists: albumArtist ? [albumArtist] : [],
        trackNumber: common.track.no ?? null,
        discNumber: common.disk.no ?? null,
        date: dateOf(common.date, common.year),
      },
    }
  } catch {
    return {
      durationMs: null,
      tags: {
        title: null,
        artists: [],
        album: null,
        albumArtists: [],
        trackNumber: null,
        discNumber: null,
        date: null,
      },
    }
  }
}

function dateOf(date: string | undefined, year: number | undefined) {
  const match = /^\d{4}(-\d{2}(-\d{2})?)?/.exec(date ?? "")
  if (match) return match[0]
  return year ? String(year) : null
}
