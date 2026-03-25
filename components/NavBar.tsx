"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/sponsorship", label: "Sponsorship" },
  { href: "/comments", label: "Comments" },
  { href: "/titles", label: "Titles" },
  { href: "/chat", label: "Chat" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: brand + desktop links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-blue-600 dark:text-blue-400 mr-2">
            CreatorIQ
          </Link>
          <div className="hidden sm:flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: theme toggle + settings + hamburger */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/settings"
            className={`hidden sm:block text-sm transition-colors ${
              pathname === "/settings"
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            Settings
          </Link>
          {/* Hamburger */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="sm:hidden p-1 text-gray-600 dark:text-gray-400"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`text-sm py-1 transition-colors ${
                pathname === link.href
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className={`text-sm py-1 transition-colors ${
              pathname === "/settings"
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Settings
          </Link>
        </div>
      )}
    </nav>
  );
}
