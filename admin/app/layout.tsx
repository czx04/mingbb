import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MING Admin",
  description: "Hệ thống quản lý MING Barber"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
