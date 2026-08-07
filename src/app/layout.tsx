import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Car } from "lucide-react";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VIN Decoder — specs, recalls & window stickers",
    template: "%s | VIN Decoder",
  },
  description:
    "Free VIN decoder for US-market vehicles: full specs, recalls, complaints, crash-test ratings, EPA fuel economy, and original window stickers where available.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="print-hidden border-b">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Car className="size-5" />
                VIN Decoder
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  href="/codes"
                  className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  Option codes
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="print-hidden border-t">
            <div className="text-muted-foreground mx-auto w-full max-w-5xl px-4 py-6 text-xs leading-relaxed">
              Vehicle data from NHTSA (vPIC, recalls, complaints, NCAP) and the EPA
              (fueleconomy.gov). Window stickers come from manufacturer systems and are
              only available for some brands. This is a personal, non-commercial tool —
              data may be incomplete; verify anything important with official sources.
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
