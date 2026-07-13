"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";

export default function SiteHeader() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const distance = currentScrollY - lastScrollY.current;

      if (currentScrollY < 80) {
        setHidden(false);
      } else if (distance > 6) {
        setHidden(true);
        lastScrollY.current = currentScrollY;
      } else if (distance < -4) {
        setHidden(false);
        lastScrollY.current = currentScrollY;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`site-header${hidden ? " nav-hidden" : ""}`}>
      <nav className="nav-shell" aria-label="Điều hướng chính">
        <a className="nav-brand" href="#top" aria-label="MING Barber">
          <Image className="nav-avatar" src={logo} alt="" priority />
          <span className="nav-brand-copy"><strong>MING</strong><small>BARBER</small></span>
        </a>
        <div className="nav-menu">
          <a href="#gioi-thieu">Câu chuyện</a>
          <a href="#dich-vu">Dịch vụ</a>
          <a href="#khong-gian">Không gian</a>
          <a href="#danh-gia">Đánh giá</a>
        </div>
        <div className="nav-actions">
          <a className="lookup-button" href="/tra-cuu">Thẻ MING</a>
          <a className="ref-button ref-button-outline desktop-nav-cta" href="/dat-lich">Đặt lịch</a>
          <a className="ref-button ref-button-outline mobile-nav-cta" href="/tra-cuu">Thẻ MING</a>
        </div>
      </nav>
    </header>
  );
}
