/**
 * SSRF guards for outbound webhook delivery (locked 2026-06-09 security sweep).
 *
 * Webhook URLs are user-supplied. Until this lock, the private-IP check ran
 * only at REGISTRATION (a string match on the hostname). That leaves a
 * DNS-rebinding hole: an attacker registers `evil.example.com` (resolves to a
 * public IP at validation time, passes), then repoints its DNS record at
 * `169.254.169.254` (the cloud metadata endpoint) or an internal host. When
 * the delivery worker later fires, it fetches the internal target and can
 * leak the response back to the attacker via the webhook-test response body.
 *
 * The fix: validate at FETCH time, and resolve DNS before deciding. Every
 * outbound webhook fetch calls `assertPublicWebhookUrl(url)` which (a) enforces
 * http(s), (b) rejects a private hostname LITERAL, and (c) resolves the
 * hostname and rejects if ANY resolved address is private/internal.
 *
 * Residual (documented, deferred): a fast-flux attacker could still rebind in
 * the window between our `dns.lookup` and the fetch's own resolution (a TOCTOU
 * the global fetch can't close without IP pinning + a custom dispatcher).
 * Closing that fully is a larger change; for the current stage the
 * resolve-then-reject guard removes the static rebind + the
 * public-at-registration / private-at-delivery class, which is the live risk.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * True if a hostname STRING is a private / internal / loopback literal.
 * Covers IPv4 private ranges + loopback + the cloud metadata endpoint +
 * IPv6 loopback / link-local / unique-local. Hostnames that are not IP
 * literals (e.g. `hooks.slack.com`) return false here — they're caught by
 * the DNS-resolution pass in assertPublicWebhookUrl.
 */
export function isPrivateHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  if (h === 'localhost') return true;

  if (isIP(h) === 4) return isPrivateIPv4(h);
  if (isIP(h) === 6) return isPrivateIPv6(h);

  return false;
}

function isPrivateIPv4(ip: string): boolean {
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [, a, b] = m.map(Number);
  if (a === 127) return true; // loopback 127.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local 169.254.0.0/16 (incl. cloud metadata)
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const h = ip.toLowerCase();
  if (h === '::1' || h === '::') return true; // loopback / unspecified
  if (h.startsWith('fe80')) return true; // link-local
  if (h.startsWith('fc') || h.startsWith('fd')) return true; // unique-local fc00::/7
  // IPv4-mapped (::ffff:10.0.0.1) — extract + re-check as IPv4.
  const mapped = h.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

/**
 * Throws if `rawUrl` is not a safe public http(s) webhook target. Use at
 * REGISTRATION and at every DELIVERY fetch. Resolves DNS so a hostname that
 * points at an internal address is rejected even though the literal looks
 * public.
 */
export async function assertPublicWebhookUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError('Webhook URL is not a valid URL.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new SsrfBlockedError('Webhook URL must use http or https.');
  }

  if (isPrivateHostname(parsed.hostname)) {
    throw new SsrfBlockedError('Webhook URL must not point to a private or internal address.');
  }

  // Resolve the hostname and reject if any address is private — closes the
  // public-at-registration / private-at-delivery (DNS-rebinding) class.
  // Skip the lookup when the hostname is already an IP literal (the check
  // above is authoritative for those).
  if (isIP(parsed.hostname) === 0) {
    let addresses: Array<{ address: string }>;
    try {
      addresses = await lookup(parsed.hostname, { all: true });
    } catch {
      throw new SsrfBlockedError('Webhook URL hostname could not be resolved.');
    }
    for (const { address } of addresses) {
      if (isPrivateHostname(address)) {
        throw new SsrfBlockedError(
          'Webhook URL resolves to a private or internal address (blocked).'
        );
      }
    }
  }
}

/** Distinguishes an SSRF rejection from an incidental network error. */
export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfBlockedError';
  }
}
