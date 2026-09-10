import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EMAIL-SCHEDULER | ReachInbox Assignment",
  description: "Full-stack email scheduler with BullMQ, Redis, and PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
