import type { Metadata } from "next";
import "./globals.css";
import { UsageLimitNotice } from "@/components/UsageLimitNotice";
import { CommandPalette } from "@/components/CommandPalette";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "Soạn Lab",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/brand/soan-lab-mark.png", type: "image/png" }],
    apple: [{ url: "/brand/soan-lab-mark.png", type: "image/png" }]
  },
  title: {
    default: "Soạn Lab - Công cụ hỗ trợ giáo viên tạo tài liệu",
    template: "%s | Soạn Lab"
  },
  description: "Soạn Lab hỗ trợ giáo viên tạo bản nháp đề kiểm tra, phiếu học tập, giáo án, nhận xét học sinh và xuất Word/PDF.",
  openGraph: {
    title: "Soạn Lab - Công cụ hỗ trợ giáo viên tạo tài liệu",
    description: "Tạo bản nháp tài liệu dạy học, rà soát và xuất Word/PDF với Soạn Lab.",
    siteName: "Soạn Lab",
    type: "website",
    locale: "vi_VN"
  },
  twitter: {
    card: "summary",
    title: "Soạn Lab - Công cụ hỗ trợ giáo viên tạo tài liệu",
    description: "Tạo bản nháp tài liệu dạy học, rà soát và xuất Word/PDF với Soạn Lab."
  },
  other: { "theme-color": "#2563eb" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}<CommandPalette /><UsageLimitNotice /></body>
    </html>
  );
}
