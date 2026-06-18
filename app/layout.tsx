import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { UsageLimitNotice } from "@/components/UsageLimitNotice";

export const metadata: Metadata = {
  title: "Classora",
  description: "Soạn đề, tạo tài liệu, xuất Word trong vài phút."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}<UsageLimitNotice /></body>
    </html>
  );
}
