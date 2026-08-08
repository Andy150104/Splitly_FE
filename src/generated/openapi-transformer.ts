import { defineTransformer } from "orval";

function normalizedName(name: string) {
  if (/^[a-zA-Z0-9.\-_]+$/.test(name)) return name;
  if (name.includes("System.Boolean")) return "ApiResponseBoolean";

  const feature = name.match(/Features\.([^.]+)\.([^.]+)\./)?.[2];
  const isPagedResult = name.includes("Application.Models.PagedResult");

  if (feature && name.includes("Api.Responses.ApiResponse")) {
    return isPagedResult
      ? `ApiResponsePaged${feature}`
      : `ApiResponse${feature}`;
  }

  if (feature && isPagedResult) return `PagedResult${feature}`;

  return name.replace(/[^a-zA-Z0-9.\-_]+/g, "_");
}

export default defineTransformer((document) => {
  const schemas = document.components?.schemas;
  if (!schemas) return document;

  const names = new Map(
    Object.keys(schemas).map((name) => [name, normalizedName(name)]),
  );

  const rewritten = JSON.parse(
    JSON.stringify(document, (_key, value: unknown) => {
      if (typeof value !== "string") return value;
      const prefix = "#/components/schemas/";
      if (!value.startsWith(prefix)) return value;
      const current = value.slice(prefix.length);
      return `${prefix}${names.get(current) ?? current}`;
    }),
  ) as typeof document;

  rewritten.components!.schemas = Object.fromEntries(
    Object.entries(rewritten.components!.schemas!).map(([name, schema]) => [
      names.get(name) ?? name,
      schema,
    ]),
  );

  return rewritten;
});
