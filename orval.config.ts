import { defineConfig } from "orval";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const swaggerUrl =
  process.env.OPENAPI_URL ??
  "https://localhost:7288/swagger/v1/swagger.json";

export default defineConfig({
  billSplitApi: {
    input: {
      target: swaggerUrl,
      override: {
        // ASP.NET emits generic CLR names containing `[]`, `,` and backticks.
        // Those keys are not valid OpenAPI component identifiers, so normalize
        // them before Orval validation without changing the backend contract.
        transformer: "./src/generated/openapi-transformer.ts",
      },
    },
    output: {
      target: "./src/generated/api/endpoints.ts",
      schemas: "./src/generated/api/models",
      client: "axios",
      mode: "single",
      clean: true,
      override: {
        mutator: {
          path: "./src/lib/http/orval-mutator.ts",
          name: "orvalMutator",
        },
      },
    },
  },
});
