/* ─────────────────────────────────────────────────
   Anonymous identity pool for Random Chat.
   Aliases are session-scoped: the server assigns each
   participant a different alias at match time and stores
   it on the session row — never on the user account.
───────────────────────────────────────────────── */

export interface AnonymousAlias {
  emoji: string;
  name: string;
}

export const ANONYMOUS_ALIASES: AnonymousAlias[] = [
  { emoji: '☁️', name: 'Cloud' },
  { emoji: '🌙', name: 'Moon' },
  { emoji: '🌊', name: 'Wave' },
  { emoji: '⭐', name: 'Nova' },
  { emoji: '🌿', name: 'Leaf' },
  { emoji: '🔥', name: 'Ember' },
  { emoji: '🪐', name: 'Orbit' },
  { emoji: '🎐', name: 'Breeze' },
  { emoji: '🌵', name: 'Cactus' },
  { emoji: '🦊', name: 'Fox' },
  { emoji: '🫧', name: 'Bubble' },
  { emoji: '🍂', name: 'Autumn' },
  { emoji: '⚡', name: 'Volt' },
  { emoji: '🎵', name: 'Echo' },
  { emoji: '🌻', name: 'Sunny' },
  { emoji: '🐦', name: 'Sparrow' },
];

/** Pick two distinct aliases for a new session. */
export function assignAliases(seed = Math.random()): {
  aliasA: AnonymousAlias;
  aliasB: AnonymousAlias;
} {
  const list = [...ANONYMOUS_ALIASES];
  const a = list.splice(Math.floor(seed * list.length) % list.length, 1)[0];
  const b = list[Math.floor((seed * 7 + 3) * list.length) % list.length];
  return { aliasA: a, aliasB: b };
}

/** Human-readable alias string for storage on the session row. */
export function aliasLabel(alias: AnonymousAlias): string {
  return `${alias.emoji} ${alias.name}`;
}
