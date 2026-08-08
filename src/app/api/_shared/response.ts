import { NextResponse } from "next/server";

import { normalizeApiError } from "@/lib/errors/api-error";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function failure(error: unknown) {
  const normalized = normalizeApiError(error);
  return NextResponse.json(
    { message: normalized.message, errors: normalized.errors },
    { status: normalized.status },
  );
}
