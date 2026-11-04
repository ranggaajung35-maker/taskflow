"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export function MobileShell({
  children, userName, email, workspaceName, role, demo, signOutAction,
}: {
  children: ReactNode;
  userName: string;
  email: string;
  workspaceName: string;
  role: string;
  demo: boolean;
  signOutAction: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar userName={userName} email={email} workspaceName={workspaceName} role={role} demo={demo} open={menuOpen} onClose={() => setMenuOpen(false)} signOutAction={signOutAction}/>
      <div className="app-main">
        <Topbar onMenu={() => setMenuOpen(true)}/>
        <main>{children}</main>
      </div>
    </div>
  );
}
