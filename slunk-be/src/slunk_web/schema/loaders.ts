import DataLoader from "dataloader"
import type { Media } from "../../slunk/media.ts"
import type { TrackRef } from "../../slunk/media/repository.ts"

/**
 * Batches the related rows a list shows into one query per column (design
 * §7.3). Made fresh for every request, so nothing is cached between them.
 */
export function createLoaders(media: Media) {
  return {
    trackOfFile: new DataLoader<number, TrackRef | null>(async (ids) => {
      const tracks = await media.tracksOfFiles([...ids])
      return ids.map((id) => tracks.get(id) ?? null)
    }),
  }
}

export type Loaders = ReturnType<typeof createLoaders>
