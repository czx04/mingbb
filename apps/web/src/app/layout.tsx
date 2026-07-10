import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MING Barber — Đẹp hơn, tự tin hơn",
  description: "Đặt lịch cắt tóc tại MING Barber nhanh chóng và dễ dàng."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
