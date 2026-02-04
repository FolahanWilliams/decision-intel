import mammoth from 'mammoth';

/**
 * Parses the content of a file buffer based on its MIME type or filename extension.
 * Supports PDF, DOCX, and Plain Text.
 * Throws an error for legacy DOC files.
 */
export async function parseFile(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    const lowerFilename = filename.toLowerCase();
    const isPdf = mimeType === 'application/pdf' || lowerFilename.endsWith('.pdf');
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerFilename.endsWith('.docx');
    const isDoc = mimeType === 'application/msword' || lowerFilename.endsWith('.doc');

    if (isPdf) {
        try {
            // Dynamically import pdf-parse to avoid build-time ESM/CJS conflicts
            const { PDFParse } = await import('pdf-parse');

            // pdf-parse v2 requires a Uint8Array (Buffer is a Uint8Array in Node)
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            return data.text;
        } catch (error) {
            throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    if (isDocx) {
        try {
            const result = await mammoth.extractRawText({ buffer });
            if (!result.value.trim()) {
                 console.warn(`DOCX parsing yielded empty text for ${filename}. Messages:`, result.messages);
            }
            return result.value;
        } catch (error) {
            throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    if (isDoc) {
        throw new Error('Legacy Word Documents (DOC) are not supported. Please convert to DOCX or PDF.');
    }

    // Default to plain text
    // Assuming UTF-8 for now.
    return buffer.toString('utf-8');
}
