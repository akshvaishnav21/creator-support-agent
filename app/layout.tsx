import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creator Support Agent",
  description: "AI-powered support agent for YouTube creators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
