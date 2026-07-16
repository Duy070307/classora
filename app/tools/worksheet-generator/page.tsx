import { redirect } from "next/navigation";
import { WorksheetWorkspace } from "@/components/worksheet/WorksheetWorkspace";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export default async function WorksheetGeneratorPage(){const user=await requireUser();if(await getMaintenanceBlockForUser(user))redirect("/maintenance");return <WorksheetWorkspace/>;}
