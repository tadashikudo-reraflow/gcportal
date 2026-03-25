/**
 * RAG (Retrieval-Augmented Generation) コアライブラリ
 *
 * ドキュメントのインジェスト・チャンキング・エンベディング・検索を担当。
 * OpenAI text-embedding-3-small (1536次元) + Supabase pgvector
 *
 * ⚠️  DEPRECATED for batch ingestion (ADR 2026-03-24)
 * -------------------------------------------------------
 * RAGデータ投入は Oracle 23ai (`~/workspace/pj/digital-go-jp-rag/`) に一本化済み。
 * `ingestDocument` / `ingestChunk` はスクリプト・バッチから呼ばない。
 * このファイルの用途: サイト検索UI・API Route (`/api/rag/*`) のみ。
 * 新規データソース追加 → `digital-go-jp-rag/02x_ingest_*.py` を作成すること。
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentStatus = "pending" | "processing" | "indexed" | "error";
export type DocumentCategory = "official" | "report" | "article" | "regulation";

export type RagDocument = {
  id: number;
  title: string;
  file_name: string | null;
  file_type: string | null;
  source_url: string | null;
  organization: string | null;
  category: string | null;
  status: DocumentStatus;
  chunk_count: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RagChunk = {
  id: number;
  document_id: number;
  chunk_index: number;
  content: string;
  token_count: number | null;
  metadata: Record<string, unknown>;
};

export type SearchResult = {
  id: number;
  document_id: number;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
  doc_title: string;
  doc_organization: string | null;
  doc_source_url: string | null;
};

export type SearchResultV2 = SearchResult & {
  doc_category: string | null;
  doc_created_at: string | null;
};

export type DocumentStats = {
  category: string | null;
  organization: string | null;
  count: number;
};

export type VerifyResult = {
  claim: string;
  status: "supported" | "contradicted" | "unverified";
  evidence: SearchResult[];
  confidence: number;
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 500;       // トークン（概算: 1トークン ≈ 文字数の1/1.5で日本語）
const CHUNK_OVERLAP = 50;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

// ---------------------------------------------------------------------------
// Supabase Client (service_role for write operations)
// ---------------------------------------------------------------------------

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars for RAG");
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

/** 指数バックオフで OpenAI Embedding API を呼ぶ共通ヘルパー */
async function fetchEmbeddingWithBackoff(
  apiKey: string,
  input: string | string[]
): Promise<Response> {
  const MAX_RETRIES = 4;
  let delay = 3000; // 3s → 6s → 12s → 24s

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (res.status !== 429) return res;

    if (attempt === MAX_RETRIES) return res; // 最終試行後は呼び出し側でエラー処理

    // Retry-After ヘッダーを優先、なければ指数バックオフ
    const retryAfter = res.headers.get("retry-after");
    const waitMs = retryAfter ? Number(retryAfter) * 1000 : delay;
    await new Promise((r) => setTimeout(r, waitMs));
    delay *= 2;
  }

  // 到達しないが TypeScript 対策
  throw new Error("Unexpected exit from retry loop");
}

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const res = await fetchEmbeddingWithBackoff(apiKey, text);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding error: ${res.status} ${err}`);
  }

  const json = await res.json();
  return json.data[0].embedding;
}

async function getEmbeddingBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  // OpenAI supports batch embedding natively
  const res = await fetchEmbeddingWithBackoff(apiKey, texts);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embedding batch error: ${res.status} ${err}`);
  }

  const json = await res.json();
  return json.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((d: { embedding: number[] }) => d.embedding);
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/** 日本語テキストの概算トークン数 */
function estimateTokens(text: string): number {
  // 日本語は大体1文字≈1.5トークン、英語は1単語≈1.3トークン
  const jpChars = (text.match(/[\u3000-\u9fff\uff00-\uffef]/g) || []).length;
  const enWords = text.replace(/[\u3000-\u9fff\uff00-\uffef]/g, "").split(/\s+/).filter(Boolean).length;
  return Math.ceil(jpChars * 1.5 + enWords * 1.3);
}

/** テキストをチャンクに分割 */
export function chunkText(
  text: string,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
): string[] {
  // 段落・改行で分割してから結合
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  const chunks: string[] = [];
  let current = "";
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);

    // 単一段落がチャンクサイズを超える場合は文単位で分割
    if (paraTokens > chunkSize) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
        currentTokens = 0;
      }
      const sentences = para.split(/(?<=[。！？\.\!\?])\s*/);
      for (const sent of sentences) {
        const sentTokens = estimateTokens(sent);
        if (currentTokens + sentTokens > chunkSize && current.trim()) {
          chunks.push(current.trim());
          // overlap: 末尾の文を保持
          const overlapText = current.split(/(?<=[。！？\.\!\?])\s*/).slice(-2).join("");
          current = estimateTokens(overlapText) <= overlap * 3 ? overlapText + "\n" + sent : sent;
          currentTokens = estimateTokens(current);
        } else {
          current += (current ? "\n" : "") + sent;
          currentTokens += sentTokens;
        }
      }
      continue;
    }

    if (currentTokens + paraTokens > chunkSize && current.trim()) {
      chunks.push(current.trim());
      // overlap: 最後の段落を保持
      const overlapTokens = estimateTokens(paragraphs[paragraphs.indexOf(para) - 1] || "");
      if (overlapTokens <= overlap * 3) {
        current = (paragraphs[paragraphs.indexOf(para) - 1] || "") + "\n\n" + para;
      } else {
        current = para;
      }
      currentTokens = estimateTokens(current);
    } else {
      current += (current ? "\n\n" : "") + para;
      currentTokens += paraTokens;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ---------------------------------------------------------------------------
// Semantic Search
// ---------------------------------------------------------------------------

/**
 * セマンティック検索 V2: カテゴリ・組織フィルタ + ドキュメントメタデータ付き
 */
export async function searchChunksV2(
  query: string,
  opts?: {
    threshold?: number;
    limit?: number;
    category?: string;
    organization?: string;
  }
): Promise<SearchResultV2[]> {
  const supabase = getServiceClient();
  const embedding = await getEmbedding(query);

  const { data, error } = await supabase.rpc("match_chunks_v2", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: opts?.threshold ?? 0.5,
    match_count: opts?.limit ?? 5,
    filter_category: opts?.category ?? null,
    filter_organization: opts?.organization ?? null,
  });

  if (error) throw new Error(`Search V2 error: ${error.message}`);

  return (data ?? []) as SearchResultV2[];
}

/**
 * ドキュメント統計: カテゴリ・組織別のドキュメント数を取得
 */
export async function getDocumentStats(): Promise<DocumentStats[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("rag_documents")
    .select("category, organization")
    .eq("status", "indexed");

  if (error) throw new Error(`Failed to get document stats: ${error.message}`);

  // カテゴリ×組織でグルーピング
  const counts = new Map<string, DocumentStats>();
  for (const row of data ?? []) {
    const key = `${row.category ?? "null"}::${row.organization ?? "null"}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, {
        category: row.category ?? null,
        organization: row.organization ?? null,
        count: 1,
      });
    }
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Document Management
// ---------------------------------------------------------------------------

/** ドキュメント一覧取得 */
export async function listDocuments(): Promise<RagDocument[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("rag_documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list documents: ${error.message}`);
  return (data ?? []) as RagDocument[];
}

/** ドキュメント削除（カスケードでチャンクも削除） */
export async function deleteDocument(id: number): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.from("rag_documents").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete document: ${error.message}`);
}

/** ドキュメントを再インデックス */
export async function reindexDocument(id: number): Promise<{ chunkCount: number }> {
  const supabase = getServiceClient();

  // 既存チャンクのテキストを取得
  const { data: chunks } = await supabase
    .from("rag_chunks")
    .select("content")
    .eq("document_id", id)
    .order("chunk_index");

  if (!chunks || chunks.length === 0) throw new Error("No chunks found for reindex");

  // 既存チャンク削除
  await supabase.from("rag_chunks").delete().eq("document_id", id);

  // 全テキストを結合して再チャンク化
  const fullText = chunks.map((c) => c.content).join("\n\n");
  const newChunks = chunkText(fullText);

  // 再エンベディング
  const MAX_CHUNK_CHARS = 5500;
  const BATCH_SIZE = 20;
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < newChunks.length; i += BATCH_SIZE) {
    const batch = newChunks.slice(i, i + BATCH_SIZE).map((c) =>
      c.length > MAX_CHUNK_CHARS ? c.slice(0, MAX_CHUNK_CHARS) : c
    );
    const embeddings = await getEmbeddingBatch(batch);
    allEmbeddings.push(...embeddings);
  }

  // 再保存
  const chunkRows = newChunks.map((content, i) => ({
    document_id: id,
    chunk_index: i,
    content,
    token_count: estimateTokens(content),
    embedding: JSON.stringify(allEmbeddings[i]),
    metadata: {},
  }));

  await supabase.from("rag_chunks").insert(chunkRows);
  await supabase
    .from("rag_documents")
    .update({ chunk_count: newChunks.length, status: "indexed", updated_at: new Date().toISOString() })
    .eq("id", id);

  return { chunkCount: newChunks.length };
}
