const SIZE_UNITS = ["KB", "MB", "GB", "TB"]

/** A size in B, KB, MB or GB, in powers of 1000 as macOS shows them. */
export function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  let value = bytes
  let unit = -1
  while (value >= 1000 && unit < SIZE_UNITS.length - 1) {
    value /= 1000
    unit++
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${SIZE_UNITS[unit]}`
}

/** An instant, in epoch seconds, as a date and time in the viewer's zone. */
export function formatDateTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

/** An instant, in epoch seconds, as a date in the viewer's zone. */
export function formatDate(seconds: number): string {
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    dateStyle: "medium",
  })
}
