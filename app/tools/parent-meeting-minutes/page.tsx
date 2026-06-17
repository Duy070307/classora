"use client";

import { ToolFormLayout } from "@/components/ToolFormLayout";
import { getToolConfig } from "@/lib/tool-configs";

export default function ParentMeetingMinutesPage() {
  return <ToolFormLayout config={getToolConfig("/tools/parent-meeting-minutes")!} />;
}
