"use client";

import { useState, useEffect } from "react";

export default function ApiKeySettings() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("creatoriq_gemini_key");
    if (stored) {
      setHasKey(true);
      setKey(stored);
    }
  }, []);

  function handleSave() {
    if (!key.trim()) return;
    localStorage.setItem("creatoriq_gemini_key", key.trim());
    setHasKey(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    localStorage.removeItem("creatoriq_gemini_key");
    setKey("");
    setHasKey(false);
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">API Key Settings</h1>
      <p className="text-gray-600 mb-6">
        CreatorIQ uses your own Google Gemini API key. Your key is stored only in
        your browser and never sent to our servers.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Get a free Gemini API key at{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Google AI Studio
          </a>
          . The free tier is sufficient for all CreatorIQ tools.
        </p>
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Gemini API Key
      </label>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="AIza..."
        className="w-full border rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm"
      />

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {saved ? "Saved!" : "Save Key"}
        </button>
        {hasKey && (
          <button
            onClick={handleClear}
            className="border border-red-300 text-red-600 px-5 py-2 rounded-lg hover:bg-red-50"
          >
            Clear Key
          </button>
        )}
      </div>

      {hasKey && (
        <p className="mt-4 text-sm text-green-700 font-medium">
          API key is set. You can use all CreatorIQ tools.
        </p>
      )}
    </div>
  );
}
