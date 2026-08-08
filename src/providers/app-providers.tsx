"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { clientEnv } from "@/lib/env/client";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  const content = clientEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={clientEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>
  ) : children;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
