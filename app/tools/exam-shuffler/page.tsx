"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function ExamShufflerPage() {
  return <ToolFormLayout config={getToolConfig("/tools/exam-shuffler")!} />;
}
