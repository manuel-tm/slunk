import { FileIcon } from "lucide-react"

import { Cover } from "@/components/cover"

type LinkedFile = {
  file: { id: string; name: string; type: string }
  note?: string | null
}

/**
 * A primary image, then linked files: images in a grid, other files (a
 * booklet, a rip log) in a list, each with its note. Each one opens the file.
 */
export function FileGallery({
  primary,
  primaryLabel,
  links,
}: {
  primary: { id: string; name: string } | null | undefined
  primaryLabel: string
  links: LinkedFile[]
}) {
  const images = links.filter((link) => link.file.type === "image")
  const others = links.filter((link) => link.file.type !== "image")
  const open = (id: string) => `/raw/files/${id}`

  return (
    <div className="flex flex-col gap-6 text-xs">
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-semibold">{primaryLabel}</h2>
        {primary ? (
          <a
            href={open(primary.id)}
            target="_blank"
            rel="noreferrer"
            className="w-64"
          >
            <Cover file={primary} alt={primaryLabel} className="w-64" />
          </a>
        ) : (
          <p className="text-muted-foreground">None set.</p>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-semibold">Linked files</h2>
        {links.length === 0 && (
          <p className="text-muted-foreground">None linked.</p>
        )}
        {images.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
            {images.map(({ file, note }) => (
              <a
                key={file.id}
                href={open(file.id)}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-1"
              >
                <Cover file={file} alt={note ?? file.name} />
                <span className="truncate">{note ?? file.name}</span>
              </a>
            ))}
          </div>
        )}
        {others.length > 0 && (
          <ul className="flex flex-col gap-1">
            {others.map(({ file, note }) => (
              <li key={file.id}>
                <a
                  href={open(file.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 hover:underline [&_svg]:size-4"
                >
                  <FileIcon />
                  {file.name}
                </a>
                {note && (
                  <span className="text-muted-foreground"> · {note}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
