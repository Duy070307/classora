import { redirect } from "next/navigation";
import { ExamBlueprintWorkspace } from "@/components/exam-blueprint/ExamBlueprintWorkspace";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export default async function ExamBlueprintPage() {
  const user = await requireUser();
  if (await getMaintenanceBlockForUser(user)) redirect("/maintenance");
  return <ExamBlueprintWorkspace/>;
}
