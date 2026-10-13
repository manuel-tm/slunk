import { useState } from "react"

import { move, RowActions } from "@/components/ordered-list"
import type { Option } from "@/components/picker"
import { ArtistPicker, ListItemPicker } from "@/components/pickers"
import { Button } from "@/components/ui/button"

export type CreditRow = { role: Option; artist: Option }

/** Credits as rows of role and artist, in display order. */
export function CreditsEditor({
  credits,
  onChange,
}: {
  credits: CreditRow[]
  onChange: (credits: CreditRow[]) => void
}) {
  const [role, setRole] = useState<Option | null>(null)
  const [artist, setArtist] = useState<Option | null>(null)
  const [adderKey, setAdderKey] = useState(0)

  return (
    <div className="flex flex-col gap-1">
      {credits.map((credit, index) => (
        <div
          key={`${credit.role.id}-${credit.artist.id}-${index}`}
          className="flex items-center gap-2 border px-2 py-1 text-xs"
        >
          <span className="flex-1">
            <span className="text-muted-foreground">{credit.role.name}</span> –{" "}
            {credit.artist.name}
          </span>
          <RowActions
            label={`${credit.role.name} ${credit.artist.name}`}
            index={index}
            count={credits.length}
            onMove={(by) => onChange(move(credits, index, by))}
            onRemove={() => onChange(credits.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      <div key={adderKey} className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <ListItemPicker
          kind="credit_roles"
          value={role}
          onChange={setRole}
          placeholder="Role"
        />
        <ArtistPicker
          value={artist}
          onChange={setArtist}
          placeholder="Artist"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!role || !artist}
          onClick={() => {
            onChange([...credits, { role: role!, artist: artist! }])
            setRole(null)
            setArtist(null)
            setAdderKey((key) => key + 1)
          }}
        >
          Add credit
        </Button>
      </div>
    </div>
  )
}
