"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, CheckCircle2, CircleAlert, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { devLoginSchema, type DevLoginValues } from "@/features/auth/schemas/login.schema";
import { clientEnv } from "@/lib/env/client";
import { bffFetch } from "@/lib/http/browser-http-client";

const otpLoginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ."),
  code: z.string().trim().min(4, "Mã xác nhận gồm 10 ký tự (ví dụ: SL-82A9-K4M7)."),
});

type OtpLoginValues = z.infer<typeof otpLoginSchema>;

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [loginMethod, setLoginMethod] = useState<"google" | "otp" | "dev">(() => {
    if (prefilledEmail && !clientEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return "otp";
    return "google";
  });
  const [googlePending, setGooglePending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const devForm = useForm<DevLoginValues>({
    resolver: zodResolver(devLoginSchema),
    defaultValues: { email: prefilledEmail || "admin@example.com" },
  });

  const otpForm = useForm<OtpLoginValues>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: { email: prefilledEmail, code: "" },
  });

  useEffect(() => {
    if (prefilledEmail) {
      devForm.setValue("email", prefilledEmail);
      otpForm.setValue("email", prefilledEmail);
    }
  }, [prefilledEmail, devForm, otpForm]);

  const finish = () => {
    toast.success("Đăng nhập thành công!");
    router.replace(redirectTo as Parameters<typeof router.replace>[0]);
    router.refresh();
  };

  const handleSendOtpCode = async () => {
    const email = otpForm.getValues("email");
    if (!email || !email.includes("@")) {
      otpForm.setError("email", { message: "Vui lòng nhập Email hợp lệ để nhận mã." });
      return;
    }

    setSendingCode(true);
    try {
      await bffFetch("/api/auth/send-login-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setOtpSent(true);
      toast.success("Mã xác nhận 10 ký tự đã được gửi đến hòm thư email của bạn (hạn 15 phút).");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể gửi mã xác nhận.",
      );
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyOtpCode = async (values: OtpLoginValues) => {
    try {
      await bffFetch("/api/auth/verify-login-code", {
        method: "POST",
        body: JSON.stringify(values),
      });
      finish();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Xác thực mã đăng nhập thất bại.",
      );
    }
  };

  const googleEnabled = Boolean(clientEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  return (
    <Card className="w-full max-w-md border-white/70 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6">
          <div className="bg-primary text-primary-foreground mb-4 grid size-11 place-items-center rounded-2xl">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Đăng nhập để theo dõi hóa đơn, số tiền còn thiếu và nhận tiền tự động.
          </p>
        </div>

        {/* Method Selector Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl bg-muted/60 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLoginMethod("google")}
            className={`rounded-lg py-2 transition-all ${
              loginMethod === "google"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Google Sign-In
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("otp")}
            className={`rounded-lg py-2 transition-all ${
              loginMethod === "otp"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mã OTP Email
          </button>
        </div>

        {loginMethod === "google" ? (
          <div>
            {googleEnabled ? (
              <div className={googlePending ? "pointer-events-none opacity-60" : ""}>
                <GoogleLogin
                  width="350"
                  shape="pill"
                  text="continue_with"
                  onSuccess={async (response) => {
                    if (!response.credential) return;
                    setGooglePending(true);
                    try {
                      await bffFetch("/api/auth/google", {
                        method: "POST",
                        body: JSON.stringify({ idToken: response.credential }),
                      });
                      finish();
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Không thể đăng nhập bằng Google.",
                      );
                    } finally {
                      setGooglePending(false);
                    }
                  }}
                  onError={() => {
                    toast.error("Google Sign-In không thể khởi tạo.");
                  }}
                />
              </div>
            ) : (
              <div className="flex gap-3 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <p>
                  Chưa cấu hình <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>. Chọn tab Đăng nhập bằng OTP Email.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {loginMethod === "otp" ? (
          <form
            onSubmit={otpForm.handleSubmit(handleVerifyOtpCode)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="otp-email">Địa chỉ Email</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="user@example.com"
                  className="pl-10"
                  {...otpForm.register("email")}
                />
              </div>
              {otpForm.formState.errors.email ? (
                <p className="text-destructive text-xs">
                  {otpForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            {!otpSent ? (
              <Button
                type="button"
                className="w-full"
                onClick={handleSendOtpCode}
                isLoading={sendingCode}
                loadingText="Đang gửi mã…"
              >
                <KeyRound className="size-4" />
                Gửi mã xác nhận qua Email
              </Button>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Đã gửi mã xác nhận 10 ký tự đến email. Hạn dùng 15 phút.</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp-code">Mã OTP Xác Nhận</Label>
                  <Input
                    id="otp-code"
                    placeholder="Ví dụ: SL-82A9-K4M7"
                    className="font-mono uppercase tracking-widest text-center text-base"
                    {...otpForm.register("code")}
                  />
                  {otpForm.formState.errors.code ? (
                    <p className="text-destructive text-xs">
                      {otpForm.formState.errors.code.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={handleSendOtpCode}
                    isLoading={sendingCode}
                  >
                    Gửi lại mã
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={otpForm.formState.isSubmitting}
                    loadingText="Đang xác thực…"
                  >
                    Đăng nhập
                  </Button>
                </div>
              </>
            )}
          </form>
        ) : null}

        {clientEnv.NEXT_PUBLIC_ENABLE_DEV_LOGIN ? (
          <>
            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              Chỉ Development
              <span className="h-px flex-1 bg-border" />
            </div>
            <form
              onSubmit={devForm.handleSubmit(async (values) => {
                try {
                  await bffFetch("/api/auth/dev-login", {
                    method: "POST",
                    body: JSON.stringify(values),
                  });
                  finish();
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Đăng nhập thất bại.",
                  );
                }
              })}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email seed</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...devForm.register("email")}
                />
              </div>
              <Button
                className="w-full"
                type="submit"
                isLoading={devForm.formState.isSubmitting}
                loadingText="Đang đăng nhập…"
              >
                <ArrowRight className="size-4" />
                Vào ứng dụng
              </Button>
            </form>
          </>
        ) : null}

        <p className="text-muted-foreground mt-6 text-center text-xs leading-5">
          Tài khoản Google & OTP Email cùng địa chỉ sẽ tự động đồng bộ 100% dữ liệu lịch sử hóa đơn.
        </p>
      </CardContent>
    </Card>
  );
}
