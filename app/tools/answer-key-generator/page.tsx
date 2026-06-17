"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function AnswerKeyGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/answer-key-generator")!} />;
}
