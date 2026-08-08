import { z } from "zod";

import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  totalAmount: z.number().positive(),
  currency: z.string().trim().length(3).default("VND"),
  groupId: z.string().uuid().nullable().optional(),
  billDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const owed = url.searchParams.get("owed") === "true";
    const pageNumber = Number(url.searchParams.get("page") || 1);
    return ok(await api.bills.getAll({ owed, pageNumber, pageSize: 20 }));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await api.bills.create(createSchema.parse(await request.json())), 201);
  } catch (error) {
    return failure(error);
  }
}
