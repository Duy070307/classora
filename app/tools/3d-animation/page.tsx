import { AppShell } from "@/components/AppShell";
import { ToolPageHeader } from "@/components/tools/ToolPageHeader";
import { ThreeDAnimationTool } from "@/components/tools/ThreeDAnimationTool";

export default function ThreeDAnimationPage() {
  return (
    <AppShell title="Tạo mô phỏng 3D">
      <ToolPageHeader
        title="Tạo mô phỏng 3D"
        description="Tạo mô phỏng chuyển động 3D đơn giản để minh họa bài học."
        category="Công cụ trực quan"
        iconName="visual"
        exportable={false}
      />
      <ThreeDAnimationTool />
    </AppShell>
  );
}
