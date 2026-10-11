import type { CodegenConfig } from "@graphql-codegen/cli"

// Resolver types from the SDL: `npm run codegen` after changing a .graphql file
const config: CodegenConfig = {
  schema: "src/slunk_web/schema/*.graphql",
  generates: {
    "src/slunk_web/schema/resolvers_types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "./context.ts#Context",
        useTypeImports: true,
        enumsAsTypes: true,
      },
    },
  },
}

export default config
