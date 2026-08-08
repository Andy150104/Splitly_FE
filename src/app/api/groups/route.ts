import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

const schema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).optional(),
});

export async function GET() {
  try {
    return ok(await api.groups.getAll({ pageNumber: 1, pageSize: 100 }));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await api.groups.create(schema.parse(await request.json())), 201);
  } catch (error) {
    return failure(error);
  }
}
