/**
 * Profile utilities — resolve and validate profile slugs against st-lang registry.
 */

// Known profile slugs from st-lang
const KNOWN_PROFILES = [
  'classical.propositional',
  'classical.fol',
  'classical-fol',
  'modal.k',
  'modal.t',
  'modal.b',
  'modal.s4',
  'modal.s5',
  'modal.d',
  'intuitionistic.nj',
  'paraconsistent.belnap',
  'relevant',
  'linear',
  'fuzzy',
  'default',
] as const;

export type KnownProfile = (typeof KNOWN_PROFILES)[number];

/** Normalize common aliases */
const ALIASES: Record<string, string> = {
  'classical': 'classical.propositional',
  'classical-fol': 'classical.fol',
  'fol': 'classical.fol',
  'prop': 'classical.propositional',
  'propositional': 'classical.propositional',
  'modal': 'modal.k',
  'modal-k': 'modal.k',
  'modal-t': 'modal.t',
  'modal-b': 'modal.b',
  'modal-s4': 'modal.s4',
  'modal-s5': 'modal.s5',
  'intuitionistic': 'intuitionistic.nj',
  'nj': 'intuitionistic.nj',
  'belnap': 'paraconsistent.belnap',
  'paraconsistent': 'paraconsistent.belnap',
};

/**
 * Resolve a user-supplied profile slug to the canonical form used by st-lang.
 * Returns null if the slug is unrecognized and strict=true.
 */
export function resolveProfile(slug: string, strict = false): string | null {
  const lower = slug.toLowerCase().trim();
  const resolved = ALIASES[lower] ?? lower;

  if (strict && !KNOWN_PROFILES.includes(resolved as KnownProfile)) {
    return null;
  }
  return resolved;
}

/**
 * Returns list of all known profile slugs (canonical names).
 */
export function listProfiles(): string[] {
  return [...KNOWN_PROFILES];
}

/**
 * Build a logic declaration header for a given profile.
 * If no profile given, uses classical.propositional.
 */
export function profileHeader(profile?: string): string {
  const p = profile ? (resolveProfile(profile) ?? profile) : 'classical.propositional';
  return `logic ${p}`;
}
