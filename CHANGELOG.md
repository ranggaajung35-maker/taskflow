# Changelog

## Build compatibility fixes
- Removed the obsolete workspace-wide invitation dialog; collaboration now uses project-scoped invitations only.
- Updated the focus timer to complete sessions from its interval callback instead of setting state directly inside an effect.
- Removed unused imports and marked the required server-action FormData argument as intentionally consumed.

## Project-scoped collaboration

- Collaboration is isolated per project, GitHub-repository style; inviting a person to one project does not expose the owner's other projects.
- Project invitation links grant access only to the invited project and require matching email.
- Tasks, comments, members, activity, search, calendar, analytics, and performance are filtered by project-level RLS.
- Project cards are separated into **Proyek milik saya** and **Dibagikan kepada saya**.
- Project detail pages contain their own tasks, team, progress, and project-scoped invitation controls.
- Owner and Project Manager can inspect team performance only for projects they manage. Members see their own performance only.
- Added `20261105_project_scope_hardening.sql` for installations that already applied the earlier project-scope migration.

# Changelog

## 2.0.0 — Full-stack foundation

- Replaced the single-file prototype with a structured Next.js and TypeScript application.
- Added marketing site, authentication routes, workspace shell, responsive dashboard, tasks, projects, calendar, analytics, team, and settings pages.
- Added Supabase SSR client, schema, signup bootstrap trigger, workspace row-level security, and server actions.
- Added task comments, activity logging, demo fixtures, motion transitions, data visualizations, and brand SVG assets.
- Added operational documentation and Vercel deployment guidance.

## 2.1.0 — Free edition

- Removed paid plans, billing pages, checkout endpoints, and Midtrans payment webhooks.
- Removed the two-active-project limit; all workspaces can create projects without a subscription.
- Updated the landing page to state that all current features are free.
- Removed payment gateway credentials and the Supabase server secret from the example environment file; the app only requires the public Supabase URL and publishable key.
- Kept legacy database billing tables dormant by default and added an optional cleanup SQL script for owners who have confirmed those records can be deleted.

## 2.1.1 — Data workspace kosong
- Menghapus fallback data demo dari seluruh query workspace.
- Dashboard dan analitik menggunakan data tugas aktual, bukan angka contoh.
- Akun tanpa workspace menampilkan koleksi kosong, tidak mengambil data pengguna lain atau demo.
- Aktivitas pembuatan workspace awal tidak memenuhi feed aktivitas terbaru.

## 2.1.0 — Team Performance Analytics

- Menambahkan halaman `/team/performance` dengan statistik penugasan, penyelesaian, pekerjaan berjalan, tenggat terlewat, tren 14 hari, dan ketepatan waktu.
- Owner proyek dan Project Manager dapat melihat ringkasan anggota pada proyek yang mereka kelola; Member hanya melihat laporan tugas miliknya.
- Menambahkan penugasan anggota ketika membuat tugas dan dropdown penanggung jawab untuk tugas yang sudah ada.
- Menambahkan validasi server dan migration database untuk memastikan penanggung jawab merupakan anggota proyek yang sama.
- Menambahkan navigasi Kinerja Tim dan dokumentasi instalasi migration.

## 2.2.0 — Kolaborasi per proyek

- Memisahkan daftar proyek menjadi proyek milik sendiri dan proyek yang dibagikan.
- Mengundang anggota secara eksplisit ke satu proyek; penerima tidak menjadi anggota workspace pemilik.
- Mengunci tugas, komentar, aktivitas, anggota, pencarian, kalender, analitik, dan laporan dengan RLS proyek.
- Menampilkan Team Performance secara penuh hanya kepada Owner/Project Manager pada proyek yang dikelola; Member hanya melihat metrik dirinya.
