import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "TaskFlow — Kelola pekerjaan dengan lebih cerdas",
    template: "%s | TaskFlow",
  },
  description:
    "Ruang kerja modern untuk mengelola proyek, tugas, tim, dan produktivitas dalam satu tempat.",
  applicationName: "TaskFlow",
  keywords: ["task management", "project management", "productivity", "SaaS"],
  icons: { icon: "/brand/mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
