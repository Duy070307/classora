import type { Metadata } from "next";
import "./globals.css";
import { UsageLimitNotice } from "@/components/UsageLimitNotice";
import { CommandPalette } from "@/components/CommandPalette";
import { BetaNoticeModal } from "@/components/BetaNoticeModal";
import { getSiteUrl } from "@/lib/site-url";

const title = "SOẠN LAB – Bộ công cụ AI hỗ trợ giáo viên";
const description =
  "Tạo đề kiểm tra, giáo án, phiếu học tập, ma trận, lời giải và hình TikZ; rà soát, chỉnh sửa và xuất Word/PDF.";
const ogImage = "/og-image.png";
const iconVersion = "soanlab-transparent-20260705";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "SOẠN LAB",
  manifest: `/manifest.json?v=${iconVersion}`,
  keywords: [
    "Soạn Lab",
    "công cụ giáo viên",
    "soạn đề kiểm tra",
    "tạo phiếu học tập",
    "giáo án",
    "ngân hàng câu hỏi",
    "xuất Word",
    "xuất PDF",
    "giáo viên Việt Nam",
  ],
  icons: {
    icon: [
      { url: `/favicon.ico?v=${iconVersion}`, sizes: "any" },
      { url: `/icon.png?v=${iconVersion}`, type: "image/png", sizes: "512x512" },
      { url: `/icon.svg?v=${iconVersion}`, type: "image/svg+xml" },
    ],
    shortcut: [{ url: `/favicon.ico?v=${iconVersion}` }],
    apple: [
      { url: `/apple-icon.png?v=${iconVersion}`, type: "image/png", sizes: "180x180" },
      { url: `/apple-touch-icon.svg?v=${iconVersion}`, type: "image/svg+xml" },
    ],
  },
  title: {
    default: title,
    template: "%s | SOẠN LAB",
  },
  description,
  openGraph: {
    title,
    description,
    siteName: "SOẠN LAB",
    type: "website",
    locale: "vi_VN",
    images: [{ url: ogImage, alt: "SOẠN LAB — Bộ công cụ hỗ trợ giáo viên Việt Nam" }],
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
      <body>{children}<CommandPalette /><UsageLimitNotice /><BetaNoticeModal /></body>
    </html>
  );
}
