"use client";

import { useEffect, useState } from "react";

type ToastMessage = { id: number; message: string; type: "success" | "error" };

declare global {
  interface WindowEventMap {
    "spmb:toast": CustomEvent<{ message: string; type?: "success" | "error" }>;
  }
}

export function showToast(message: string, type: "success" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("spmb:toast", { detail: { message, type } }));
}

export default function ToastHost() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const onToast = (event: WindowEventMap["spmb:toast"]) => {
      const id = Date.now() + Math.random();
      const item = { id, message: event.detail.message, type: event.detail.type ?? "success" };
      setItems((current) => [...current, item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((toast) => toast.id !== id));
      }, 3000);
    };
    window.addEventListener("spmb:toast", onToast);
    return () => window.removeEventListener("spmb:toast", onToast);
  }, []);

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="false">
      {items.map((item) => (
        <div className={`toast${item.type === "error" ? " error" : ""}`} key={item.id} role="status">
          {item.message}
        </div>
      ))}
    </div>
  );
}
