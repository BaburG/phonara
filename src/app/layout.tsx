import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phonara - Medical Translation App",
  description: "A medical translation application for healthcare environments",
  keywords: ["medical translation", "healthcare translation", "doctor patient communication"],
  authors: [{ name: "Phonara Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <main className="min-h-screen bg-background">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
