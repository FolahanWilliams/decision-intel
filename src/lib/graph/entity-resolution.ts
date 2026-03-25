/**
 * Entity disambiguation for participant names.
 * Merges name variants (Bob/Robert, different casing, typos)
 * into canonical entities.
 */

export interface CanonicalEntity {
  canonicalName: string;
  aliases: string[];
}

// Common name variations
const NAME_VARIATIONS: Record<string, string[]> = {
  robert: ['bob', 'rob', 'bobby'],
  william: ['will', 'bill', 'billy', 'willy'],
  james: ['jim', 'jimmy', 'jamie'],
  richard: ['rick', 'dick', 'rich'],
  michael: ['mike', 'mikey'],
  elizabeth: ['liz', 'beth', 'lizzy', 'eliza'],
  jennifer: ['jen', 'jenny'],
  katherine: ['kate', 'kathy', 'kat', 'katie'],
  christopher: ['chris'],
  nicholas: ['nick', 'nic'],
  alexander: ['alex'],
  benjamin: ['ben'],
  daniel: ['dan', 'danny'],
  matthew: ['matt'],
  andrew: ['andy', 'drew'],
  jonathan: ['jon', 'john'],
  thomas: ['tom', 'tommy'],
  joseph: ['joe', 'joey'],
  david: ['dave'],
  samuel: ['sam'],
  stephen: ['steve'],
  timothy: ['tim'],
  anthony: ['tony'],
  edward: ['ed', 'eddie'],
  margaret: ['maggie', 'meg'],
  victoria: ['vicky', 'tori'],
  patricia: ['pat', 'patty'],
};

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return dp[m][n];
}

/**
 * Build a reverse lookup: nickname -> full name
 */
function buildNicknameLookup(): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [full, nicks] of Object.entries(NAME_VARIATIONS)) {
    for (const nick of nicks) {
      lookup.set(nick, full);
    }
  }
  return lookup;
}

/**
 * Resolve a list of raw names into canonical entities.
 * Groups similar names together using:
 * 1. Exact match (case-insensitive)
 * 2. Common name variations (Bob/Robert)
 * 3. Levenshtein distance < 3 (typo tolerance)
 */
export function resolveEntities(rawNames: string[]): Map<string, CanonicalEntity> {
  const nickLookup = buildNicknameLookup();
  const normalized = rawNames.map(n => n.toLowerCase().trim()).filter(Boolean);
  const unique = [...new Set(normalized)];

  // Map each name to a canonical form
  const canonicalMap = new Map<string, string>(); // raw -> canonical

  // Step 1: Apply nickname resolution
  for (const name of unique) {
    const parts = name.split(/\s+/);
    const firstName = parts[0];
    const expanded = nickLookup.get(firstName);
    if (expanded && parts.length > 1) {
      // Check if the expanded form exists in our list
      const expandedFull = [expanded, ...parts.slice(1)].join(' ');
      if (unique.includes(expandedFull)) {
        canonicalMap.set(name, expandedFull);
        continue;
      }
    }
    canonicalMap.set(name, name);
  }

  // Step 2: Fuzzy matching via Levenshtein
  const remaining = unique.filter(n => canonicalMap.get(n) === n);
  for (let i = 0; i < remaining.length; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      const a = remaining[i];
      const b = remaining[j];
      if (canonicalMap.get(b) !== b) continue; // already merged

      const dist = levenshtein(a, b);
      // Only merge if distance is very small relative to name length
      if (dist <= 2 && dist < Math.min(a.length, b.length) * 0.3) {
        // Prefer longer name as canonical
        const canonical = a.length >= b.length ? a : b;
        const alias = a.length >= b.length ? b : a;
        canonicalMap.set(alias, canonical);
      }
    }
  }

  // Step 3: Build entity groups
  const groups = new Map<string, Set<string>>();
  for (const [raw, canonical] of canonicalMap) {
    if (!groups.has(canonical)) groups.set(canonical, new Set());
    groups.get(canonical)!.add(raw);
  }

  // Build result
  const result = new Map<string, CanonicalEntity>();
  for (const [canonical, aliases] of groups) {
    const entity: CanonicalEntity = {
      canonicalName: canonical,
      aliases: [...aliases].filter(a => a !== canonical),
    };
    // Map all aliases to this entity
    for (const alias of aliases) {
      result.set(alias, entity);
    }
    result.set(canonical, entity);
  }

  return result;
}
