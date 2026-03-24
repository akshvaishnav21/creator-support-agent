import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          CreatorIQ
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          AI-powered tools for YouTube creators — powered by your own Gemini key.
        </p>
        <p className="text-sm text-gray-500">
          No subscriptions. No data stored. Just your ideas and AI.
        </p>
      </div>

      {/* Tool Cards */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/sponsorship" className="group block bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">🤝</div>
            <h2 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600">
              Sponsorship Fit Analyzer
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Paste a transcript and comments to discover which brands are the
              best fit for your audience — with pitch angles included.
            </p>
            <span className="text-sm font-medium text-blue-600">
              Analyze →
            </span>
          </Link>

          <Link href="/comments" className="group block bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">💬</div>
            <h2 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600">
              Comment Intelligence
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Turn your comment section into structured insights: topic clusters,
              sentiment, complaints, and future video ideas.
            </p>
            <span className="text-sm font-medium text-blue-600">
              Analyze →
            </span>
          </Link>

          <Link href="/titles" className="group block bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="text-3xl mb-3">✍️</div>
            <h2 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600">
              Hook &amp; Title Factory
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate 15 high-converting title and hook variations grouped by
              psychological principle — curiosity gap, listicle, story, and more.
            </p>
            <span className="text-sm font-medium text-blue-600">
              Generate →
            </span>
          </Link>
        </div>

        {/* Setup prompt */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-800">
            First time?{" "}
            <Link href="/settings" className="font-semibold underline hover:text-yellow-900">
              Add your free Gemini API key
            </Link>{" "}
            to get started — it takes 30 seconds.
          </p>
        </div>

        {/* Chrome Extension callout */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Chrome Extension available!</span> Import YouTube
            transcripts and comments with one click.{" "}
            <span className="text-blue-600 font-medium">Load the /extension folder as an unpacked extension.</span>
          </p>
        </div>
      </div>
    </main>
  );
}
