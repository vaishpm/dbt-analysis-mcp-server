import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Analysis Agent",
  description: "Ask data questions in plain English",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
