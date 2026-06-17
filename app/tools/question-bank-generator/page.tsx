"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function QuestionBankGeneratorPage() {
  return <ToolFormLayout config={getToolConfig("/tools/question-bank-generator")!} />;
}
