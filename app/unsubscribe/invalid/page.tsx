export default function UnsubscribeInvalidPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-sm text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M12 5a7 7 0 100 14A7 7 0 0012 5z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          リンクが無効または期限切れです
        </h1>
        <p className="text-gray-600 text-sm">
          配信停止リンクが正しくないか、すでに処理済みです。
        </p>
        <p className="mt-6">
          <a
            href="https://gcinsight.jp"
            className="text-sm text-blue-600 hover:underline"
          >
            GCInsight トップへ戻る
          </a>
        </p>
      </div>
    </main>
  );
}
