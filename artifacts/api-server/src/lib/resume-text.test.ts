import { describe, expect, it } from "vitest";
import {
  extractResumeText,
  ResumeTextExtractionError,
} from "./resume-text";

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createStoredZip(entries: Array<[string, string]>): Buffer {
  const localRecords: Buffer[] = [];
  const centralRecords: Buffer[] = [];
  let localOffset = 0;

  for (const [name, value] of entries) {
    const filename = Buffer.from(name);
    const content = Buffer.from(value);
    const checksum = crc32(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(filename.length, 26);
    localRecords.push(localHeader, filename, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(filename.length, 28);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralRecords.push(centralHeader, filename);

    localOffset += localHeader.length + filename.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralRecords);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);

  return Buffer.concat([...localRecords, centralDirectory, end]);
}

function createPdf(lines: string[]): Buffer {
  const escape = (text: string) => text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const content = [
    "BT",
    "/F1 12 Tf",
    "50 760 Td",
    ...lines.flatMap((line, index) => [
      ...(index ? ["0 -18 Td"] : []),
      `(${escape(line)}) Tj`,
    ]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];

  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(document, "latin1"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(document, "latin1");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(document, "latin1");
}

describe("resume text extraction", () => {
  it("extracts and normalizes plain-text resumes", async () => {
    const input =
      "Senior Engineer\r\nBuilt reliable TypeScript services for customer workflows.\u0000" +
      "\nLed deployment improvements and documented operational procedures.";

    const result = await extractResumeText(Buffer.from(input), "resume.txt");

    expect(result).toContain("Senior Engineer");
    expect(result).toContain("Built reliable TypeScript services");
    expect(result).not.toContain("\u0000");
  });

  it("extracts text from a PDF using pdftotext", async () => {
    const pdf = createPdf([
      "Ada Lovelace - Software Engineer",
      "Built TypeScript services and improved deployment reliability.",
      "Led an API migration and documented measurable production outcomes.",
    ]);

    const result = await extractResumeText(pdf, "resume.pdf");

    expect(result).toContain("Ada Lovelace");
    expect(result).toContain("API migration");
  });

  it("extracts paragraphs and XML entities from a DOCX archive", async () => {
    const documentXml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<w:document xmlns:w="urn:word"><w:body>' +
      "<w:p><w:r><w:t>Ada Lovelace - Software Engineer</w:t></w:r></w:p>" +
      "<w:p><w:r><w:t>Built TypeScript &amp; Node.js services for reliable workflows.</w:t></w:r></w:p>" +
      "<w:p><w:r><w:t>Led an API migration and documented production results.</w:t></w:r></w:p>" +
      "</w:body></w:document>";
    const docx = createStoredZip([["word/document.xml", documentXml]]);

    const result = await extractResumeText(docx, "resume.docx");

    expect(result).toContain("Ada Lovelace");
    expect(result).toContain("TypeScript & Node.js");
    expect(result).toContain("API migration");
  });

  it("returns a typed error for unsupported file types", async () => {
    await expect(
      extractResumeText(Buffer.from("resume content"), "resume.exe"),
    ).rejects.toMatchObject<Partial<ResumeTextExtractionError>>({
      name: "ResumeTextExtractionError",
      statusCode: 422,
    });
  });

  it("rejects documents without enough readable text", async () => {
    await expect(
      extractResumeText(Buffer.from("Too short"), "resume.txt"),
    ).rejects.toMatchObject({
      name: "ResumeTextExtractionError",
      statusCode: 422,
    });
  });
});
