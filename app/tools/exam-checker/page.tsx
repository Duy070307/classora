"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function ExamCheckerPage() {
  return <ToolFormLayout config={getToolConfig("/tools/exam-checker")!} />;
}
