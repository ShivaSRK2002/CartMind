import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardView } from "@/components/DashboardView";

export default async function AdminHomePage() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return <DashboardView adminName={session.name} />;
}
