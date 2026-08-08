import { ApiError } from "@/lib/errors/api-error";

interface Envelope<T> {
  success?: boolean;
  message?: string | null;
  data?: T;
  errors?: Array<{
    code?: string | null;
    field?: string | null;
    message?: string | null;
  }> | null;
}

export function unwrap<T>(response: Envelope<T>): T {
  if (response.success !== false && response.data !== undefined) {
    return response.data;
  }

  throw new ApiError({
    status: 400,
    message: response.message || "Yêu cầu không thể hoàn tất.",
    errors: response.errors?.reduce<Record<string, string[]>>((result, error) => {
      if (!error.message) return result;
      const field = error.field || "_form";
      result[field] = [...(result[field] ?? []), error.message];
      return result;
    }, {}),
  });
}
