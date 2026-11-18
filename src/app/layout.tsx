import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR, Silkscreen } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sans = Noto_Sans_KR({ variable: "--font-sans", preload: false });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const pixel = Silkscreen({ variable: "--font-pixel", weight: ["400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BRDCST",
  description: "PC 화면과 휴대폰 카메라로 바로 송출하고 시청하는 실시간 방송",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`dark ${sans.variable} ${mono.variable} ${pixel.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
