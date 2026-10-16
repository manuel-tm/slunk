/**
 * A language tag as it's saved (3_alternate_names.md §4.2): BCP 47 in its
 * canonical form, so "JA-latn" becomes "ja-Latn", or null when it's blank.
 * Refuses a malformed tag, one whose language isn't 2 or 3 letters
 * ("japanese" is well formed, but isn't a language), and `und`, since an
 * unknown language is null.
 */
export function languageTag(text: string | null | undefined): string | null {
  const typed = text?.trim()
  if (!typed) return null
  let canonical: string
  try {
    canonical = Intl.getCanonicalLocales(typed)[0]
  } catch {
    throw new Error(`"${typed}" isn't a language tag, like en, ja or ja-Latn`)
  }
  const language = canonical.split("-")[0]
  if (language === "und") {
    throw new Error("Leave the language blank when it isn't known")
  }
  if (!/^[a-z]{2,3}$/.test(language)) {
    throw new Error(
      `"${typed}" isn't a language tag: it starts with a 2- or 3-letter code, like en or jpn`
    )
  }
  return canonical
}
