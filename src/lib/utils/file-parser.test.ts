import { describe, it, expect, vi } from 'vitest';
import { parseFile } from './file-parser';

// Mock dependencies
const mockMammothExtractRawText = vi.hoisted(() => vi.fn());
const mockUnpdfExtractText = vi.hoisted(() => vi.fn());
const mockPapaParse = vi.hoisted(() => vi.fn());
const mockHtmlToText = vi.hoisted(() => vi.fn());
const mockJSZipLoadAsync = vi.hoisted(() => vi.fn());
const mockExcelJSLoad = vi.hoisted(() => vi.fn());
const mockEachSheet = vi.hoisted(() => vi.fn());

vi.mock('unpdf', () => ({
  extractText: mockUnpdfExtractText,
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: mockMammothExtractRawText,
  },
}));

vi.mock('papaparse', () => ({
  default: {
    parse: mockPapaParse,
  },
}));

vi.mock('html-to-text', () => ({
  convert: mockHtmlToText,
}));

vi.mock('jszip', () => ({
  default: {
    loadAsync: mockJSZipLoadAsync,
  },
}));

vi.mock('exceljs', () => ({
  default: {
    Workbook: class MockWorkbook {
      xlsx = { load: mockExcelJSLoad };
      eachSheet = mockEachSheet;
    },
  },
}));

describe('parseFile', () => {
  it('should parse PDF files correctly', async () => {
    const buffer = Buffer.from('mock pdf content');
    mockUnpdfExtractText.mockResolvedValue({ text: ['Parsed PDF Content'] });

    const result = await parseFile(buffer, 'application/pdf', 'test.pdf');

    expect(mockUnpdfExtractText).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(result).toBe('Parsed PDF Content');
  });

  it('should parse DOCX files correctly', async () => {
    const buffer = Buffer.from('mock docx content');
    mockMammothExtractRawText.mockResolvedValue({ value: 'Parsed DOCX Content', messages: [] });

    const result = await parseFile(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'test.docx'
    );

    expect(mockMammothExtractRawText).toHaveBeenCalledWith({ buffer });
    expect(result).toBe('Parsed DOCX Content');
  });

  it('should throw error for DOC files', async () => {
    const buffer = Buffer.from('mock doc content');

    await expect(parseFile(buffer, 'application/msword', 'test.doc')).rejects.toThrow(
      'Legacy Word Documents (DOC) are not supported'
    );
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
    mockUnpdfExtractText.mockRejectedValue(new Error('PDF Corrupt'));

    await expect(parseFile(buffer, 'application/pdf', 'bad.pdf')).rejects.toThrow(
      'Failed to parse PDF: PDF Corrupt'
    );
  });

  it('should handle DOCX parse errors', async () => {
    const buffer = Buffer.from('bad docx');
    mockMammothExtractRawText.mockRejectedValue(new Error('DOCX Corrupt'));

    await expect(
      parseFile(
        buffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'bad.docx'
      )
    ).rejects.toThrow('Failed to parse DOCX: DOCX Corrupt');
  });

  it('should detect file type by extension if mime type is generic', async () => {
    const buffer = Buffer.from('mock docx content');
    mockMammothExtractRawText.mockResolvedValue({ value: 'Parsed DOCX Content', messages: [] });

    // Generic binary mime type, but .docx extension
    const result = await parseFile(buffer, 'application/octet-stream', 'test.docx');

    expect(mockMammothExtractRawText).toHaveBeenCalledWith({ buffer });
    expect(result).toBe('Parsed DOCX Content');
  });

  // CSV tests
  it('should parse CSV files correctly', async () => {
    const csvContent = 'Name,Age,City\nAlice,30,NYC\nBob,25,LA';
    const buffer = Buffer.from(csvContent);
    mockPapaParse.mockReturnValue({
      data: [
        { Name: 'Alice', Age: '30', City: 'NYC' },
        { Name: 'Bob', Age: '25', City: 'LA' },
      ],
      meta: { fields: ['Name', 'Age', 'City'] },
    });

    const result = await parseFile(buffer, 'text/csv', 'data.csv');

    expect(mockPapaParse).toHaveBeenCalled();
    expect(result).toContain('Name\tAge\tCity');
    expect(result).toContain('Alice\t30\tNYC');
  });

  it('should detect CSV by extension', async () => {
    const buffer = Buffer.from('a,b\n1,2');
    mockPapaParse.mockReturnValue({
      data: [{ a: '1', b: '2' }],
      meta: { fields: ['a', 'b'] },
    });

    const result = await parseFile(buffer, 'application/octet-stream', 'report.csv');

    expect(mockPapaParse).toHaveBeenCalled();
    expect(result).toContain('a\tb');
  });

  it('should handle CSV parse errors', async () => {
    const buffer = Buffer.from('bad csv');
    mockPapaParse.mockImplementation(() => {
      throw new Error('CSV parse failed');
    });

    await expect(parseFile(buffer, 'text/csv', 'bad.csv')).rejects.toThrow(
      'Failed to parse CSV: CSV parse failed'
    );
  });

  // HTML tests
  it('should parse HTML files correctly', async () => {
    const html = '<html><body><h1>Title</h1><p>Content here</p></body></html>';
    const buffer = Buffer.from(html);
    mockHtmlToText.mockReturnValue('Title\nContent here');

    const result = await parseFile(buffer, 'text/html', 'page.html');

    expect(mockHtmlToText).toHaveBeenCalledWith(html, { wordwrap: false });
    expect(result).toBe('Title\nContent here');
  });

  it('should detect HTML by .htm extension', async () => {
    const buffer = Buffer.from('<p>test</p>');
    mockHtmlToText.mockReturnValue('test');

    const result = await parseFile(buffer, 'application/octet-stream', 'page.htm');

    expect(mockHtmlToText).toHaveBeenCalled();
    expect(result).toBe('test');
  });

  it('should handle HTML parse errors', async () => {
    const buffer = Buffer.from('<html>');
    mockHtmlToText.mockImplementation(() => {
      throw new Error('HTML convert failed');
    });

    await expect(parseFile(buffer, 'text/html', 'bad.html')).rejects.toThrow(
      'Failed to parse HTML: HTML convert failed'
    );
  });

  // PPTX tests
  it('should parse PPTX files correctly', async () => {
    const buffer = Buffer.from('mock pptx');
    const mockSlide1 = {
      async: vi.fn().mockResolvedValue('<a:t>Slide 1 Title</a:t><a:t>Slide 1 Body</a:t>'),
    };
    const mockSlide2 = {
      async: vi.fn().mockResolvedValue('<a:t>Slide 2 Content</a:t>'),
    };
    mockJSZipLoadAsync.mockResolvedValue({
      files: {
        'ppt/slides/slide1.xml': mockSlide1,
        'ppt/slides/slide2.xml': mockSlide2,
        'ppt/theme/theme1.xml': { async: vi.fn() },
      },
    });

    const result = await parseFile(
      buffer,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'deck.pptx'
    );

    expect(result).toContain('Slide 1');
    expect(result).toContain('Slide 1 Title');
    expect(result).toContain('Slide 2 Content');
  });

  it('should handle empty PPTX', async () => {
    const buffer = Buffer.from('mock pptx');
    mockJSZipLoadAsync.mockResolvedValue({ files: {} });

    const result = await parseFile(
      buffer,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'empty.pptx'
    );

    expect(result).toBe('');
  });

  it('should handle PPTX parse errors', async () => {
    const buffer = Buffer.from('bad pptx');
    mockJSZipLoadAsync.mockRejectedValue(new Error('Not a valid ZIP'));

    await expect(
      parseFile(
        buffer,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'bad.pptx'
      )
    ).rejects.toThrow('Failed to parse PPTX: Not a valid ZIP');
  });

  // XLSX tests
  it('should parse XLSX files correctly', async () => {
    const buffer = Buffer.from('mock xlsx');
    mockExcelJSLoad.mockResolvedValue(undefined);
    mockEachSheet.mockImplementation(
      (
        cb: (sheet: {
          name: string;
          eachRow: (fn: (row: { values: (string | number | null)[] }) => void) => void;
        }) => void
      ) => {
        cb({
          name: 'Sheet1',
          eachRow: fn => {
            fn({ values: [null, 'Header1', 'Header2'] });
            fn({ values: [null, 'Val1', 'Val2'] });
          },
        });
      }
    );

    const result = await parseFile(
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'data.xlsx'
    );

    expect(result).toContain('Sheet1');
    expect(result).toContain('Header1\tHeader2');
    expect(result).toContain('Val1\tVal2');
  });

  it('should handle XLSX parse errors', async () => {
    const buffer = Buffer.from('bad xlsx');
    mockExcelJSLoad.mockRejectedValue(new Error('XLSX Corrupt'));

    await expect(
      parseFile(
        buffer,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'bad.xlsx'
      )
    ).rejects.toThrow('Failed to parse XLSX: XLSX Corrupt');
  });
});
