import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { SettingsPanel } from "@/components/shared/settings-panel";
import { getWorkspaceContext } from "@/lib/data/queries";

export default async function SettingsPage() {
  const context = await getWorkspaceContext();
  const metadata = context.user?.user_metadata as { full_name?: string } | undefined;
  const fullName = metadata?.full_name || context.user?.email?.split("@")[0] || "Pengguna TaskFlow";
  return <div className="app-content">
    {context.demo && <DemoBanner/>}
    <PageHeading eyebrow="WORKSPACE / PENGATURAN" title="Pengaturan akun" description="Kelola identitas, preferensi, dan keamanan akun TaskFlow."/>
    <SettingsPanel fullName={fullName} email={context.user?.email ?? "demo@taskflow.app"} demo={context.demo}/>
  </div>;
}
