# Catatan SPMB

## Perubahan

- Form pembayaran siswa tidak lagi meminta tanggal pembayaran atau nama pengirim. Tanggal transaksi dicatat oleh waktu server; kolom lama di database tetap nullable dan tidak dihapus.
- Metode pembayaran mendukung Transfer Bank, Tunai (Cash), dan QRIS. Transfer Bank memerlukan bank, nomor rekening, dan nama pemilik; Tunai memakai petunjuk; QRIS menampilkan gambar placeholder sampai QR resmi diunggah.
- Siswa memilih satu jurusan dari PPLG, TJKT, PM, DKV, dan PH. Pilihan tersimpan pada `jurusan_1`; data/kolom lama tidak dihapus.
- Sidebar role tetap di kiri saat halaman di-scroll, header akun tetap di atas, dan menu dapat dibuka-tutup di ponsel.

## Urutan setup

1. Jalankan `npm install`.
2. Salin `.env.example` menjadi `.env.local`, lalu isi koneksi database dan kredensial sesuai lingkungan Laragon.
3. Pastikan database `spmb` tersedia dan buat backup sebelum migrasi, misalnya `mysqldump --single-transaction --databases spmb > backup/spmb-sebelum-migrasi.sql`.
4. Jalankan `npm run migrate`.
5. Jalankan `npm run dev`.

Skrip migrasi mengulang migrasi secara idempoten. Migrasi 005 menambahkan tipe Tunai dan jurusan yang diperlukan bila belum ada; migrasi ini tidak mengubah tabel `users`, menghapus pembayaran, atau menghapus kolom lama.

## Hal yang perlu diisi manual

- Lengkapi **nomor rekening asli sekolah** dan **nama pemilik rekening** untuk metode Transfer Bank yang akan diaktifkan.
- Ganti gambar QRIS contoh di `public/qris-contoh.png` dan unggah **gambar QRIS asli sekolah** melalui menu Metode Pembayaran sebelum siswa membayar memakai QRIS. File contoh tidak dapat digunakan untuk transaksi nyata.
- **Nominal daftar ulang adalah placeholder**: uang pangkal/gedung Rp2.500.000, seragam Rp750.000, perlengkapan/buku Rp500.000, SPP bulan pertama Rp350.000, dan kegiatan/OSIS Rp200.000. Admin harus menggantinya dengan angka resmi sekolah di menu Komponen Biaya sebelum tahap daftar ulang dibuka.
- Isi batas waktu pendaftaran dan daftar ulang melalui menu Komponen Biaya. Jika tanggal belum diisi, halaman siswa akan menyatakan bahwa batas waktu belum ditentukan.
