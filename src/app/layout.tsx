import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Lumen Studio: AI image generator",
  description: "Type an idea, get an image. No sign-up. An 8x challenge project inspired by Higgsfield.",
};

export const viewport: Viewport = { themeColor: "#0d0e11" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("dark h-full", inter.variable, sora.variable)}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
