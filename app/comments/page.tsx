import { Suspense } from "react";
import CommentIntelligence from "@/components/CommentIntelligence";

export const metadata = {
  title: "Comment Intelligence | CreatorIQ",
  description: "Turn your YouTube comments into audience insights and video ideas",
};

export default function CommentsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <Suspense>
        <CommentIntelligence />
      </Suspense>
    </main>
  );
}
