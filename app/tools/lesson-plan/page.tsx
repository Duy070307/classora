import { redirect } from "next/navigation";
import { LessonPlanWorkspace } from "@/components/lesson-plan/LessonPlanWorkspace";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
export default async function LessonPlanPage(){const user=await requireUser();if(await getMaintenanceBlockForUser(user))redirect("/maintenance");return <LessonPlanWorkspace/>;}
