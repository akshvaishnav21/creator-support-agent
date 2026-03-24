"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("creatoriq_gemini_key");
    setHasKey(!!key);
  }, []);

  if (hasKey === null) return null; // hydrating

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-sm">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            API Key Required
          </h2>
          <p className="text-sm text-yellow-800 mb-4">
            You need a Gemini API key to use this tool. It&apos;s free and takes
            30 seconds to set up.
          </p>
          <Link
            href="/settings"
            className="inline-block bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium"
          >
            Set Up API Key
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
