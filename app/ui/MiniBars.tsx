"use client";

import { useEffect, useState, type CSSProperties } from "react";

export type BarDatum = { label: string; value: number };

export default function MiniBars({
  title,
  data,
}: {
  title: string;
  data: BarDatum[];
}) {
  const [visible, setVisible] = useState(false);
  const max = Math.max(1, ...data.map((item) => Number(item.value) || 0));

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="panel chart-panel" aria-label={title}>
      <h3 className="panel-title">{title}</h3>
      {data.length ? (
        <div className={`mini-chart${visible ? " is-visible" : ""}`} role="img" aria-label={title}>
          {data.map((item) => {
            const value = Math.max(0, Number(item.value) || 0);
            const scale = value / max;
            return (
              <div className="mini-chart-item" key={item.label} title={`${item.label}: ${value}`}>
                <span className="mini-chart-value">{value}</span>
                <span className="mini-chart-track">
                  <span className="mini-chart-bar" style={{ "--bar-scale": scale } as CSSProperties} />
                </span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state"><p>Belum ada data untuk ditampilkan.</p></div>
      )}
    </section>
  );
}
