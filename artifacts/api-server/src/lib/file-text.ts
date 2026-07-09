import * as XLSX from "xlsx";

/**
 * Extracts plain text content from an uploaded file buffer. Supports Excel
 * workbooks (converted to a readable text table per sheet) and plain
 * text/markdown exports (e.g. Notion page exports).
 */
export function extractTextFromFile(params: {
  buffer: Buffer;
  filename: string;
}): string {
  const lower = params.filename.toLowerCase();
  const isExcel =
    lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv");

  if (isExcel) {
    const workbook = XLSX.read(params.buffer, { type: "buffer" });
    const sections = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = sheet ? XLSX.utils.sheet_to_csv(sheet) : "";
      return `# Sheet: ${sheetName}\n${csv}`;
    });
    return sections.join("\n\n");
  }

  return params.buffer.toString("utf-8");
}
