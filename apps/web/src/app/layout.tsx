import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MING Platform",
  description: "Next.js, NestJS, Supabase starter"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
