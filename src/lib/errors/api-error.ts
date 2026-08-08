import axios from "axios";

export interface ApiErrorShape {
  status: number;
  code?: string;
  message: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error implements ApiErrorShape {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(input: ApiErrorShape) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.errors = input.errors;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError({ status: 500, message: "Đã có lỗi không mong muốn." });
  }

  const body = error.response?.data as
    | {
        message?: string;
        errors?: Array<{ field?: string | null; message?: string | null }>;
      }
    | undefined;
  const errors = body?.errors?.reduce<Record<string, string[]>>((result, item) => {
    if (!item.message) return result;
    const field = item.field || "_form";
    result[field] = [...(result[field] ?? []), item.message];
    return result;
  }, {});

  return new ApiError({
    status: error.response?.status ?? 503,
    code: error.code,
    message:
      body?.message ??
      (error.response?.status === 401
        ? "Phiên đăng nhập đã hết hạn."
        : "Không thể kết nối tới dịch vụ. Vui lòng thử lại."),
    errors,
  });
}
