import { redirect } from "next/navigation";
import { QuestionBankWorkspace } from "@/components/question-bank/QuestionBankWorkspace";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export default async function QuestionBankPage() {
  const user = await requireUser();
  if (await getMaintenanceBlockForUser(user)) redirect("/maintenance");
  return <QuestionBankWorkspace />;
}
