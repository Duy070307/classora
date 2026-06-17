"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function DifferentiatedExercisesPage() {
  return <ToolFormLayout config={getToolConfig("/tools/differentiated-exercises")!} />;
}
