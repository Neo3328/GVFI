import { redirect } from "next/navigation";

export default function RenderRedirect() {
  redirect("/app/tasks");
}
