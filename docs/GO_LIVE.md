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
8. Atur Site URL Supabase ke domain publik lalu redeploy.

## 5. Tabel billing lama (opsional)

Apabila migration billing pada versi lama sudah pernah dijalankan, tabel tersebut sekarang tidak dipakai. Tidak perlu menghapusnya agar TaskFlow berfungsi. Jika ingin menghapus secara permanen dan yakin tidak ada riwayat pembayaran yang perlu dipertahankan, backup dahulu lalu jalankan `supabase/optional/remove_legacy_billing.sql` melalui Supabase SQL Editor.

Jangan commit `.env.local` atau kredensial apa pun ke GitHub.


## Undangan anggota (tanpa SMTP)

Jalankan `supabase/migrations/20261105_workspace_invitations.sql` setelah schema utama. Atur `NEXT_PUBLIC_APP_URL` pada environment produksi ke URL publik TaskFlow (contoh `https://taskflow-domain.vercel.app`). Owner/admin dapat membuat tautan undangan dari halaman Anggota tim. Tautan berlaku 7 hari dan hanya dapat digunakan akun dengan email yang diundang.
