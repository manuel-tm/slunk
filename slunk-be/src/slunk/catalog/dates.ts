export type DatePrecision = "year" | "month" | "day"

/**
 * Parses a release date as the user types it: `2006`, `2006-01` or
 * `2006-01-10`. Unknown parts become the first one, at midnight UTC
 * (design §4.3 Dates).
 */
export function parseReleaseDate(text: string): {
  releaseDate: number
  releaseDatePrecision: DatePrecision
} {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(text.trim())
  if (!match) {
    throw new Error(
      `Not a date: ${text}. Write it as 2006, 2006-01 or 2006-01-10.`
    )
  }
  const [, year, month, day] = match
  const time = Date.UTC(Number(year), Number(month ?? 1) - 1, Number(day ?? 1))
  if (
    formatReleaseDate(time / 1000, "day") !==
    `${year}-${month ?? "01"}-${day ?? "01"}`
  ) {
    throw new Error(`There's no such date: ${text}`)
  }
  return {
    releaseDate: time / 1000,
    releaseDatePrecision: day ? "day" : month ? "month" : "year",
  }
}

/** A release date with only its known parts: `2006`, `2006-01` or `2006-01-10`. */
export function formatReleaseDate(
  epoch: number,
  precision: DatePrecision
): string {
  const iso = new Date(epoch * 1000).toISOString()
  return iso.slice(0, { year: 4, month: 7, day: 10 }[precision])
}
