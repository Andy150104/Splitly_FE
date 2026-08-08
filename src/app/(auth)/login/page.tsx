import { WalletCards } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginPanel } from "@/features/auth/components/login-panel";
import { getCurrentUser, getSessionTokens } from "@/lib/auth/session";

export const metadata = { title: "Đăng nhập" };

export default async function LoginPage() {
  const [user, tokens] = await Promise.all([getCurrentUser(), getSessionTokens()]);
  if (user && tokens.accessToken) redirect("/dashboard");
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#102a56] p-12 text-white lg:flex">
        <div className="absolute -right-36 -top-36 size-[32rem] rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-48 -left-32 size-[34rem] rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex items-center gap-2 text-lg font-bold"><span className="grid size-10 place-items-center rounded-xl bg-white/12"><WalletCards className="size-5" /></span>Splitly</div>
        <div className="relative max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">Chia rõ ràng · Trả đúng hạn</p><h2 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight">Tiền chung nhẹ đầu hơn khi mọi thứ đều minh bạch.</h2><p className="mt-6 max-w-lg text-lg leading-8 text-blue-100/75">Tạo hóa đơn, chia đều hoặc tùy chỉnh, mời bạn bè và biết chính xác ai đã thanh toán.</p></div>
        <p className="relative text-sm text-blue-100/60">Bảo mật bằng Google Identity và phiên HttpOnly.</p>
      </section>
      <section className="relative flex items-center justify-center p-5 sm:p-10">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_80%_20%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_32%)]" />
        <div className="relative z-10 w-full"><div className="mb-8 flex items-center justify-center gap-2 font-bold lg:hidden"><WalletCards className="size-5 text-primary" />Splitly</div><LoginPanel /></div>
      </section>
    </main>
  );
}
