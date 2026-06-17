"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function QuestionVariantGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/question-variant-generator")!} />;
}
