import { Fragment } from "react"

import { artistUrl, Names } from "@/components/names"
import { formatRole } from "@/lib/format"

type CreditItem = {
  role: { id: string; name: string }
  artist: { id: string; name: string }
}

/** Credits, a line per role: "Writer – Mathew Gerrard, Robbie Nevil". */
export function CreditLines({ credits }: { credits: CreditItem[] }) {
  const roles = new Map<
    string,
    { name: string; artists: CreditItem["artist"][] }
  >()
  for (const { role, artist } of credits) {
    const line = roles.get(role.id) ?? { name: role.name, artists: [] }
    line.artists.push(artist)
    roles.set(role.id, line)
  }
  return (
    <div className="flex flex-col gap-0.5">
      {[...roles].map(([id, { name, artists }]) => (
        <Fragment key={id}>
          <span>
            <span className="text-muted-foreground">{formatRole(name)}</span> –{" "}
            <Names items={artists} to={artistUrl} />
          </span>
        </Fragment>
      ))}
    </div>
  )
}
