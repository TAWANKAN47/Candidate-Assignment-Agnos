import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agnos Patient Sessions",
  description: "Multi-patient realtime session UX"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-950 antialiased">{children}</body>
    </html>
  );
}
