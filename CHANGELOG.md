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
