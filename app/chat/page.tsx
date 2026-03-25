import { Suspense } from "react";
import ChatInterface from "@/components/ChatInterface";

export const metadata = {
  title: "Creator Chat | CreatorIQ",
  description: "Chat with an AI assistant about YouTube content strategy",
};

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Suspense>
        <ChatInterface />
      </Suspense>
    </main>
  );
}
