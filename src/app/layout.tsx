import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Skulena — Find the right school for your child", template: "%s | Skulena" },
  description: "Discover schools, compare published details and keep your shortlist together with Skulena.",
  openGraph: { title: "Skulena", description: "Discover schools and compare the details that matter.", type: "website" },
  robots: process.env.NEXT_PUBLIC_SUPABASE_URL ? { index: true, follow: true } : { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><a href="#main-content" className="skip-link">Skip to content</a>{children}</body></html>;
}
