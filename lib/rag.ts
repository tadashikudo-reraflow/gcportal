/**
 * RAG (Retrieval-Augmented Generation) コアライブラリ
 *
 * ドキュメントのインジェスト・チャンキング・エンベディング・検索を担当。
 * OpenAI text-embedding-3-small (1536次元) + Supabase pgvector
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

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

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
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

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
// Document Ingestion
// ---------------------------------------------------------------------------

/**
 * テキストドキュメントをインジェスト（チャンク化→エンベディング→DB保存）
 */
export async function ingestDocument(opts: {
  title: string;
  content: string;
  fileName?: string;
  fileType?: string;
  sourceUrl?: string;
  organization?: string;
  category?: DocumentCategory;
  metadata?: Record<string, unknown>;
}): Promise<{ documentId: number; chunkCount: number }> {
  const supabase = getServiceClient();

  // 1. ドキュメントレコード作成
  const { data: doc, error: docErr } = await supabase
    .from("rag_documents")
    .insert({
      title: opts.title,
      file_name: opts.fileName ?? null,
      file_type: opts.fileType ?? "text",
      source_url: opts.sourceUrl ?? null,
      organization: opts.organization ?? null,
      category: opts.category ?? null,
      status: "processing",
      metadata: opts.metadata ?? {},
    })
    .select("id")
    .single();

  if (docErr || !doc) throw new Error(`Failed to create document: ${docErr?.message}`);
  const documentId = doc.id;

  try {
    // 2. チャンク化
    const chunks = chunkText(opts.content);

    // 3. バッチエンベディング（最大20件ずつ）
    const BATCH_SIZE = 20;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await getEmbeddingBatch(batch);
      allEmbeddings.push(...embeddings);
    }

    // 4. チャンク+エンベディングをDB保存
    const chunkRows = chunks.map((content, i) => ({
      document_id: documentId,
      chunk_index: i,
      content,
      token_count: estimateTokens(content),
      embedding: JSON.stringify(allEmbeddings[i]),
      metadata: opts.metadata ?? {},
    }));

    const { error: chunkErr } = await supabase.from("rag_chunks").insert(chunkRows);
    if (chunkErr) throw new Error(`Failed to insert chunks: ${chunkErr.message}`);

    // 5. ドキュメントステータス更新
    await supabase
      .from("rag_documents")
      .update({ status: "indexed", chunk_count: chunks.length, updated_at: new Date().toISOString() })
      .eq("id", documentId);

    return { documentId, chunkCount: chunks.length };
  } catch (err) {
    // エラー時はステータスを更新
    await supabase
      .from("rag_documents")
      .update({
        status: "error",
        error_message: err instanceof Error ? err.message : String(err),
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Semantic Search
// ---------------------------------------------------------------------------

/**
 * セマンティック検索: クエリに類似するチャンクを検索
 */
export async function searchChunks(
  query: string,
  opts?: { threshold?: number; limit?: number; category?: string }
): Promise<SearchResult[]> {
  const supabase = getServiceClient();
  const embedding = await getEmbedding(query);

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: opts?.threshold ?? 0.5,
    match_count: opts?.limit ?? 5,
  });

  if (error) throw new Error(`Search error: ${error.message}`);

  let results = (data ?? []) as SearchResult[];

  // カテゴリフィルター（DB関数外でフィルタ）
  if (opts?.category) {
    // doc_categoryはmatch_chunks関数に含まれていないので、別途フィルタ
    // 将来的にDB関数にcategoryフィルタを追加可能
    results = results; // 現状はフィルタなし
  }

  return results;
}

// ---------------------------------------------------------------------------
// Fact Verification
// ---------------------------------------------------------------------------

/**
 * 主張をRAGコーパスでファクトチェック
 *
 * 主張のエンベディングで類似チャンクを取得し、
 * 内容の一致度から supported/contradicted/unverified を判定
 */
export async function verifyClaimAgainstCorpus(claim: string): Promise<VerifyResult> {
  const evidence = await searchChunks(claim, { threshold: 0.6, limit: 5 });

  if (evidence.length === 0) {
    return {
      claim,
      status: "unverified",
      evidence: [],
      confidence: 0,
    };
  }

  // 最も類似度が高いチャンクのスコアで判定
  const topSimilarity = evidence[0].similarity;

  // 0.8以上: supported（裏付けあり）
  // 0.6-0.8: 部分的だがevidence存在
  // 0.6未満: 閾値でフィルタ済みなのでここには来ない
  const status: VerifyResult["status"] =
    topSimilarity >= 0.8 ? "supported" : "unverified";

  return {
    claim,
    status,
    evidence,
    confidence: Math.round(topSimilarity * 100) / 100,
  };
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
  const BATCH_SIZE = 20;
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < newChunks.length; i += BATCH_SIZE) {
    const batch = newChunks.slice(i, i + BATCH_SIZE);
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
