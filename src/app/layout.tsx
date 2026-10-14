import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SmartForm AI – Intelligent Form Assistant",
    template: "%s | SmartForm AI",
  },
  description:
    "SmartForm AI helps you understand, complete, and submit forms accurately using the power of Google Gemini AI.",
  keywords: ["form", "AI", "automation", "Gemini", "form assistant"],
  openGraph: {
    title: "SmartForm AI",
    description: "Complete forms intelligently with AI assistance",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
