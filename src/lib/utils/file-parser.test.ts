import { describe, it, expect, vi } from 'vitest';
import { parseFile } from './file-parser';

// Mock dependencies
const mockPdfParse = vi.hoisted(() => vi.fn());
const mockMammothExtractRawText = vi.hoisted(() => vi.fn());

vi.mock('pdf-parse', () => ({
    default: mockPdfParse
}));

vi.mock('mammoth', () => ({
    default: {
        extractRawText: mockMammothExtractRawText
    }
}));

describe('parseFile', () => {
    it('should parse PDF files correctly', async () => {
        const buffer = Buffer.from('mock pdf content');
        mockPdfParse.mockResolvedValue({ text: 'Parsed PDF Content' });

        const result = await parseFile(buffer, 'application/pdf', 'test.pdf');

        expect(mockPdfParse).toHaveBeenCalledWith(buffer);
        expect(result).toBe('Parsed PDF Content');
    });

    it('should parse DOCX files correctly', async () => {
        const buffer = Buffer.from('mock docx content');
        mockMammothExtractRawText.mockResolvedValue({ value: 'Parsed DOCX Content', messages: [] });

        const result = await parseFile(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'test.docx');

        expect(mockMammothExtractRawText).toHaveBeenCalledWith({ buffer });
        expect(result).toBe('Parsed DOCX Content');
    });

    it('should throw error for DOC files', async () => {
        const buffer = Buffer.from('mock doc content');

        await expect(parseFile(buffer, 'application/msword', 'test.doc'))
            .rejects
            .toThrow('Legacy Word Documents (DOC) are not supported');
    });

    it('should treat unknown types as text (fallback)', async () => {
        const content = 'Plain Text Content';
        const buffer = Buffer.from(content);

        const result = await parseFile(buffer, 'text/plain', 'test.txt');

        expect(result).toBe(content);
    });

    it('should fallback to text if mime is unknown but not binary-exclusive', async () => {
        const content = 'Markdown Content';
        const buffer = Buffer.from(content);

        const result = await parseFile(buffer, 'text/markdown', 'test.md');
        expect(result).toBe(content);
    });

    it('should handle PDF parse errors', async () => {
         const buffer = Buffer.from('bad pdf');
         mockPdfParse.mockRejectedValue(new Error('PDF Corrupt'));

         await expect(parseFile(buffer, 'application/pdf', 'bad.pdf'))
            .rejects
            .toThrow('Failed to parse PDF: PDF Corrupt');
    });

    it('should handle DOCX parse errors', async () => {
         const buffer = Buffer.from('bad docx');
         mockMammothExtractRawText.mockRejectedValue(new Error('DOCX Corrupt'));

         await expect(parseFile(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'bad.docx'))
            .rejects
            .toThrow('Failed to parse DOCX: DOCX Corrupt');
    });

    it('should detect file type by extension if mime type is generic', async () => {
        const buffer = Buffer.from('mock docx content');
        mockMammothExtractRawText.mockResolvedValue({ value: 'Parsed DOCX Content', messages: [] });

        // Generic binary mime type, but .docx extension
        const result = await parseFile(buffer, 'application/octet-stream', 'test.docx');

        expect(mockMammothExtractRawText).toHaveBeenCalledWith({ buffer });
        expect(result).toBe('Parsed DOCX Content');
    });
});
