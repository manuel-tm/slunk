import { DiscIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A cover or picture: the original image, loaded lazily (design §7.3), or a
 * placeholder.
 */
export function Cover({
  file,
  alt,
  className,
}: {
  file: { id: string } | null | undefined
  alt: string
  className?: string
}) {
  if (!file) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center bg-muted text-muted-foreground",
          className
        )}
      >
        <DiscIcon className="size-1/3" />
      </div>
    )
  }
  return (
    <img
      src={`/raw/files/${file.id}`}
      alt={alt}
      loading="lazy"
      className={cn("aspect-square bg-muted object-cover", className)}
    />
  )
}
