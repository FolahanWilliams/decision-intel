import mammoth from 'mammoth';
import { extractText } from 'unpdf';
import Papa from 'papaparse';
import { convert as htmlToText } from 'html-to-text';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { createLogger } from '@/lib/utils/logger';
import {
  extractSynergyStructure,
  formatSynergyStructureForAudit,
  toParsedStructuredData,
  type ParsedSynergyModelData,
} from '@/lib/parsers/synergy-model-parser';
import {
  extractQofeStructure,
  formatQofeAssessmentForAudit,
  type ParsedQofeData,
} from '@/lib/parsers/qofe-parser';
import {
  scoreMeetingTranscript,
  toParsedMeetingTranscriptData,
  formatMeetingTranscriptForAudit,
  type ParsedMeetingTranscriptData,
} from '@/lib/parsers/meeting-transcript-parser';

const log = createLogger('FileParser');

/**
 * Parses the content of a file buffer based on its MIME type or filename extension.
 * Supports PDF, DOCX, XLSX, CSV, HTML, PPTX, and Plain Text.
 * Throws an error for legacy DOC files.
 *
 * The optional `documentType` parameter enables type-aware enrichment of the
 * parsed output. Currently used for `synergy_model` uploads (locked 2026-05-09):
 * when an .xlsx is uploaded as a synergy_model, the parser embeds a structured
 * STRUCTURED_SYNERGY_MODEL block ABOVE the flattened sheet text so downstream
 * audit nodes (structurer, biasDetective) see per-claim defensibility data
 * (mechanism / owner / milestone presence + base-rate realisation gap) without
 * needing a new state field on the audit graph. When documentType is omitted
 * or doesn't match the enrichment trigger, parseFile behaves exactly as
 * before — pure text extraction.
 */
export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  documentType?: string
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
      const flattenedText = Array.isArray(text) ? text.join('\n') : text;

      // QofE enrichment (locked 2026-05-09 evening — qofe parser ship).
      // When the upload was explicitly typed as qofe, run the QofE
      // defensibility scorer over the extracted PDF text and prepend a
      // procurement-grade structured block above the flattened content.
      // Mirrors the synergy_model XLSX enrichment pattern below — the
      // structured block is human-readable, no JSON markers in the audit
      // path. Failure is non-fatal; we fall through to flat text only.
      if (documentType === 'qofe') {
        try {
          const parsed = extractQofeStructure(flattenedText);
          if (parsed) {
            const block = formatQofeAssessmentForAudit(parsed);
            log.info(
              `qofe enrichment: ${parsed.assessment.redFlags.length} red flag(s) · severity=${parsed.assessment.portfolioSeverity} · commission=${parsed.assessment.commissionedBy ?? 'unknown'}`
            );
            return `${block}\n\n${flattenedText}`;
          }
          log.info(`qofe enrichment: text too short / no signal, falling through to flat text`);
        } catch (err) {
          log.warn(`qofe enrichment failed (using flat text): ${String(err)}`);
        }
      }
      return flattenedText;
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

      // Meeting transcript enrichment (locked 2026-05-10 — meetings →
      // document type cascade). When the upload was explicitly typed as
      // meeting_transcript / meeting_minutes AND we have speaker turns,
      // run the transcript parser and prepend the structured block.
      // Mirrors the qofe + synergy_model enrichment pattern.
      if (documentType === 'meeting_transcript' || documentType === 'meeting_minutes') {
        try {
          const assessment = scoreMeetingTranscript(result.value);
          if (assessment.hasSpeakerMarkers) {
            const wrapped = toParsedMeetingTranscriptData(assessment, result.value.length);
            const block = formatMeetingTranscriptForAudit(wrapped);
            log.info(
              `meeting-transcript enrichment: ${assessment.totalTurns} turns · ${assessment.speakers.length} speakers · dominance=${assessment.dominanceFlag} · ${assessment.hedgingHits.length} hedging hits`
            );
            return `${block}\n\n${result.value}`;
          }
          log.info(
            `meeting-transcript enrichment: no speaker markers detected, falling through to flat text`
          );
        } catch (err) {
          log.warn(`meeting-transcript enrichment failed (using flat text): ${String(err)}`);
        }
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
      const extractTextNodes = (xml: string): string[] => {
        const texts: string[] = [];
        const regex = /<a:t>([\s\S]*?)<\/a:t>/g;
        let m;
        while ((m = regex.exec(xml)) !== null) {
          if (m[1].trim()) texts.push(m[1]);
        }
        return texts;
      };

      type Slide = { index: number; text: string; notes: string };
      const slidesByIndex = new Map<number, Slide>();

      for (const [path, file] of Object.entries(zip.files)) {
        const slideMatch = path.match(/^ppt\/slides\/slide(\d+)\.xml$/);
        if (slideMatch && file) {
          const xml = await file.async('text');
          const idx = parseInt(slideMatch[1], 10);
          const existing = slidesByIndex.get(idx) ?? { index: idx, text: '', notes: '' };
          existing.text = extractTextNodes(xml).join(' ');
          slidesByIndex.set(idx, existing);
          continue;
        }

        // Speaker notes often carry the actual argument behind a deck —
        // the narrative the presenter will say out loud. For board decks
        // this is frequently where the decision logic lives, so include
        // them in the extracted content rather than dropping them.
        const notesMatch = path.match(/^ppt\/notesSlides\/notesSlide(\d+)\.xml$/);
        if (notesMatch && file) {
          const xml = await file.async('text');
          const idx = parseInt(notesMatch[1], 10);
          const existing = slidesByIndex.get(idx) ?? { index: idx, text: '', notes: '' };
          existing.notes = extractTextNodes(xml).join(' ');
          slidesByIndex.set(idx, existing);
        }
      }

      const slides = Array.from(slidesByIndex.values()).sort((a, b) => a.index - b.index);
      if (slides.length === 0) {
        log.warn(`PPTX contains no extractable slide text: ${filename}`);
        return '';
      }

      return slides
        .map(s => {
          const body = s.text || '(no slide text)';
          const notesSection = s.notes?.trim() ? `\n[Speaker notes] ${s.notes}` : '';
          return `--- Slide ${s.index} ---\n${body}${notesSection}`;
        })
        .join('\n\n');
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
      const flattenedText = sheetTexts.join('\n\n');

      // Synergy-model enrichment (locked 2026-05-09). When the upload was
      // explicitly typed as synergy_model, run the synergy-model parser to
      // extract per-claim defensibility data and prepend it to the
      // flattened text. The structured block is human-readable (no JSON
      // markers in the audit's reading path) so the structurer + bias-
      // detective see it as procurement-grade context. Failure to extract
      // is non-fatal — fall through to flattened text only.
      if (documentType === 'synergy_model') {
        try {
          const structure = extractSynergyStructure(workbook);
          if (structure.detected) {
            const block = formatSynergyStructureForAudit(structure);
            log.info(
              `synergy-model enrichment: ${structure.claims.length} claims · confidence=${structure.confidence}`
            );
            return `${block}\n${flattenedText}`;
          }
          log.info(`synergy-model enrichment: no claims detected, falling through to flat text`);
        } catch (err) {
          log.warn(`synergy-model enrichment failed (using flat text): ${String(err)}`);
        }
      }
      return flattenedText;
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

  // Default to plain text — with meeting-transcript enrichment when the
  // upload is typed as a meeting transcript / minutes (locked 2026-05-10).
  // Transcripts are most commonly pasted as plain text from upstream
  // transcription tools (Otter, Fireflies, AssemblyAI export, etc.).
  const plainText = buffer.toString('utf-8');
  if (documentType === 'meeting_transcript' || documentType === 'meeting_minutes') {
    try {
      const assessment = scoreMeetingTranscript(plainText);
      if (assessment.hasSpeakerMarkers) {
        const wrapped = toParsedMeetingTranscriptData(assessment, plainText.length);
        const block = formatMeetingTranscriptForAudit(wrapped);
        log.info(
          `meeting-transcript enrichment (text): ${assessment.totalTurns} turns · ${assessment.speakers.length} speakers · dominance=${assessment.dominanceFlag} · ${assessment.hedgingHits.length} hedging hits`
        );
        return `${block}\n\n${plainText}`;
      }
      log.info(
        `meeting-transcript enrichment (text): no speaker markers detected, falling through to flat text`
      );
    } catch (err) {
      log.warn(`meeting-transcript enrichment (text) failed (using flat text): ${String(err)}`);
    }
  }
  return plainText;
}

/**
 * Type-aware structured-data extractor (locked 2026-05-09, M&A cascade
 * hard-layer ship). Runs in parallel to parseFile() at upload time and
 * returns a JSON-serialisable wrapper for persistence in
 * Document.parsedStructuredData. Replaces the inline-marker text round-
 * trip pattern in Document.content for downstream DPR / aggregation /
 * pipeline consumers.
 *
 * Today supports: synergy_model + .xlsx via extractSynergyStructure.
 * Future expansions (qofe + .pdf, integration_plan + .docx) plug into
 * the same return shape via a `kind` discriminator on the returned
 * payload.
 *
 * Returns null when:
 *   - documentType doesn't match any structured parser
 *   - the file extension doesn't match the parser's expected format
 *   - the parser ran but bailed out (e.g., zero claims detected)
 *   - any unexpected error during parsing — non-fatal, falls through to
 *     the legacy text path
 */
export async function extractTypeAwareStructuredData(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  documentType: string | null | undefined
): Promise<ParsedSynergyModelData | ParsedQofeData | ParsedMeetingTranscriptData | null> {
  if (!documentType) return null;

  const lowerFilename = filename.toLowerCase();
  const isXlsx =
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    lowerFilename.endsWith('.xlsx');
  const isPdf = mimeType === 'application/pdf' || lowerFilename.endsWith('.pdf');
  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerFilename.endsWith('.docx');
  const isPlainText =
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    lowerFilename.endsWith('.txt') ||
    lowerFilename.endsWith('.md');

  if (documentType === 'synergy_model' && isXlsx) {
    try {
      const workbook = new ExcelJS.Workbook();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
      const structure = extractSynergyStructure(workbook);
      const wrapped = toParsedStructuredData(structure);
      if (wrapped) {
        log.info(
          `synergy-model structured-data extraction: ${structure.claims.length} claims · confidence=${structure.confidence}`
        );
      }
      return wrapped;
    } catch (err) {
      log.warn(`synergy-model structured-data extraction failed: ${String(err)}`);
      return null;
    }
  }

  // QofE structured-data extraction (locked 2026-05-09 evening — qofe
  // parser ship). PDF deliverables only — Big-4 / boutique transaction-
  // advisory firms ship QofE as PDF reports. Returns ParsedQofeData with
  // detected red flags, portfolio severity, and commissioned-by signal.
  // Persists to Document.parsedStructuredData via the same generic JSONB
  // column the synergy_model parser uses.
  if (documentType === 'qofe' && isPdf) {
    try {
      const { text } = await extractText(new Uint8Array(buffer));
      const flattened = Array.isArray(text) ? text.join('\n') : text;
      const parsed = extractQofeStructure(flattened);
      if (parsed) {
        log.info(
          `qofe structured-data extraction: ${parsed.assessment.redFlags.length} red flags · severity=${parsed.assessment.portfolioSeverity} · commission=${parsed.assessment.commissionedBy ?? 'unknown'}`
        );
      }
      return parsed;
    } catch (err) {
      log.warn(`qofe structured-data extraction failed: ${String(err)}`);
      return null;
    }
  }

  // Meeting transcript / minutes structured extraction (locked 2026-05-10
  // — meetings → document type cascade). Accepts plain text + DOCX.
  // Returns ParsedMeetingTranscriptData with per-speaker airtime,
  // dominance verdict, and dissent-attempt hits. Persists to
  // Document.parsedStructuredData via the same generic JSONB column.
  if (
    (documentType === 'meeting_transcript' || documentType === 'meeting_minutes') &&
    (isDocx || isPlainText)
  ) {
    try {
      let text: string;
      if (isDocx) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        text = buffer.toString('utf-8');
      }
      const assessment = scoreMeetingTranscript(text);
      if (assessment.hasSpeakerMarkers) {
        const wrapped = toParsedMeetingTranscriptData(assessment, text.length);
        log.info(
          `meeting-transcript structured-data extraction: ${assessment.totalTurns} turns · ${assessment.speakers.length} speakers · dominance=${assessment.dominanceFlag}`
        );
        return wrapped;
      }
      log.info(
        `meeting-transcript structured-data extraction: no speaker markers detected, returning null`
      );
      return null;
    } catch (err) {
      log.warn(`meeting-transcript structured-data extraction failed: ${String(err)}`);
      return null;
    }
  }

  // Future parsers (integration_plan + .docx) plug in here with their own
  // `kind`-discriminated payloads.
  return null;
}
