import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Chia sẻ Soạn Lab" },
  description:
    "Chia sẻ Soạn Lab với đồng nghiệp để cùng khám phá công cụ tạo đề kiểm tra, phiếu học tập, nhận xét học sinh và xuất Word/PDF.",
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
