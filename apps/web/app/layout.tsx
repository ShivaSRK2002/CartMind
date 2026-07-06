import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RudderStackProvider } from "@/components/RudderStackProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  title: "CartMind AI",
  description: "A behavioral-analytics eCommerce demo platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <RudderStackProvider>
          <Header />
          {children}
          <Footer />
        </RudderStackProvider>
      </body>
    </html>
  );
}
