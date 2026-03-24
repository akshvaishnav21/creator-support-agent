import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorIQ",
  description: "AI-powered tools for YouTube creators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-bold text-blue-600 mr-2">
            CreatorIQ
          </Link>
          <Link
            href="/sponsorship"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Sponsorship
          </Link>
          <Link
            href="/comments"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Comments
          </Link>
          <Link
            href="/titles"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Titles
          </Link>
          <Link
            href="/settings"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors ml-auto"
          >
            ⚙ Settings
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
