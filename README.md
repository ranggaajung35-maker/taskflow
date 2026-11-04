# TaskFlow

TaskFlow adalah aplikasi workspace manajemen tugas dan proyek untuk individu maupun tim. **Semua fitur yang tersedia gratis**: tidak ada paket premium, tagihan, pembayaran, atau langganan.

## Fitur

- Autentikasi pengguna dengan Supabase Auth.
- Workspace pribadi yang dibuat untuk pengguna saat registrasi.
- Dashboard produktivitas, aktivitas terbaru, dan Focus Timer.
- Manajemen tugas: membuat tugas, status, prioritas, tenggat, serta pencarian/filter.
- Manajemen proyek tanpa batas paket.
- Kalender, analitik, dan daftar anggota workspace.
- Pengaturan profil, zona waktu, dan preferensi aplikasi.
- Row Level Security (RLS) untuk membatasi data berdasarkan workspace.
- Desain responsif, navigasi mobile, animasi, dan tema gelap.

## Teknologi

- Next.js App Router, React, TypeScript
- Tailwind CSS 4
- Supabase Auth dan PostgreSQL
- Motion, Recharts, Lucide, Sonner, Zod

## Persyaratan

- Node.js 20.9 atau lebih baru
- npm 10 atau versi kompatibel
- Project Supabase untuk akun dan penyimpanan cloud

## 1. Instal dan jalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 2. Hubungkan Supabase

1. Buat project di [Supabase](https://supabase.com/).
2. Buka Supabase **SQL Editor**.
3. Jalankan seluruh isi `supabase/schema.sql` satu kali untuk menyiapkan profil, workspace, tugas, proyek, anggota, aktivitas, trigger registrasi, dan kebijakan RLS.
4. Buka **Project Settings → API Keys** atau **Connect** untuk mengambil Project URL dan Publishable Key.
5. Salin `.env.example` menjadi `.env.local`.
6. Isi konfigurasi berikut: 

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_KEY_KAMU
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

7. Pada Supabase **Authentication → URL Configuration**, masukkan:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`
8. Restart server (`Ctrl + C`, lalu `npm run dev`).
9. Buka `/auth/signup` untuk membuat akun. Trigger database akan membuat profil dan workspace pribadi untuk pengguna baru.

TaskFlow hanya membutuhkan Project URL dan Publishable Key di atas. **Tidak memerlukan Supabase Secret Key, Xendit, Midtrans, API pembayaran, atau webhook.** Jangan menaruh secret key di variabel `NEXT_PUBLIC_*`.

### Jika Supabase sudah pernah dikonfigurasi

Jangan jalankan ulang `supabase/schema.sql` tanpa memeriksa struktur database terlebih dahulu. Cukup pastikan variabel `.env.local` masih benar. Jika `.env.local` berisi variabel lama seperti `SUPABASE_SECRET_KEY`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `XENDIT_SECRET_KEY`, atau `XENDIT_WEBHOOK_TOKEN`, variabel tersebut tidak lagi digunakan oleh TaskFlow dan boleh dihapus. Pertahankan tiga variabel `NEXT_PUBLIC_*` yang diperlukan.

## 3. Jalankan pemeriksaan

```bash
npm run typecheck
npm run lint
npm run build
```

## 4. Deploy ke Vercel

1. Push source code ke repository GitHub.
2. Buka [Vercel](https://vercel.com/) lalu import repository tersebut.
3. Pilih framework preset **Next.js**.
4. Tambahkan tiga environment variables yang sama (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`) pada Vercel Project Settings → Environment Variables.
5. Isi `NEXT_PUBLIC_APP_URL` dengan domain HTTPS yang diberikan Vercel atau domain kustom milikmu.
6. Deploy.
7. Tambahkan URL callback produksi `https://DOMAIN-KAMU/auth/callback` dan Site URL produksi di Supabase Authentication → URL Configuration.
8. Redeploy setelah environment variables dan URL konfigurasi diperbarui.

Vercel dipakai sebagai contoh hosting yang mendukung Next.js. TaskFlow bukan website statis; deploy pada platform yang mendukung Next.js server runtime.

## 5. Struktur utama

```text
src/
├── app/
│   ├── (workspace)/
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   ├── projects/
│   │   ├── calendar/
│   │   ├── analytics/
│   │   ├── team/
│   │   └── settings/
│   ├── auth/
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── analytics/
│   ├── dashboard/
│   ├── projects/
│   ├── shared/
│   ├── shell/
│   └── tasks/
└── lib/
    ├── actions/
    ├── data/
    ├── supabase/
    ├── types.ts
    └── utils.ts
supabase/
├── schema.sql
└── optional/
    └── remove_legacy_billing.sql
```

## 6. Catatan database pembayaran lama

Versi TaskFlow ini tidak memiliki halaman billing, endpoint checkout, webhook payment gateway, atau pembatasan fitur berdasarkan paket. Jika sebelumnya kamu sudah menjalankan migration Xendit/Midtrans, tabel billing lama tidak lagi dipakai dan tidak mengganggu aplikasi.

File `supabase/optional/remove_legacy_billing.sql` disediakan hanya untuk membersihkan tabel billing lama. **Jangan jalankan file opsional tersebut jika ada riwayat transaksi yang ingin disimpan.** Backup database dahulu. Kamu tidak perlu menjalankannya agar TaskFlow berfungsi gratis.

## Keamanan

- Publishable/anon key hanya aman digunakan bersama kebijakan RLS yang benar.
- Jangan commit `.env.local` ke GitHub. File ini sudah masuk `.gitignore`.
- Terapkan backup database dan uji akses antar-workspace sebelum membuka aplikasi untuk publik.
- Mode pratinjau menggunakan data contoh; gunakan akun Supabase untuk penyimpanan cloud permanen.


## Data workspace baru

TaskFlow tidak mengisi akun baru dengan tugas, proyek, anggota, aktivitas, atau grafik contoh. Semua daftar dan metrik dimulai dari data workspace yang benar-benar tersimpan di Supabase.


## Pencarian global dan undangan anggota

Pencarian di topbar mengarahkan ke `/search` dan mencari tugas, proyek, serta anggota pada workspace aktif. Menu titik tiga pada daftar anggota menyediakan aksi menyalin nama/email.

Undangan anggota memakai tautan sekali pakai yang kedaluwarsa dalam 7 hari sehingga tidak memerlukan SMTP. Sebelum fitur ini digunakan, jalankan `supabase/migrations/20261105_workspace_invitations.sql` di Supabase SQL Editor. Tautan hanya dapat diterima oleh pengguna yang sudah login/daftar dengan email yang diundang. Tetapkan `NEXT_PUBLIC_APP_URL` ke URL publik di Vercel agar tautan undangan tidak mengarah ke localhost. Owner dapat mengundang admin/member; admin hanya dapat mengundang member.
