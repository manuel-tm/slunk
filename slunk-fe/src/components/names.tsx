import { Fragment } from "react"
import { Link } from "react-router"

/**
 * Names that link to their pages, joined as in a credit line: "A", "A & B",
 * "A, B & C". `commas` joins them all with commas, as labels are.
 */
export function Names({
  items,
  to,
  commas = false,
}: {
  items: { id: string; name: string }[]
  to: (id: string) => string
  commas?: boolean
}) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 && (index === items.length - 1 && !commas ? " & " : ", ")}
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
