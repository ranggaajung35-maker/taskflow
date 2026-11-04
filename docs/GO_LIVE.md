# Publikasi TaskFlow

TaskFlow saat ini adalah aplikasi gratis sepenuhnya. Tidak ada pembayaran, paket premium, langganan, payment gateway, atau webhook pembayaran.

## 1. Periksa Supabase

- Pastikan `supabase/schema.sql` sudah diterapkan pada project Supabase.
- Pastikan registrasi membuat profil dan workspace pribadi.
- Pastikan Row Level Security aktif pada tabel workspace, proyek, dan tugas.
- Uji dua akun berbeda untuk memastikan data workspace tidak bercampur.

## 2. Environment variables

Hanya tiga variabel berikut yang dibutuhkan: 

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_KEY_KAMU
NEXT_PUBLIC_APP_URL=https://DOMAIN-KAMU
```

Tidak ada kredensial gateway atau Supabase Secret Key yang diperlukan oleh aplikasi.

## 3. Autentikasi email untuk pengguna publik (wajib)

- Aktifkan kembali **Confirm email** sebelum aplikasi dibuka untuk umum. Jangan membiarkan akun dengan email yang belum diverifikasi dapat masuk, karena orang lain dapat mendaftarkan alamat email milik orang lain.
- Konfigurasikan **custom SMTP** pada Supabase Authentication → SMTP Settings menggunakan penyedia email yang mendukung SMTP (misalnya Resend atau Brevo). SMTP bawaan Supabase hanya untuk pengujian dan dibatasi sekitar 2 email per jam serta penerima yang diizinkan; ini tidak cocok untuk pendaftaran publik.
- Atur From address dan verifikasi domain pengirim (SPF/DKIM/DMARC) sesuai panduan penyedia email.
- Pada Authentication → URL Configuration, set **Site URL** ke URL produksi TaskFlow dan masukkan callback berikut ke daftar Redirect URLs: `https://DOMAIN-KAMU/auth/callback`. Tambahkan `http://localhost:3000/auth/callback` hanya untuk pengembangan lokal.

## 3. Pemeriksaan sebelum publikasi

Di komputer lokal, jalankan:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

Lalu uji alur daftar, verifikasi email, login, logout, tambah/edit/hapus tugas, pembuatan proyek, kalender, dan akses dua akun yang berbeda.

## 4. Deploy ke Vercel

1. Push folder project ke GitHub.
2. Import repository melalui https://vercel.com/.
3. Pastikan framework preset Next.js.
4. Tambahkan tiga environment variables Supabase di Vercel.
5. Gunakan domain HTTPS Vercel sebagai `NEXT_PUBLIC_APP_URL`.
6. Deploy.
7. Tambahkan `https://DOMAIN-KAMU/auth/callback` ke Supabase Authentication → URL Configuration.
8. Atur Site URL Supabase ke domain publik, pastikan callback produksi terdaftar, dan redeploy.

## 5. Tabel billing lama (opsional)

Apabila migration billing pada versi lama sudah pernah dijalankan, tabel tersebut sekarang tidak dipakai. Tidak perlu menghapusnya agar TaskFlow berfungsi. Jika ingin menghapus secara permanen dan yakin tidak ada riwayat pembayaran yang perlu dipertahankan, backup dahulu lalu jalankan `supabase/optional/remove_legacy_billing.sql` melalui Supabase SQL Editor.

Jangan commit `.env.local` atau kredensial apa pun ke GitHub.


## Undangan anggota (tanpa SMTP)

Untuk kolaborasi, jalankan `supabase/migrations/20261105_project_scoped_collaboration.sql` paling akhir setelah schema utama dan migration sebelumnya. Atur `NEXT_PUBLIC_APP_URL` pada environment produksi ke URL publik TaskFlow (contoh `https://taskflow-domain.vercel.app`). Owner proyek atau Project Manager membuat undangan dari detail proyek. Tautan berlaku 7 hari dan hanya dapat digunakan akun dengan email yang diundang. Penerima hanya akan melihat proyek yang dibagikan kepadanya; undangan workspace lama dinonaktifkan.


## Kolaborasi per proyek (wajib sebelum dibuka ke publik)

TaskFlow menggunakan model seperti repository GitHub: anggota hanya memperoleh akses ke proyek yang mengundangnya. Terapkan migration dengan urutan `schema.sql` → migration fitur lama yang memang digunakan → `20261105_project_scoped_collaboration.sql` → `20261105_project_scope_hardening.sql`. Jika migration project-scoped sebelumnya sudah diterapkan, jalankan migration hardening terakhir saja. Uji dengan dua akun: akun B diundang ke Proyek A milik akun A; akun B harus dapat membuka Proyek A dan tugasnya, tetapi tidak boleh menemukan Proyek B/C milik akun A melalui daftar proyek, pencarian, dashboard, kalender, analitik, atau URL langsung. RLS Supabase adalah lapisan penentu akses; filter tampilan saja tidak cukup.


## Session refresh

Jangan hapus `src/proxy.ts` dan `src/lib/supabase/proxy.ts`. Keduanya memperbarui cookie sesi Supabase sebelum halaman Server Component dirender. Tanpa Proxy, sesi dapat gagal diperbarui setelah access token kedaluwarsa.
