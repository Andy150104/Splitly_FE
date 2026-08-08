import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

export const metadata: Metadata = {
  title: { default: "Splitly", template: "%s · Splitly" },
  description: "Chia hóa đơn, theo dõi thanh toán và nhắc tiền gọn gàng.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
