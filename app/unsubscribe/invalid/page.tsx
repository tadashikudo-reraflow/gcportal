import { AlertCircle } from "lucide-react";

export default function UnsubscribeInvalidPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-sm text-center">
        <div className="mb-6">
          <AlertCircle className="mx-auto text-red-400" size={48} aria-hidden="true" />
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
