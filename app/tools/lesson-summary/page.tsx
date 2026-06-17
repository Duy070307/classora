"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function LessonSummaryPage() {
  return <ToolFormLayout config={getToolConfig("/tools/lesson-summary")!} />;
}
