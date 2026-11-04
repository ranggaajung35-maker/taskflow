# TaskFlow

TaskFlow adalah aplikasi workspace manajemen tugas dan proyek untuk individu maupun tim. **Semua fitur yang tersedia gratis**: tidak ada paket premium, tagihan, pembayaran, atau langganan.

## Fitur

- Autentikasi pengguna dengan Supabase Auth.
- Workspace pribadi yang dibuat untuk pengguna saat registrasi.
- Dashboard produktivitas, aktivitas terbaru, dan Focus Timer.
- Manajemen tugas: membuat tugas, status, prioritas, tenggat, serta pencarian/filter.
- Manajemen proyek tanpa batas paket.
- Kalender, analitik, dan direktori kolaborator per proyek.
- Team Performance Analytics: laporan tugas per anggota, penyelesaian, tugas berjalan, keterlambatan, dan ketepatan waktu.
- Penugasan tugas hanya kepada anggota proyek yang sama serta analitik kinerja proyek.
- Pengaturan profil, zona waktu, dan preferensi aplikasi.
- Kolaborasi terpisah per proyek dengan Row Level Security (RLS) di database; undangan ke satu proyek tidak membuka proyek lain.
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
10. Jika database sebelumnya menggunakan versi lama, jalankan migration `supabase/migrations/20261105_team_performance.sql` terlebih dahulu bila belum pernah dijalankan.
11. Jalankan migration `supabase/migrations/20261105_project_scoped_collaboration.sql` paling akhir. Migration ini mengubah kontrol akses menjadi per proyek, menambah tabel anggota/undangan proyek, dan menonaktifkan undangan workspace lama.

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
    │   │   └── [id]/  (ruang detail dan kolaborasi satu proyek)
│   │   ├── calendar/
│   │   ├── analytics/
│   │   ├── team/
│   │   │   └── performance/
│   │   └── settings/
│   ├── auth/
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── analytics/
│   ├── dashboard/
│   ├── projects/
    │   │   └── [id]/  (ruang detail dan kolaborasi satu proyek)
│   ├── shared/
│   ├── shell/
│   ├── tasks/
│   └── team/
└── lib/
    ├── actions/
    ├── data/
    ├── supabase/
    ├── types.ts
    └── utils.ts
supabase/
├── schema.sql
├── migrations/
│   ├── 20261105_workspace_invitations.sql (legacy)
│   └── 20261105_team_performance.sql
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


## Kolaborasi terpisah per proyek

Setiap akun mempunyai workspace pribadi. Model kolaborasi TaskFlow mengikuti konsep repository GitHub: **akses diberikan per proyek, bukan per workspace**. Proyek yang dibuat di workspace pribadi hanya terlihat oleh pemiliknya, kecuali proyek tertentu dibagikan secara eksplisit. Buka kartu proyek untuk masuk ke ruang proyek; dari halaman detail proyek, Owner atau Project Manager dapat membuat tautan undangan yang hanya berlaku untuk proyek tersebut. Penerima harus masuk dengan email yang diundang. Undangan berlaku 7 hari dan tidak memerlukan SMTP.

Anggota proyek hanya melihat detail proyek tersebut, daftar tugas, komentar, aktivitas, dan daftar anggota yang berada di proyek yang sama. Mereka tidak ditambahkan ke `workspace_members` milik pemilik dan tidak dapat melihat proyek pemilik lainnya. Jika pemilik memiliki Proyek A, B, dan C lalu mengundang teman hanya ke Proyek A, teman tersebut hanya akan melihat Proyek A (ditambah proyek pribadi miliknya sendiri). Tugas baru wajib berada di dalam proyek dan penanggung jawab harus menjadi anggota proyek yang sama. Halaman Kinerja Tim memiliki filter proyek agar laporan antarproyek tidak tercampur. Owner proyek dan Project Manager dapat melihat kinerja tim pada proyek yang mereka kelola; Member hanya melihat tugas dan metrik miliknya sendiri. Daftar proyek juga dipisahkan menjadi **Proyek milik saya** dan **Dibagikan kepada saya**.

Urutan migration: jalankan `supabase/schema.sql` terlebih dahulu, lalu migration lama yang memang sudah digunakan (`20261105_workspace_invitations.sql` bila pernah dipakai), `20261105_team_performance.sql`, kemudian `20261105_project_scoped_collaboration.sql`. Terakhir jalankan `20261105_project_scope_hardening.sql` untuk instalasi yang sudah menerapkan project-scope sebelumnya; migration ini menghapus izin tulis langsung ke tabel anggota dan menonaktifkan sisa undangan workspace lama. Undangan workspace terdahulu tidak otomatis memberi akses proyek; buat undangan ulang dari halaman detail setiap proyek. Pastikan `NEXT_PUBLIC_APP_URL` di produksi berisi URL HTTPS publik TaskFlow agar tautan tidak mengarah ke localhost.


## Team Performance Analytics

Halaman `/team/performance` menampilkan kinerja berdasarkan tugas yang benar-benar ditugaskan dari proyek yang dapat diakses akun saat ini. Owner proyek dapat melihat seluruh anggota pada proyek miliknya; Project Manager dan Member hanya dapat melihat data proyek yang secara eksplisit dibagikan kepada mereka. Metrik mencakup jumlah tugas ditugaskan, selesai, berjalan, terlambat, persentase penyelesaian, dan ketepatan waktu. Ketepatan waktu hanya dihitung untuk tugas selesai yang memiliki tenggat dan `completed_at`.

Untuk menggunakan fitur ini:

1. Jalankan `supabase/migrations/20261105_team_performance.sql` jika belum pernah dijalankan.
2. Jalankan `supabase/migrations/20261105_project_scoped_collaboration.sql` paling akhir agar penugasan divalidasi berdasarkan keanggotaan proyek.
3. Buka halaman detail proyek dan buat tugas di proyek tersebut.
4. Pilih **Penanggung jawab** dari anggota proyek yang sama.
5. Buka **Kolaborasi proyek → Kinerja tim** atau kunjungi `/team/performance`.

Filter 30/90 hari memfilter berdasarkan tanggal pembuatan tugas. Grafik tren menggunakan penyelesaian tugas yang ditugaskan selama 14 hari terakhir. Tugas tanpa penanggung jawab tidak masuk ke metrik individu dan ditampilkan sebagai jumlah tugas belum ditugaskan. Data yang tersedia di laporan mengikuti proyek yang dapat diakses akun tersebut; kolaborator tidak dapat melihat statistik proyek lain milik pemilik.
