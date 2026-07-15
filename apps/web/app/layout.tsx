import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { RudderStackProvider } from "@/components/RudderStackProvider";
import { CartProvider } from "@/lib/cart/CartContext";
import { CouponProvider } from "@/lib/coupon/CouponContext";
import { WishlistProvider } from "@/lib/wishlist/WishlistContext";
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

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Velora — Shop Bold. Live Curated.",
  description: "Discover hand-picked finds at Velora — where every product has personality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <RudderStackProvider>
          <CartProvider>
            <CouponProvider>
              <WishlistProvider>
                <Header />
                {children}
                <Footer />
              </WishlistProvider>
            </CouponProvider>
          </CartProvider>
        </RudderStackProvider>
      </body>
    </html>
  );
}
