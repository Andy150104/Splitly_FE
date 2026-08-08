"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { clientEnv } from "@/lib/env/client";
import { bffFetch } from "@/lib/http/browser-http-client";
import { devLoginSchema, type DevLoginValues } from "@/features/auth/schemas/login.schema";

export function LoginPanel() {
  const router = useRouter();
  const [googlePending, setGooglePending] = useState(false);
  const form = useForm<DevLoginValues>({ resolver: zodResolver(devLoginSchema), defaultValues: { email: "admin@example.com" } });
  const finish = () => { toast.success("Đăng nhập thành công"); router.replace("/dashboard"); router.refresh(); };

  const googleEnabled = Boolean(clientEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  return (
    <Card className="w-full max-w-md border-white/70 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-7">
          <div className="mb-5 grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div>
          <h1 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Đăng nhập để theo dõi hóa đơn, số tiền còn thiếu và các khoản đã nhận.</p>
        </div>

        {googleEnabled ? (
          <div className={googlePending ? "pointer-events-none opacity-60" : ""}>
            <GoogleLogin
              width="350"
              shape="pill"
              text="continue_with"
              onSuccess={async (response) => {
                if (!response.credential) return;
                setGooglePending(true);
                try { await bffFetch("/api/auth/google", { method: "POST", body: JSON.stringify({ idToken: response.credential }) }); finish(); }
                catch (error) { toast.error(error instanceof Error ? error.message : "Không thể đăng nhập bằng Google."); }
                finally { setGooglePending(false); }
              }}
              onError={() => { toast.error("Google Sign-In không thể khởi tạo."); }}
            />
          </div>
        ) : (
          <div className="flex gap-3 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /><p>Chưa cấu hình <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>. Thêm biến môi trường để bật Google Sign-In.</p>
          </div>
        )}

        {clientEnv.NEXT_PUBLIC_ENABLE_DEV_LOGIN ? (
          <>
            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground"><span className="h-px flex-1 bg-border" />Chỉ development<span className="h-px flex-1 bg-border" /></div>
            <form onSubmit={form.handleSubmit(async (values) => {
              try { await bffFetch("/api/auth/dev-login", { method: "POST", body: JSON.stringify(values) }); finish(); }
              catch (error) { toast.error(error instanceof Error ? error.message : "Đăng nhập thất bại."); }
            })} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="email">Email seed</Label><Input id="email" type="email" autoComplete="email" {...form.register("email")} />{form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}</div>
              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}Vào ứng dụng</Button>
            </form>
          </>
        ) : null}
        <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">Token Google chỉ được gửi đến BFF và backend để xác minh. Access/refresh token không được lưu trong browser storage.</p>
      </CardContent>
    </Card>
  );
}
