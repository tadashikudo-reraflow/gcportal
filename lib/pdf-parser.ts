import type { DocumentInitParameters, PDFDocumentProxy, TextItem } from "pdfjs-dist/types/src/display/api";

/**
 * PDF parser for GCInsight data collection pipeline.
 * Uses pdfjs-dist with CMap support for Japanese PDFs.
 * Designed for Node.js server-side usage (not Edge runtime).
 */

export interface PdfParseResult {
  text: string;
  pages: number;
  metadata: {
    title: string | null;
    author: string | null;
    creationDate: string | null;
    producer: string | null;
  };
}

/**
 * Parse a PDF buffer and extract text content with metadata.
 * Handles Japanese PDFs via CMap support.
 */
export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  // Dynamic import for Node.js server environment
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Disable worker for server-side / CLI usage
  // For pdfjs-dist v5+, point to the actual worker file to avoid fake worker error
  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

  const data = new Uint8Array(buffer);

  const loadingParams: DocumentInitParameters = {
    data,
    // CMap support for Japanese characters
    cMapUrl: "node_modules/pdfjs-dist/cmaps/",
    cMapPacked: true,
    // Standard font data
    standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/",
    // Disable range requests for buffer input
    disableAutoFetch: true,
    disableStream: true,
  };

  const doc: PDFDocumentProxy = await pdfjsLib.getDocument(loadingParams).promise;

  // Extract metadata
  const meta = await doc.getMetadata();
  const info = (meta?.info ?? {}) as Record<string, unknown>;

  const metadata: PdfParseResult["metadata"] = {
    title: typeof info.Title === "string" ? info.Title : null,
    author: typeof info.Author === "string" ? info.Author : null,
    creationDate: typeof info.CreationDate === "string" ? info.CreationDate : null,
    producer: typeof info.Producer === "string" ? info.Producer : null,
  };

  // Extract text page by page
  const pageTexts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Group text items by y-position to preserve table structure
    const lines = groupTextItemsByLine(
      content.items.filter((item): item is TextItem => "str" in item)
    );

    pageTexts.push(lines.join("\n"));
  }

  return {
    text: pageTexts.join("\n\n"),
    pages: doc.numPages,
    metadata,
  };
}

/**
 * Group text items by their vertical position to reconstruct lines.
 * This helps preserve table structure in the extracted text.
 */
function groupTextItemsByLine(items: TextItem[]): string[] {
  if (items.length === 0) return [];

  // Group items by y-coordinate (with tolerance for slight variations)
  const LINE_TOLERANCE = 2;
  const lineMap = new Map<number, TextItem[]>();

  for (const item of items) {
    const y = Math.round(item.transform[5] / LINE_TOLERANCE) * LINE_TOLERANCE;
    const existing = lineMap.get(y);
    if (existing) {
      existing.push(item);
    } else {
      lineMap.set(y, [item]);
    }
  }

  // Sort lines by y-position (top to bottom = descending y)
  const sortedKeys = Array.from(lineMap.keys()).sort((a, b) => b - a);

  return sortedKeys.map((y) => {
    const lineItems = lineMap.get(y)!;
    // Sort items within a line by x-position (left to right)
    lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

    // Join items with appropriate spacing
    let line = "";
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (i > 0) {
        const prevItem = lineItems[i - 1];
        const prevEnd = prevItem.transform[4] + prevItem.width;
        const gap = item.transform[4] - prevEnd;
        // Insert tab for large gaps (table columns), space for small gaps
        if (gap > 10) {
          line += "\t";
        } else if (gap > 2) {
          line += " ";
        }
      }
      line += item.str;
    }
    return line;
  });
}
