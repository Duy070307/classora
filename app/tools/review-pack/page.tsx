import { redirect } from "next/navigation";
import { ReviewPackWorkspace } from "@/components/review-pack/ReviewPackWorkspace";
import { requireUser } from "@/lib/auth/require-user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export default async function ReviewPackPage() { const user = await requireUser(); if (await getMaintenanceBlockForUser(user)) redirect("/maintenance"); return <ReviewPackWorkspace/>; }
