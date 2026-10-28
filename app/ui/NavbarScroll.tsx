"use client";

import { useEffect } from "react";

export default function NavbarScroll() {
  useEffect(() => {
    const navbar = document.querySelector(".navbar");
    if (!(navbar instanceof HTMLElement)) return;
    const update = () => navbar.classList.toggle("is-scrolled", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return null;
}
