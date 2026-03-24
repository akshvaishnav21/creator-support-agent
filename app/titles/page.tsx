import { Suspense } from "react";
import TitleFactory from "@/components/TitleFactory";

export const metadata = {
  title: "Hook & Title Factory | CreatorIQ",
  description: "Generate high-converting YouTube title and hook variations",
};

export default function TitlesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <Suspense>
        <TitleFactory />
      </Suspense>
    </main>
  );
}
