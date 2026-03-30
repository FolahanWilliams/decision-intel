import mammoth from 'mammoth';
import { extractText } from 'unpdf';
import Papa from 'papaparse';
import { convert as htmlToText } from 'html-to-text';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('FileParser');

/**
 * Parses the content of a file buffer based on its MIME type or filename extension.
 * Supports PDF, DOCX, XLSX, CSV, HTML, PPTX, and Plain Text.
 * Throws an error for legacy DOC files.
 */
export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const lowerFilename = filename.toLowerCase();
  const isPdf = mimeType === 'application/pdf' || lowerFilename.endsWith('.pdf');
  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerFilename.endsWith('.docx');
  const isDoc = mimeType === 'application/msword' || lowerFilename.endsWith('.doc');
  const isCsv =
    mimeType === 'text/csv' || mimeType === 'application/csv' || lowerFilename.endsWith('.csv');
  const isHtml =
    mimeType === 'text/html' || lowerFilename.endsWith('.html') || lowerFilename.endsWith('.htm');
  const isPptx =
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    lowerFilename.endsWith('.pptx');
  const isXlsx =
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    lowerFilename.endsWith('.xlsx');

  if (isPdf) {
    try {
      const { text } = await extractText(new Uint8Array(buffer));
      return Array.isArray(text) ? text.join('\n') : text;
    } catch (error) {
      throw new Error(
        `Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value.trim()) {
        log.warn(
          `DOCX parsing yielded empty text for ${filename}. Messages: ${JSON.stringify(result.messages)}`
        );
      }
      return result.value;
    } catch (error) {
      throw new Error(
        `Failed to parse DOCX: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (isCsv) {
    try {
      const csvText = buffer.toString('utf-8');
      const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      if (!result.data || result.data.length === 0) {
        return csvText;
      }
      const headers = result.meta.fields || [];
      const rows = (result.data as Record<string, string>[]).map(row =>
        headers.map(h => row[h] ?? '').join('\t')
      );
      return [headers.join('\t'), ...rows].join('\n');
    } catch (error) {
      throw new Error(
        `Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (isHtml) {
    try {
      const html = buffer.toString('utf-8');
      return htmlToText(html, { wordwrap: false });
    } catch (error) {
      throw new Error(
        `Failed to parse HTML: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (isPptx) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const slides: { index: number; text: string }[] = [];
      for (const [path, file] of Object.entries(zip.files)) {
        const match = path.match(/^ppt\/slides\/slide(\d+)\.xml$/);
        if (match && file) {
          const xml = await file.async('text');
          const texts: string[] = [];
          // Extract text from <a:t> tags (OOXML text nodes)
          const regex = /<a:t>([\s\S]*?)<\/a:t>/g;
          let m;
          while ((m = regex.exec(xml)) !== null) {
            if (m[1].trim()) texts.push(m[1]);
          }
          slides.push({ index: parseInt(match[1], 10), text: texts.join(' ') });
        }
      }
      slides.sort((a, b) => a.index - b.index);
      if (slides.length === 0) {
        log.warn(`PPTX contains no extractable slide text: ${filename}`);
        return '';
      }
      return slides.map(s => `--- Slide ${s.index} ---\n${s.text}`).join('\n\n');
    } catch (error) {
      throw new Error(
        `Failed to parse PPTX: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (isXlsx) {
    try {
      const workbook = new ExcelJS.Workbook();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
      const sheetTexts: string[] = [];
      workbook.eachSheet(sheet => {
        const rows: string[] = [];
        rows.push(`--- ${sheet.name} ---`);
        sheet.eachRow(row => {
          const values = (row.values as (string | number | null)[]).slice(1); // ExcelJS row.values is 1-indexed
          rows.push(values.map(v => (v != null ? String(v) : '')).join('\t'));
        });
        sheetTexts.push(rows.join('\n'));
      });
      if (sheetTexts.length === 0) {
        log.warn(`XLSX contains no extractable data: ${filename}`);
        return '';
      }
      return sheetTexts.join('\n\n');
    } catch (error) {
      throw new Error(
        `Failed to parse XLSX: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (isDoc) {
    throw new Error(
      'Legacy Word Documents (DOC) are not supported. Please convert to DOCX or PDF.'
    );
  }

  // Default to plain text
  return buffer.toString('utf-8');
}
