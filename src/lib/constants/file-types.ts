/**
 * Single source of truth for supported document upload file types.
 * Used by upload routes, bulk upload routes, and the BulkUploadPanel component.
 */

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'text/html',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;

export const SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.md',
  '.docx',
  '.xlsx',
  '.csv',
  '.html',
  '.htm',
  '.pptx',
] as const;

export const FILE_TYPE_LABELS = 'PDF, DOCX, XLSX, CSV, PPTX, HTML, TXT, MD';

export function isFileTypeSupported(mimeType: string, filename: string): boolean {
  if ((SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return true;
  }
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}
