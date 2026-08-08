import { z } from "zod";

export const devLoginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
});
export type DevLoginValues = z.infer<typeof devLoginSchema>;
