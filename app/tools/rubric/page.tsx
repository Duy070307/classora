import { redirect } from "next/navigation";
import { RubricWorkspace } from "@/components/rubric/RubricWorkspace";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export default async function RubricPage() { const user = await requireUser(); if (await getMaintenanceBlockForUser(user)) redirect("/maintenance"); return <RubricWorkspace/>; }
