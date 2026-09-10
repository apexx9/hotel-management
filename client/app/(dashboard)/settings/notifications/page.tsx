import { redirect } from "next/navigation";

export default function SettingsNotificationsRedirectPage() {
  redirect("/settings?tab=notifications");
}
