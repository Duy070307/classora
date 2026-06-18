import type { Metadata } from "next";
import "./globals.css";
import { UsageLimitNotice } from "@/components/UsageLimitNotice";

export const metadata: Metadata = {
  metadataBase: new URL("https://classora.local"),
  title: {
    default: "Classora - Bộ công cụ AI cho giáo viên Việt Nam",
    template: "%s | Classora"
  },
  description: "Classora giúp giáo viên soạn đề, tạo phiếu học tập, viết nhận xét học sinh, tạo ma trận đề và xuất Word nhanh hơn.",
  openGraph: {
    title: "Classora - Bộ công cụ AI cho giáo viên Việt Nam",
    description: "Soạn đề, tạo tài liệu và xuất Word nhanh hơn với các workflow dành cho giáo viên Việt Nam.",
    type: "website",
    locale: "vi_VN"
  },
  twitter: {
    card: "summary",
    title: "Classora - Bộ công cụ AI cho giáo viên Việt Nam",
    description: "Soạn đề, tạo phiếu học tập, viết nhận xét và xuất Word nhanh hơn."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}<UsageLimitNotice /></body>
    </html>
  );
}
