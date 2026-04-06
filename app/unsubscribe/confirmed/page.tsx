import { CheckCircle } from "lucide-react";

export default function UnsubscribeConfirmedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-sm text-center">
        <div className="mb-6">
          <CheckCircle className="mx-auto text-green-500" size={48} aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          配信停止が完了しました
        </h1>
        <p className="text-gray-600 text-sm">
          今後このアドレスへのメール送信は停止されます。
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
