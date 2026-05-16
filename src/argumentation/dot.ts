// ============================================================
// ST Argumentation — GraphViz DOT exporter
// ============================================================

import type { ArgumentationFramework } from './types';

function escapeDotId(id: string): string {
  return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function dotExport(af: ArgumentationFramework): string {
  const lines: string[] = [];
  lines.push('digraph AF {');
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=circle];');
  const sortedArgs = Array.from(af.arguments).sort();
  for (const arg of sortedArgs) {
    lines.push(`  "${escapeDotId(arg)}";`);
  }
  for (const [from, to] of af.attacks) {
    lines.push(`  "${escapeDotId(from)}" -> "${escapeDotId(to)}";`);
  }
  lines.push('}');
  return lines.join('\n');
}
