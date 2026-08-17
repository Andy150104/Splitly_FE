import { failure, ok } from "@/app/api/_shared/response";
import { api } from "@/lib/api/server/api";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    if (!body.email?.trim()) {
      return failure(new Error("Email không được để trống."));
    }

    await api.auth.sendLoginCode({ email: body.email.trim().toLowerCase() });
    return ok(true);
  } catch (error) {
    return failure(error);
  }
}
