/** Shared query keys are safe to import from both Server and Client Components. */
export const billKeys = {
  all: ["bills"] as const,
  list: (owed: boolean) => ["bills", "list", { owed }] as const,
};
