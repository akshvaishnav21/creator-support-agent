import Link from "next/link";

const tools = [
  {
    href: "/sponsorship",
    icon: "🤝",
    title: "Sponsorship Fit Analyzer",
    desc: "Paste a transcript and comments to discover which brands are the best fit for your audience — with pitch angles included.",
    cta: "Analyze",
  },
  {
    href: "/comments",
    icon: "💬",
    title: "Comment Intelligence",
    desc: "Turn your comment section into structured insights: topic clusters, sentiment, complaints, and future video ideas.",
    cta: "Analyze",
  },
  {
    href: "/titles",
    icon: "✍️",
    title: "Hook & Title Factory",
    desc: "Generate 15 high-converting title and hook variations grouped by psychological principle — curiosity gap, listicle, story, and more.",
    cta: "Generate",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          CreatorIQ
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          AI-powered tools for YouTube creators — powered by your own Gemini key.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          No subscriptions. No data stored. Just your ideas and AI.
        </p>
      </div>

      {/* Tool Cards */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {tool.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {tool.desc}
              </p>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {tool.cta} →
              </span>
            </Link>
          ))}
        </div>

        {/* Setup prompt */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            First time?{" "}
            <Link href="/settings" className="font-semibold underline hover:text-yellow-900 dark:hover:text-yellow-200">
              Add your free Gemini API key
            </Link>{" "}
            to get started — it takes 30 seconds.
          </p>
        </div>

        {/* Chrome Extension callout */}
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Chrome Extension available!</span> Import YouTube
            transcripts and comments with one click.{" "}
            <span className="text-blue-600 dark:text-blue-400 font-medium">Load the /extension folder as an unpacked extension.</span>
          </p>
        </div>
      </div>
    </main>
  );
}
