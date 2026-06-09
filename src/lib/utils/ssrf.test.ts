import { describe, expect, it } from 'vitest';
import { assertPublicWebhookUrl, isPrivateHostname, SsrfBlockedError } from './ssrf';

describe('isPrivateHostname', () => {
  it('flags loopback + metadata + private ranges (IPv4)', () => {
    for (const h of [
      'localhost',
      '127.0.0.1',
      '127.5.5.5',
      '169.254.169.254', // cloud metadata
      '10.0.0.1',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '0.0.0.0',
      '100.64.0.1', // CGNAT
    ]) {
      expect(isPrivateHostname(h), h).toBe(true);
    }
  });

  it('flags private IPv6 (loopback / link-local / ULA / mapped)', () => {
    for (const h of ['::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', '::ffff:10.0.0.1']) {
      expect(isPrivateHostname(h), h).toBe(true);
    }
  });

  it('does NOT flag public IPs or hostnames', () => {
    for (const h of [
      '8.8.8.8',
      '1.1.1.1',
      '172.32.0.1',
      '193.0.0.1',
      'hooks.slack.com',
      '::ffff:8.8.8.8',
    ]) {
      expect(isPrivateHostname(h), h).toBe(false);
    }
  });
});

describe('assertPublicWebhookUrl', () => {
  it('rejects a non-URL', async () => {
    await expect(assertPublicWebhookUrl('not a url')).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('rejects non-http(s) schemes', async () => {
    await expect(assertPublicWebhookUrl('file:///etc/passwd')).rejects.toBeInstanceOf(
      SsrfBlockedError
    );
    await expect(assertPublicWebhookUrl('ftp://example.com')).rejects.toBeInstanceOf(
      SsrfBlockedError
    );
  });

  it('rejects a private IP literal without doing DNS', async () => {
    await expect(assertPublicWebhookUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(
      /private or internal/
    );
    await expect(assertPublicWebhookUrl('https://127.0.0.1:8080/hook')).rejects.toBeInstanceOf(
      SsrfBlockedError
    );
  });

  it('rejects a hostname that cannot resolve', async () => {
    await expect(
      assertPublicWebhookUrl('https://nonexistent.invalid-tld-xyz-decisionintel.test/hook')
    ).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('allows a public IP literal (no DNS needed)', async () => {
    await expect(assertPublicWebhookUrl('https://1.1.1.1/hook')).resolves.toBeUndefined();
  });
});
