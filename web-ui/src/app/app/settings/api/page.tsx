import { redirect } from "next/navigation";

export default function ApiSettingsRedirect() {
  redirect("/app/settings");
}
