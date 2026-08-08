import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().default(""),
  NEXT_PUBLIC_ENABLE_DEV_LOGIN: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export const clientEnv = schema.parse({
  NEXT_PUBLIC_GOOGLE_CLIENT_ID:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_ENABLE_DEV_LOGIN:
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN,
});
