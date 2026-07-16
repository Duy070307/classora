import { redirect } from "next/navigation";
import { AnswerSheetWorkspace } from "@/components/answer-sheet/AnswerSheetWorkspace";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export default async function AnswerSheetPage() {
  const user = await requireUser();
  if (await getMaintenanceBlockForUser(user)) redirect("/maintenance");
  return <AnswerSheetWorkspace/>;
}
