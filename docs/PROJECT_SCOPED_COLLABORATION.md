# Kolaborasi per proyek

TaskFlow menggunakan model akses seperti repository GitHub. **Menjadi anggota satu proyek tidak membuat seseorang menjadi anggota workspace atau membuka proyek lain milik pemilik.**

## Cara kerja

1. Setiap akun mendapatkan workspace pribadi sendiri saat registrasi.
2. Pemilik membuat beberapa proyek, misalnya `Website A`, `Mobile App`, dan `Internal Tools`.
3. Pemilik membuka detail satu proyek, lalu klik **Undang ke proyek**.
4. Undangan mencantumkan email tujuan, peran `Member` atau `Project Manager`, dan berlaku 7 hari.
5. Penerima masuk dengan email yang diundang dan menerima tautan.
6. Setelah bergabung, penerima mendapat akses hanya ke proyek tersebut.

Contoh: jika Ajung mempunyai tiga proyek dan mengundang Dina hanya ke `Website A`, daftar proyek Dina hanya menampilkan `Website A` yang dibagikan (serta proyek pribadi Dina sendiri). Dina tidak akan melihat `Mobile App` dan `Internal Tools` milik Ajung.

## Data di dalam proyek

Tugas wajib mempunyai `project_id`. Komentar, aktivitas, anggota, assignment, dan laporan kinerja dibatasi pada project yang sama. Halaman `/projects/[id]` menjadi ruang kerja utama untuk proyek tersebut. Halaman Tugas, Dashboard, Kalender, Pencarian, dan Analitik menggunakan data yang disaring oleh RLS berdasarkan proyek yang bisa diakses akun.

## Peran

- **Owner**: pemilik proyek; mengelola proyek dan anggota.
- **Project Manager**: mengelola anggota dan kolaborasi pada proyek yang ditugaskan.
- **Member**: mengerjakan dan mendiskusikan tugas pada proyek yang diikuti.

Project Manager tidak memperoleh akses otomatis ke proyek lain milik Owner.

## Database / Row Level Security

Tabel `project_members` menyimpan keanggotaan per proyek. Tabel `project_invitations` menyimpan undangan yang tokennya di-hash dan emailnya diverifikasi ketika penerima menerima undangan. RLS di `projects`, `tasks`, `task_comments`, `activity_logs`, dan `profiles` memeriksa project membership. Keanggotaan lama pada `workspace_members` tidak memberikan akses ke proyek.

Jalankan migration dengan urutan:

1. `supabase/schema.sql` (sekali untuk instalasi baru).
2. `supabase/migrations/20261105_workspace_invitations.sql` hanya bila instalasi lama memang memerlukannya; migration project-scope akan menonaktifkan undangan workspace lama.
3. `supabase/migrations/20261105_team_performance.sql` bila belum dijalankan.
4. `supabase/migrations/20261105_project_scoped_collaboration.sql`.
5. `supabase/migrations/20261105_project_scope_hardening.sql`.

Jika migration project-scoped sudah pernah berhasil dijalankan, jalankan migration hardening saja untuk mencabut kemampuan insert langsung anggota proyek dan membatasi daftar `workspace_members`.

## Pengujian isolasi

1. Buat akun A dengan beberapa proyek: A, B, dan C.
2. Buat akun B dengan email lain.
3. Dari detail proyek A, kirim undangan ke email akun B.
4. Login sebagai B dan terima undangan.
5. B harus melihat proyek A, tetapi tidak boleh melihat B/C milik akun A melalui daftar proyek, pencarian, dashboard, kalender, analitik, maupun akses URL langsung.
6. Coba buka URL detail proyek B milik akun A secara langsung; hasil yang benar adalah halaman tidak ditemukan/tidak memiliki akses.

Lakukan pengujian ini sebelum aplikasi dibuka untuk umum. Filter tampilan bukan pengganti RLS; aturan database adalah pengaman utama.
