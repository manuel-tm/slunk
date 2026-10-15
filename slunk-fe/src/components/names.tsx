import { Fragment } from "react"
import { Link } from "react-router"

/**
 * Names that link to their pages, joined with commas: "A", "A, B", "A, B, C"
 * (2_credits.md §7). An "&" is only ever part of a name.
 */
export function Names({
  items,
  to,
}: {
  items: { id: string; name: string }[]
  to: (id: string) => string
}) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 && ", "}
          <Link to={to(item.id)} className="hover:underline">
            {item.name}
          </Link>
        </Fragment>
      ))}
    </>
  )
}

export const artistUrl = (id: string) => `/artists/${id}`
export const labelUrl = (id: string) => `/labels/${id}`
