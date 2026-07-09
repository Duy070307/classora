import { redirect } from "next/navigation";

export default function KnownIssuesRedirect() {
  redirect("/dashboard");
}
