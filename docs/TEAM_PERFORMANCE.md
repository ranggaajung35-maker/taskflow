# Team Performance Analytics

Halaman: `/team/performance`

## Sumber data

Laporan dihitung dari tugas pada proyek yang dapat diakses akun melalui `public.project_members` atau sebagai pemilik proyek. Sebuah tugas masuk ke metrik individu hanya jika `assignee_id` cocok dengan anggota proyek yang sama. Tidak ada angka contoh atau data dummy pada laporan ini.

## Metrik

- **Ditugaskan**: jumlah tugas yang memiliki penanggung jawab.
- **Selesai**: tugas dengan `status = 'done'`.
- **Dikerjakan**: tugas dengan `status = 'in_progress'`.
- **Belum mulai**: tugas dengan `status = 'todo'`.
- **Terlambat**: tugas yang memiliki `due_date` sebelum tanggal lokal saat ini dan status belum `done`.
- **Penyelesaian**: tugas selesai dibagi semua tugas yang ditugaskan kepada anggota.
- **Tepat waktu**: tugas selesai dengan `completed_at` paling lambat pada akhir tanggal `due_date`, dibagi tugas selesai yang memiliki tanggal tenggat dan tanggal selesai.

Periode 30/90 hari memfilter berdasarkan `created_at`. Grafik tren memperlihatkan jumlah tugas yang selesai dalam 14 hari terakhir. Tugas tanpa penanggung jawab tidak dihitung untuk kinerja individu; jumlahnya ditampilkan terpisah.

## Akses

- Owner proyek dan Project Manager dapat melihat semua anggota dan tugas hanya pada proyek yang mereka kelola.
- Member hanya melihat metrik dan tugas yang ditugaskan kepada dirinya sendiri.
- Jika seseorang mengelola beberapa proyek, laporan tim tetap dibatasi pada proyek yang dikelolanya; memilih gabungan semua proyek hanya menampilkan tim penuh jika semua proyek yang dapat diakses memang dapat dikelola olehnya.
- RLS memisahkan akses per proyek, bukan sekadar menyembunyikan data pada UI.

## Menugaskan pekerjaan

Tugas dapat diberi penanggung jawab ketika dibuat pada dialog tugas baru, atau melalui dropdown penanggung jawab pada daftar tugas. Server action dan trigger database memeriksa bahwa penerima adalah anggota proyek yang sama. Migration `supabase/migrations/20261105_project_scoped_collaboration.sql` menambahkan validasi tersebut.

## Instalasi migration

Buka Supabase Dashboard → SQL Editor → New Query, tempel seluruh isi migration, lalu klik Run. Jalankan migration team-performance lama terlebih dahulu bila belum pernah dijalankan, lalu `20261105_project_scoped_collaboration.sql`, dan terakhir `20261105_project_scope_hardening.sql`. Migration ini mempertahankan tugas dan proyek lama, tetapi akses collaborator lama ke seluruh proyek dihentikan. Undang kembali orang yang diperlukan dari halaman detail masing-masing proyek.
