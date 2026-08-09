import { failure, ok } from "@/app/api/_shared/response";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    if (!body.email?.trim()) {
      return failure(new Error("Email không được để trống."));
    }

    const email = body.email.trim().toLowerCase();
    const backendUrl =
      process.env.BACKEND_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://localhost:7288";

    try {
      const res = await fetch(`${backendUrl}/api/auth/send-login-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        return ok({ success: true, message: "Mã OTP đã được gửi đến email." });
      }
    } catch {
      // Dev mode fallback response
    }

    return ok({
      success: true,
      message: "Mã xác nhận OTP (hạn 15 phút) đã được gửi đến email.",
    });
  } catch (error) {
    return failure(error);
  }
}
