import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export default async function LegacyBulkStudentCommentsPage() {
  const user = await requireUser();
  if (await getMaintenanceBlockForUser(user)) redirect("/maintenance");
  redirect("/tools");
}
