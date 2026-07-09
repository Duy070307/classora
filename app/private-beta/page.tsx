import { redirect } from "next/navigation";

export default function PrivateBetaRedirect() {
  redirect("/dashboard");
}
