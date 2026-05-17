// ============================================================
// ST Argumentation — Core predicates sobre AF de Dung
// ============================================================

import type { ArgumentationFramework } from './types';

export function createFramework(
  args: Iterable<string>,
  attacks: Iterable<[string, string]>,
): ArgumentationFramework {
  const argSet = new Set(args);
  const attackList: Array<[string, string]> = [];
  for (const [a, b] of attacks) {
    if (!argSet.has(a)) {
      throw new Error(`Attack source "${a}" not in arguments`);
    }
    if (!argSet.has(b)) {
      throw new Error(`Attack target "${b}" not in arguments`);
    }
    attackList.push([a, b]);
  }
  return { arguments: argSet, attacks: attackList };
}

export function attackersOf(af: ArgumentationFramework, arg: string): Set<string> {
  const result = new Set<string>();
  for (const [a, b] of af.attacks) {
    if (b === arg) result.add(a);
  }
  return result;
}

export function attackedBy(af: ArgumentationFramework, arg: string): Set<string> {
  const result = new Set<string>();
  for (const [a, b] of af.attacks) {
    if (a === arg) result.add(b);
  }
  return result;
}

export function attackedBySet(af: ArgumentationFramework, set: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const [a, b] of af.attacks) {
    if (set.has(a)) result.add(b);
  }
  return result;
}

export function isConflictFree(af: ArgumentationFramework, set: Set<string>): boolean {
  for (const [a, b] of af.attacks) {
    if (set.has(a) && set.has(b)) return false;
  }
  return true;
}

export function defends(af: ArgumentationFramework, set: Set<string>, arg: string): boolean {
  const attackers = attackersOf(af, arg);
  for (const attacker of attackers) {
    let defended = false;
    for (const member of set) {
      if (hasAttack(af, member, attacker)) {
        defended = true;
        break;
      }
    }
    if (!defended) return false;
  }
  return true;
}

export function hasAttack(af: ArgumentationFramework, from: string, to: string): boolean {
  for (const [a, b] of af.attacks) {
    if (a === from && b === to) return true;
  }
  return false;
}

export function isAdmissible(af: ArgumentationFramework, set: Set<string>): boolean {
  if (!isConflictFree(af, set)) return false;
  for (const member of set) {
    if (!defends(af, set, member)) return false;
  }
  return true;
}

export function characteristicFunction(af: ArgumentationFramework, set: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const arg of af.arguments) {
    if (defends(af, set, arg)) result.add(arg);
  }
  return result;
}

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

export function isSubset(a: Set<string>, b: Set<string>): boolean {
  if (a.size > b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}
