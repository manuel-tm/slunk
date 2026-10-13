import { useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

/** Something a picker offers: an id, and what it shows. */
export type Option = { id: string; name: string }

const CREATE = "__create__"

export type PickerProps = {
  value: Option | null
  onChange: (option: Option | null) => void
  /** Ids to leave out, like those already in a list */
  exclude?: string[]
  placeholder?: string
  id?: string
  disabled?: boolean
}

/**
 * A combobox whose options come from the backend as the user types (design
 * §7.2). With `onCreate`, it also offers to create what was typed.
 */
export function Picker({
  value,
  onChange,
  exclude = [],
  placeholder,
  id,
  disabled,
  options,
  onQuery,
  query,
  noun,
  onCreate,
}: PickerProps & {
  options: Option[]
  query: string
  onQuery: (query: string) => void
  /** "artist", for "No artist found" and "Create artist …" */
  noun: string
  onCreate?: (name: string) => Promise<Option>
}) {
  const [creating, setCreating] = useState(false)
  const typed = query.trim()
  const items = options.filter((option) => !exclude.includes(option.id))
  const exact = options.some(
    (option) => option.name.toLowerCase() === typed.toLowerCase()
  )
  if (onCreate && typed && !exact) {
    items.push({ id: CREATE, name: `Create ${noun} "${typed}"` })
  }

  return (
    <Combobox<Option>
      items={items}
      filter={null}
      value={value}
      disabled={disabled || creating}
      itemToStringLabel={(option) => option.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      onInputValueChange={onQuery}
      onValueChange={async (option) => {
        if (option?.id !== CREATE) {
          onChange(option)
          return
        }
        setCreating(true)
        try {
          onChange(await onCreate!(typed))
        } finally {
          setCreating(false)
        }
      }}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder ?? `Search ${noun}s`}
        showClear={value !== null}
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>No {noun} found</ComboboxEmpty>
        <ComboboxList>
          {(option: Option) => (
            <ComboboxItem key={option.id} value={option}>
              {option.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
