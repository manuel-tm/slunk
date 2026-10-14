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

export type PickerProps<T extends Option = Option> = {
  value: T | null
  onChange: (option: T | null) => void
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
export function Picker<T extends Option>({
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
  createLabel = (typed) => `Create ${noun} "${typed}"`,
}: PickerProps<T> & {
  options: T[]
  query: string
  onQuery: (query: string) => void
  /** "artist", for "No artist found" and "Create artist …" */
  noun: string
  /** Null when creating was cancelled */
  onCreate?: (name: string) => Promise<T | null>
  createLabel?: (typed: string) => string
}) {
  const [creating, setCreating] = useState(false)
  const typed = query.trim()
  const items = options.filter((option) => !exclude.includes(option.id))
  const exact = options.some(
    (option) => option.name.toLowerCase() === typed.toLowerCase()
  )
  if (onCreate && typed && !exact) {
    items.push({ id: CREATE, name: createLabel(typed) } as T)
  }

  return (
    <Combobox<T>
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
          const created = await onCreate!(typed)
          if (created) onChange(created)
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
          {(option: T) => (
            <ComboboxItem key={option.id} value={option}>
              {option.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
