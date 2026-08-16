/* ─────────────────────────────────────────────────
   Anonymous identity pool for Random Chat.
   Aliases use the first alphabet / initial of the
   user's real name (e.g., 'User A', 'User S') to keep
   them anonymous while fulfilling the initial requirement.
───────────────────────────────────────────────── */

export interface AnonymousAlias {
  initial: string;
  name: string;
}

export function getInitialAlias(userName?: string | null, fallbackSeed = 'A'): AnonymousAlias {
  const clean = (userName ?? '').trim();
  const initial = clean.length > 0 ? clean[0].toUpperCase() : fallbackSeed.toUpperCase();
  return {
    initial,
    name: `User ${initial}`,
  };
}

/** Pick initial-based aliases for a new session. */
export function assignAliases(
  userAName?: string | null,
  userBName?: string | null
): {
  aliasA: AnonymousAlias;
  aliasB: AnonymousAlias;
} {
  return {
    aliasA: getInitialAlias(userAName, 'A'),
    aliasB: getInitialAlias(userBName, 'B'),
  };
}

/** Human-readable alias string for storage on the session row. */
export function aliasLabel(alias: AnonymousAlias): string {
  return alias.name;
}

