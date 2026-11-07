import "./spmb.css";
import Link from "next/link";
import Image from "next/image";
import Reveal from "./ui/Reveal";
import CountUp from "./ui/CountUp";
import NavbarScroll from "./ui/NavbarScroll";

const fitur = [
  { no: "01", judul: "Pendaftaran", desc: "Isi formulir pendaftaran secara online dengan mudah dan cepat." },
  { no: "02", judul: "Tes TPA", desc: "Ikuti tes potensi akademik sesuai jadwal yang ditentukan." },
  { no: "03", judul: "Seleksi", desc: "Pantau hasil seleksi langsung dari akun kamu." },
];

const jurusan = [
  { kode: "PPLG", nama: "Pengembangan Perangkat Lunak dan Gim" },
  { kode: "TJKT", nama: "Teknik Jaringan Komputer dan Telekomunikasi" },
  { kode: "PM", nama: "Pemasaran" },
  { kode: "DKV", nama: "Desain Komunikasi Visual" },
  { kode: "PH", nama: "Perhotelan" },
];

export default function Home() {
  return (
    <>
      {/* NAVBAR */}
      <header className="navbar">
        <NavbarScroll />
        <div className="container navbar-inner">
          <div className="brand">
            <span className="brand-text">SPMB</span>
            <Image src="/asset/logo-sekolah.png" alt="Logo SMK Citra Negara" className="brand-logo" width={123} height={107} sizes="48px" />
          </div>
          <nav className="nav-links">
            <a href="#beranda" className="active">Beranda</a>
            <a href="#tentang">Tentang</a>
            <a href="#alur">Alur SPMB</a>
            <a href="#jurusan">Jurusan</a>
            <a href="#kontak">Kontak</a>
          </nav>
          <Link href="/register" className="btn btn-primary">Daftar Sekarang</Link>
        </div>
      </header>

      {/* HERO */}
      <section id="beranda" className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="badge">PENERIMAAN MURID BARU</span>
            <h1>
              Bangun Masa Depanmu <span className="accent">Bersama Kami.</span>
            </h1>
            <p>
              Selamat datang di Sistem Penerimaan Murid Baru SMK Citra Negara.
              Daftarkan dirimu dan wujudkan masa depan cerah bersama kami.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-primary">Mulai Daftar</Link>
              <Link href="/login" className="btn btn-outline">Login</Link>
            </div>
          </div>
          <div className="hero-image">
            <Image src="/asset/gedung-sekolah.jpg" alt="Gedung SMK Citra Negara" width={470} height={245} sizes="(max-width: 760px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="quick-stats" aria-label="Informasi SPMB">
        <div className="container quick-stats-grid">
          <Reveal><div className="quick-stat"><strong><CountUp value={5} /></strong><span>Jumlah Jurusan</span></div></Reveal>
          <Reveal><div className="quick-stat"><strong>2026<small>/2027</small></strong><span>Tahun Ajaran</span></div></Reveal>
          <Reveal><div className="quick-stat"><strong><CountUp value={200} suffix="+" /></strong><span>Kuota Siswa</span></div></Reveal>
        </div>
      </section>

      {/* ALUR */}
      <section id="alur" className="section">
        <div className="container">
          <h2 className="section-title">Semua yang kamu butuhkan</h2>
          <p className="section-sub">Proses pendaftaran yang mudah dan jelas</p>
          <div className="card-grid-3">
            {fitur.map((f) => (
              <Reveal key={f.no}>
                <div className="card">
                  <span className="card-no">{f.no}</span>
                  <h3>{f.judul}</h3>
                  <p>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* JURUSAN */}
      <section id="jurusan" className="section section-tight">
        <div className="container">
          <h2 className="section-title small">Pilih Jurusanmu</h2>
          <div className="card-grid-5">
            {jurusan.map((j) => (
              <Reveal key={j.kode}>
                <div className="card jurusan-card">
                  <h3>{j.kode}</h3>
                  <p>{j.nama}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="kontak" className="footer">
        <div className="container footer-inner">
          <div>
            <h4>SPMB SMK Citra Negara</h4>
            <p>Sistem Penerimaan Murid Baru</p>
            <p>SMK Citra Negara</p>
          </div>
          <div>
            <h4>Kontak</h4>
            <p>Alamat sekolah</p>
            <p>Telepon</p>
            <p>Email</p>
          </div>
          <div>
            <h4>Media Sosial</h4>
            <p>Instagram</p>
            <p>TikTok</p>
            <p>Facebook</p>
          </div>
        </div>
      </footer>
    </>
  );
}