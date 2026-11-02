import { redirect } from "next/navigation";

export default function CopilotRedirectPage() {
  redirect("/dashboard/live-chat");
}
