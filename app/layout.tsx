import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classora",
  description: "Soạn đề, tạo tài liệu, xuất Word trong vài phút."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
