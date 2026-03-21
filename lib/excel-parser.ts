import * as XLSX from "xlsx";

/**
 * Excel parser for GCInsight data collection pipeline.
 * Uses SheetJS (xlsx) for .xlsx/.xls/.csv parsing.
 * Handles Japanese column names properly.
 */

export interface SheetData {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface ExcelParseResult {
  sheets: SheetData[];
  summary: string;
}

/**
 * Parse an Excel buffer and extract all sheets as structured data.
 * Headers are detected from the first row of each sheet.
 */
export async function parseExcel(buffer: Buffer): Promise<ExcelParseResult> {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    codepage: 65001, // UTF-8 for Japanese
    cellDates: true,
    cellNF: true,
  });

  const sheets: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = extractSheetData(workbook, sheetName);
    sheets.push(sheet);
  }

  const summary = sheets
    .map((s) => `${s.name}: ${s.rowCount} rows, ${s.headers.length} columns`)
    .join("; ");

  return { sheets, summary };
}

/**
 * Parse a single sheet from an Excel buffer by sheet name.
 * Throws if the sheet name is not found.
 */
export async function parseExcelSheet(
  buffer: Buffer,
  sheetName: string
): Promise<SheetData> {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    codepage: 65001,
    cellDates: true,
    cellNF: true,
  });

  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(
      `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
    );
  }

  return extractSheetData(workbook, sheetName);
}

/**
 * Extract structured data from a single worksheet.
 */
function extractSheetData(workbook: XLSX.WorkBook, sheetName: string): SheetData {
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of arrays to detect headers
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
    rawNumbers: false,
  });

  if (rawData.length === 0) {
    return { name: sheetName, headers: [], rows: [], rowCount: 0 };
  }

  // First row as headers - convert to strings, handle empty headers
  const headers = (rawData[0] ?? []).map((h, i) => {
    if (h === null || h === undefined || String(h).trim() === "") {
      return `column_${i + 1}`;
    }
    return String(h).trim();
  });

  // Remaining rows as objects keyed by headers
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const record: Record<string, unknown> = {};
    let hasValue = false;

    for (let j = 0; j < headers.length; j++) {
      const value = j < row.length ? row[j] : null;
      record[headers[j]] = value;
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        hasValue = true;
      }
    }

    // Skip completely empty rows
    if (hasValue) {
      rows.push(record);
    }
  }

  return {
    name: sheetName,
    headers,
    rows,
    rowCount: rows.length,
  };
}
