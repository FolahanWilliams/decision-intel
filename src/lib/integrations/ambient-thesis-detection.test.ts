/**
 * M-6 pure-function regression suite (ship 2026-05-15).
 *
 * Locks the deterministic Drive file-selection logic that the ambient
 * thesis-detection poller depends on. The orchestration function
 * (pollDriveInstallationForSignals) does I/O — Drive API + classifier +
 * Prisma — and is intentionally NOT unit-tested here; the testable core
 * is the pure mime-resolution + parsable-filter + cap, mirroring the
 * M-3 (parseExtractionResponse) / M-7 (detectDependsOnRipples)
 * pure-function-first discipline.
 *
 * Tested invariants:
 *   - Google-native types resolve to their downloadFileContent export
 *     target (doc/slides → pdf, sheet → csv); everything else passes
 *     through unchanged.
 *   - selectParsableDriveFiles keeps only parseFile()-able types AFTER
 *     mime resolution (a Google Doc IS selectable because it exports to
 *     pdf which is parsable).
 *   - Non-parsable types (image/video/legacy .doc) are dropped.
 *   - Entries missing id or mimeType are dropped.
 *   - The maxFiles cap is honoured and order is preserved.
 *   - Empty input → empty output.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveDriveParseMimeType,
  selectParsableDriveFiles,
  DRIVE_MAX_FILES_PER_PASS,
  type AmbientDriveFile,
} from './ambient-thesis-detection';

describe('resolveDriveParseMimeType', () => {
  it('maps Google Docs → application/pdf (export target)', () => {
    expect(resolveDriveParseMimeType('application/vnd.google-apps.document')).toBe(
      'application/pdf'
    );
  });

  it('maps Google Sheets → text/csv (export target)', () => {
    expect(resolveDriveParseMimeType('application/vnd.google-apps.spreadsheet')).toBe(
      'text/csv'
    );
  });

  it('maps Google Slides → application/pdf (export target)', () => {
    expect(resolveDriveParseMimeType('application/vnd.google-apps.presentation')).toBe(
      'application/pdf'
    );
  });

  it('passes through native parsable types unchanged', () => {
    expect(resolveDriveParseMimeType('application/pdf')).toBe('application/pdf');
    expect(
      resolveDriveParseMimeType(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    ).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(resolveDriveParseMimeType('text/plain')).toBe('text/plain');
  });

  it('passes through unknown / non-parsable types unchanged (filtered later)', () => {
    expect(resolveDriveParseMimeType('image/png')).toBe('image/png');
    expect(resolveDriveParseMimeType('application/msword')).toBe('application/msword');
  });
});

describe('selectParsableDriveFiles', () => {
  const mk = (
    id: string,
    mimeType: string,
    name = 'memo',
    parents?: string[]
  ): AmbientDriveFile => ({ id, name, mimeType, parents });

  it('keeps a Google Doc (resolves to parsable pdf) with the export parseMimeType', () => {
    const out = selectParsableDriveFiles(
      [mk('a', 'application/vnd.google-apps.document')],
      25
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('a');
    expect(out[0].parseMimeType).toBe('application/pdf');
    // The original Drive mimeType is preserved so downloadFileContent
    // knows to EXPORT rather than alt=media.
    expect(out[0].mimeType).toBe('application/vnd.google-apps.document');
  });

  it('keeps native parsable types (pdf / docx / xlsx / pptx / csv / html / txt)', () => {
    const files = [
      mk('1', 'application/pdf'),
      mk('2', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      mk('3', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
      mk('4', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
      mk('5', 'text/csv'),
      mk('6', 'text/html'),
      mk('7', 'text/plain'),
    ];
    const out = selectParsableDriveFiles(files, 25);
    expect(out.map(f => f.id)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('drops non-parsable types (image / video / legacy .doc)', () => {
    const files = [
      mk('img', 'image/png'),
      mk('vid', 'video/mp4'),
      mk('doc', 'application/msword'),
      mk('keep', 'application/pdf'),
    ];
    const out = selectParsableDriveFiles(files, 25);
    expect(out.map(f => f.id)).toEqual(['keep']);
  });

  it('drops entries with missing id or mimeType', () => {
    const files = [
      mk('', 'application/pdf'),
      { id: 'x', name: 'n', mimeType: '' } as AmbientDriveFile,
      mk('ok', 'application/pdf'),
    ];
    const out = selectParsableDriveFiles(files, 25);
    expect(out.map(f => f.id)).toEqual(['ok']);
  });

  it('honours the maxFiles cap and preserves input order', () => {
    const files = Array.from({ length: 10 }, (_, i) => mk(`f${i}`, 'application/pdf'));
    const out = selectParsableDriveFiles(files, 3);
    expect(out.map(f => f.id)).toEqual(['f0', 'f1', 'f2']);
  });

  it('passes the parent folder list through for sourceParentRef resolution', () => {
    const out = selectParsableDriveFiles(
      [mk('a', 'application/pdf', 'memo', ['folderX', 'folderY'])],
      25
    );
    expect(out[0].parents).toEqual(['folderX', 'folderY']);
  });

  it('returns empty for empty input', () => {
    expect(selectParsableDriveFiles([], 25)).toEqual([]);
  });

  it('exposes a sane per-pass cap constant', () => {
    expect(DRIVE_MAX_FILES_PER_PASS).toBeGreaterThan(0);
    expect(DRIVE_MAX_FILES_PER_PASS).toBeLessThanOrEqual(100);
  });
});
