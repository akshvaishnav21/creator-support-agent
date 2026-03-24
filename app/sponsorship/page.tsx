import { Suspense } from "react";
import SponsorshipAnalyzer from "@/components/SponsorshipAnalyzer";

export const metadata = {
  title: "Sponsorship Fit Analyzer | CreatorIQ",
  description: "Find the best brand sponsorships for your YouTube channel",
};

export default function SponsorshipPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <Suspense>
        <SponsorshipAnalyzer />
      </Suspense>
    </main>
  );
}
