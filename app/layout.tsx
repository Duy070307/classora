import type { Metadata } from "next";
import "./globals.css";
import { UsageLimitNotice } from "@/components/UsageLimitNotice";
import { CommandPalette } from "@/components/CommandPalette";

const title = "Soạn Lab - Bộ công cụ hỗ trợ giáo viên Việt Nam";
const description =
  "Soạn Lab hỗ trợ giáo viên soạn đề kiểm tra, tạo phiếu học tập, giáo án, nhận xét học sinh và xuất Word/PDF nhanh hơn.";
const ogImage = "/og-image.png";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "Soạn Lab",
  manifest: "/manifest.json",
  keywords: [
    "Soạn Lab",
    "công cụ giáo viên",
    "soạn đề kiểm tra",
    "tạo phiếu học tập",
    "giáo án",
    "nhận xét học sinh",
    "xuất Word",
    "xuất PDF",
    "giáo viên Việt Nam",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
      { url: "/apple-touch-icon.svg", type: "image/svg+xml" },
    ],
  },
  title: {
    default: title,
    template: "%s | Soạn Lab",
  },
  description,
  openGraph: {
    title,
    description,
    siteName: "Soạn Lab",
    type: "website",
    locale: "vi_VN",
    images: [{ url: ogImage, alt: "Soạn Lab" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
  other: { "theme-color": "#2563eb" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}<CommandPalette /><UsageLimitNotice /></body>
    </html>
  );
}
