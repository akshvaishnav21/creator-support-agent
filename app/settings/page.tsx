import ApiKeySettings from "@/components/ApiKeySettings";

export const metadata = {
  title: "Settings | CreatorIQ",
  description: "Configure your Gemini API key",
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <ApiKeySettings />
    </main>
  );
}
