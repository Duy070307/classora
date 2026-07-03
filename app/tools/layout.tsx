import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Công cụ - Soạn Lab" },
  description:
    "Khám phá các công cụ hỗ trợ giáo viên soạn đề, tạo tài liệu, nhận xét học sinh và quản lý tài liệu.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
