import type { Metadata } from "next";
import "./globals.css";
import { UsageLimitNotice } from "@/components/UsageLimitNotice";
import { CommandPalette } from "@/components/CommandPalette";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "Classora",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.svg"
  },
  title: {
    default: "Classora - Bộ công cụ AI cho giáo viên Việt Nam",
    template: "%s | Classora"
  },
  description: "Classora giúp giáo viên soạn đề, tạo phiếu học tập, viết nhận xét học sinh, tạo ma trận đề và xuất Word nhanh hơn.",
  openGraph: {
    title: "Classora - Bộ công cụ AI cho giáo viên Việt Nam",
    description: "Classora giúp giáo viên soạn đề, tạo phiếu học tập, viết nhận xét học sinh, tạo ma trận đề và xuất Word nhanh hơn.",
    siteName: "Classora",
    type: "website",
    locale: "vi_VN"
  },
  twitter: {
    card: "summary",
    title: "Classora - Bộ công cụ AI cho giáo viên Việt Nam",
    description: "Classora giúp giáo viên soạn đề, tạo phiếu học tập, viết nhận xét học sinh, tạo ma trận đề và xuất Word nhanh hơn."
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
