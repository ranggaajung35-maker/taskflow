import { redirect } from "next/navigation";
import { MobileShell } from "@/components/shell/mobile-shell";
import { signOutAction } from "@/app/auth/actions";
import { getWorkspaceContext } from "@/lib/data/queries";

export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await getWorkspaceContext();
  if (!context.demo && !context.user) redirect("/auth/login");
  const metadata = context.user?.user_metadata as { full_name?: string } | undefined;
  const userName = metadata?.full_name || context.user?.email?.split("@")[0] || "Pengguna";
  return (
    <div className="workspace-bg">
      <MobileShell
        userName={userName}
        email={context.user?.email ?? "demo@taskflow.app"}
        workspaceName={context.workspaceName}
        role={String(context.role ?? "member")}
        demo={context.demo}
        signOutAction={signOutAction}
      >
        {children}
      </MobileShell>
    </div>
  );
}
