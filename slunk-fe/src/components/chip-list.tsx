import { XIcon } from "lucide-react"
import { type ReactNode, useState } from "react"

import type { Option, PickerProps } from "@/components/picker"
import { Badge } from "@/components/ui/badge"

/**
 * A compact list for table rows: chips in order, each removable, and a
 * picker that adds one at the end.
 */
export function ChipList({
  items,
  onChange,
  picker,
  disabled,
}: {
  items: Option[]
  onChange: (items: Option[]) => void
  picker: (props: PickerProps) => ReactNode
  disabled?: boolean
}) {
  const [pickerKey, setPickerKey] = useState(0)
  return (
    <div className="flex min-w-40 flex-col gap-1">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {items.map((item) => (
            <Badge key={item.id} variant="secondary" className="gap-1">
              {item.name}
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  className="hover:text-foreground"
                  onClick={() =>
                    onChange(items.filter((i) => i.id !== item.id))
                  }
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      {!disabled && (
        <div key={pickerKey}>
          {picker({
            value: null,
            exclude: items.map((item) => item.id),
            placeholder: "Add",
            onChange: (option) => {
              if (!option) return
              onChange([...items, option])
              setPickerKey((key) => key + 1)
            },
          })}
        </div>
      )}
    </div>
  )
}
