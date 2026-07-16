import { redirect } from "next/navigation";
import { GradingAssistantWorkspace } from "@/components/grading/GradingAssistantWorkspace";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export default async function GradingAssistantPage() {
  const user = await requireUser();
  if (await getMaintenanceBlockForUser(user)) redirect("/maintenance");
  return <GradingAssistantWorkspace />;
}
