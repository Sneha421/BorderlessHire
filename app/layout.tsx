import type { Metadata } from "next";
import Script from "next/script";

import { TopNav } from "@/components/shared/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "borderlessHire",
  description: "Sponsor-friendly job discovery and interview prep for international students in Singapore."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-[family:var(--font-display)] antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              const stored = window.localStorage.getItem("borderlesshire-theme");
              const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              const theme = stored || (prefersDark ? "dark" : "light");
              document.documentElement.classList.toggle("dark", theme === "dark");
            })();
          `}
        </Script>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
