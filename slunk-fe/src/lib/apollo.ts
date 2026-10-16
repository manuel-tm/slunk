import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"

/**
 * Lists the API always returns whole. A new one replaces the cached one,
 * which Apollo does anyway, but would warn about when the list got shorter.
 */
function replaced(...fields: string[]) {
  return {
    fields: Object.fromEntries(
      fields.map((field) => [field, { merge: false }])
    ),
  }
}

/** The backend's GraphQL API. In development, Vite proxies /graphql to it. */
export const apollo = new ApolloClient({
  link: new HttpLink({ uri: "/graphql" }),
  cache: new InMemoryCache({
    typePolicies: {
      Release: replaced(
        "artists",
        "labels",
        "formats",
        "media",
        "tracks",
        "discTitles",
        "credits",
        "files",
        "tags"
      ),
      Track: replaced("artists", "features", "performers", "credits", "files"),
      Artist: replaced(
        "alternateNames",
        "files",
        "appearances",
        "credits",
        "formatCounts"
      ),
      Label: replaced("alternateNames"),
    },
  }),
  // A page shows what's cached at once, and asks the backend again, so it
  // never shows a list from before a change
  defaultOptions: { watchQuery: { fetchPolicy: "cache-and-network" } },
})
