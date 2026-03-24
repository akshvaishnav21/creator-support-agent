"use client";

import { useState } from "react";
import ApiKeyGate from "@/components/ApiKeyGate";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const apiKey = localStorage.getItem("creatoriq_gemini_key");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, apiKey }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? data.error ?? "No response." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)] max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Creator Chat</h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-8">
            Ask me anything about growing your YouTube channel!
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-prose ${
              msg.role === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 p-3 rounded-lg">Thinking...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your channel..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function ChatInterface() {
  return (
    <ApiKeyGate>
      <Chat />
    </ApiKeyGate>
  );
}
