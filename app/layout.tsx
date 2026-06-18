import type { Metadata } from "next";
import "./globals.css";
import { UsageLimitNotice } from "@/components/UsageLimitNotice";
import { CommandPalette } from "@/components/CommandPalette";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "Soạn Lab",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.svg"
  },
  title: {
    default: "Soạn Lab - Bộ công cụ AI cho giáo viên Việt Nam",
    template: "%s | Soạn Lab"
  },
  description: "Soạn Lab giúp giáo viên soạn đề, tạo phiếu học tập, viết nhận xét học sinh, tạo ma trận đề và xuất Word nhanh hơn.",
  openGraph: {
    title: "Soạn Lab - Bộ công cụ AI cho giáo viên Việt Nam",
    description: "Soạn Lab giúp giáo viên soạn đề, tạo phiếu học tập, viết nhận xét học sinh, tạo ma trận đề và xuất Word nhanh hơn.",
    siteName: "Soạn Lab",
    type: "website",
    locale: "vi_VN"
  },
  twitter: {
    card: "summary",
    title: "Soạn Lab - Bộ công cụ AI cho giáo viên Việt Nam",
    description: "Soạn Lab giúp giáo viên soạn đề, tạo phiếu học tập, viết nhận xét học sinh, tạo ma trận đề và xuất Word nhanh hơn."
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
