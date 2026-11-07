"use client";

export default function PrintReportButton() {
  return <button
    type="button"
    className="btn-blue no-print"
    onClick={() => {
      document.body.classList.add("spmb-printing");
      window.addEventListener("afterprint", () => document.body.classList.remove("spmb-printing"), { once: true });
      window.print();
    }}
  >
    Cetak Laporan
  </button>;
}
