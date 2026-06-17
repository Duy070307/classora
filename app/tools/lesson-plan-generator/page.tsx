"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function LessonPlanGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/lesson-plan-generator")!} />;
}
