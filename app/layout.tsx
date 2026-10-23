import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nudge — Learn it yourself",
  description: "A free, hint-first study companion that helps you think your way to an answer."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
