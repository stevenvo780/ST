const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;
const BARE_ATOM_RE = /^[A-Z][A-Z0-9_]*$/;

interface ScopedFormulaBinding {
  name: string;
  previous?: string;
}

interface TransformState {
  nextId: number;
  knownFormulas: Map<string, string>;
  localScope: ScopedFormulaBinding[] | null;
  hasPremiseBlock: boolean;
  numberedLineNames: Map<string, string>;
  availableNumberedLines: Set<string>;
  pendingBareProofSteps: PendingBareProofStep[];
  pendingDerivedProofSteps: PendingDerivedProofStep[];
}

export interface ReplCompatState {
  nextId: number;
  pendingPremises: Array<{ name: string; formula: string }>;
  pendingBlockLines: string[];
  pendingBlockBraceDepth: number;
  pendingBlockProofDepth: number;
  pendingBlockProofAwaitingShow: boolean[];
}

export interface ReplCompatContext {
  knownPremises?: string[];
}

export type ReplTransformResult =
  | { kind: 'buffered'; source: string; message: string }
  | { kind: 'execute'; source: string }
  | { kind: 'executeSingle'; source: string };

interface PendingBareProofStep {
  lineNumber: string;
  formula: string;
  indent: string;
  comment: string;
}

interface PendingDerivedProofStep {
  lineNumber: string;
  formula: string;
  refs: string[];
  indent: string;
  comment: string;
  originalLine: string;
}

function createTransformState(): TransformState {
  return {
    nextId: 1,
    knownFormulas: new Map(),
    localScope: null,
    hasPremiseBlock: false,
    numberedLineNames: new Map(),
    availableNumberedLines: new Set(),
    pendingBareProofSteps: [],
    pendingDerivedProofSteps: [],
  };
}

function nextCompatName(state: TransformState, prefix: string): string {
  return `__compat_${prefix}_${state.nextId++}`;
}

function beginLocalScope(state: TransformState): void {
  if (!state.localScope) {
    state.localScope = [];
  }
}

function rememberFormula(
  state: TransformState,
  name: string,
  formula: string,
  options?: { local?: boolean },
): void {
  const previous = state.knownFormulas.get(name);
  if (options?.local) {
    beginLocalScope(state);
    state.localScope?.push({ name, previous });
  }
  state.knownFormulas.set(name, formula.trim());
}

function closeLocalScope(state: TransformState): void {
  if (!state.localScope) {
    state.hasPremiseBlock = false;
    return;
  }

  for (let index = state.localScope.length - 1; index >= 0; index -= 1) {
    const binding = state.localScope[index];
    if (binding.previous === undefined) {
      state.knownFormulas.delete(binding.name);
    } else {
      state.knownFormulas.set(binding.name, binding.previous);
    }
  }

  state.localScope = null;
  state.hasPremiseBlock = false;
}

function splitLineComment(line: string): { code: string; comment: string } {
  let inString = false;

  for (let index = 0; index < line.length; index += 1) {
    const current = line[index];
    const next = line[index + 1];

    if (inString) {
      if (current === '\\') {
        index += 1;
        continue;
      }
      if (current === '"') {
        inString = false;
      }
      continue;
    }

    if (current === '"') {
      inString = true;
      continue;
    }

    if (current === '/' && next === '/') {
      return {
        code: line.slice(0, index),
        comment: line.slice(index),
      };
    }
  }

  return { code: line, comment: '' };
}

function stripLeadingProofBars(code: string): { code: string; hadBars: boolean } {
  if (/^\s*\|-/.test(code)) {
    return { code, hadBars: false };
  }

  const match = code.match(/^(\s*(?:[|│]+\s*)+)(.*)$/);
  if (!match) {
    return { code, hadBars: false };
  }

  return {
    code: `${match[1].match(/^\s*/)?.[0] ?? ''}${match[2]}`,
    hadBars: true,
  };
}

function appendComment(lines: string[], comment: string): string[] {
  if (!comment || lines.length === 0) {
    return lines;
  }

  const next = [...lines];
  next[0] = `${next[0]} ${comment.trimStart()}`.trimEnd();
  return next;
}

function splitTopLevel(value: string, delimiter = ','): string[] {
  const parts: string[] = [];
  let current = '';
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let inString = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (inString) {
      current += char;
      if (char === '\\' && index + 1 < value.length) {
        current += value[index + 1];
        index += 1;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      current += char;
      continue;
    }

    if (char === '(') depthParen += 1;
    if (char === ')') depthParen = Math.max(0, depthParen - 1);
    if (char === '{') depthBrace += 1;
    if (char === '}') depthBrace = Math.max(0, depthBrace - 1);
    if (char === '[') depthBracket += 1;
    if (char === ']') depthBracket = Math.max(0, depthBracket - 1);

    if (char === delimiter && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      const trimmed = current.trim();
      if (trimmed) {
        parts.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) {
    parts.push(trimmed);
  }
  return parts;
}

function compatProofLineName(lineNumber: string): string {
  return `__compat_line_${lineNumber}`;
}

function reserveNumberedLineName(state: TransformState, lineNumber: string): string {
  const existing = state.numberedLineNames.get(lineNumber);
  if (existing) {
    return existing;
  }

  const name = compatProofLineName(lineNumber);
  state.numberedLineNames.set(lineNumber, name);
  return name;
}

function rememberNumberedLine(state: TransformState, lineNumber: string, formula: string): string {
  const name = reserveNumberedLineName(state, lineNumber);
  rememberFormula(state, name, formula);
  state.availableNumberedLines.add(lineNumber);
  return name;
}

function canEmitPendingDerivedStep(
  state: TransformState,
  step: Pick<PendingDerivedProofStep, 'refs'>,
): boolean {
  return step.refs.every((ref) => state.availableNumberedLines.has(ref));
}

function emitPendingDerivedStep(state: TransformState, step: PendingDerivedProofStep): string[] {
  const premiseNames = step.refs.map(
    (ref) => state.numberedLineNames.get(ref) ?? compatProofLineName(ref),
  );
  const name = rememberNumberedLine(state, step.lineNumber, step.formula);

  // Emit derive for validation, then register as axiom so subsequent numbered steps
  // can reference it. Use axiom (not theorem) so it's available as a premise name.
  return appendComment(
    [
      `${step.indent}derive ${step.formula} from {${premiseNames.join(', ')}}`,
      `${step.indent}axiom ${name} : ${step.formula}`,
    ],
    step.comment,
  );
}

function flushResolvablePendingDerivedSteps(state: TransformState): string[] {
  const lines: string[] = [];
  let changed = true;

  while (changed) {
    changed = false;
    const remaining: PendingDerivedProofStep[] = [];

    for (const step of state.pendingDerivedProofSteps) {
      if (canEmitPendingDerivedStep(state, step)) {
        lines.push(...emitPendingDerivedStep(state, step));
        changed = true;
      } else {
        remaining.push(step);
      }
    }

    state.pendingDerivedProofSteps = remaining;
  }

  return lines;
}

function flushCompatState(state: TransformState): string[] {
  const lines = flushPendingBareProofSteps(state);
  lines.push(...flushResolvablePendingDerivedSteps(state));
  return lines;
}

function flushPendingBareProofSteps(state: TransformState): string[] {
  if (state.pendingBareProofSteps.length === 0) {
    return [];
  }

  const pending = state.pendingBareProofSteps;
  state.pendingBareProofSteps = [];

  if (pending.length === 1) {
    const step = pending[0];
    const name = rememberNumberedLine(state, step.lineNumber, step.formula);
    return appendComment([`${step.indent}axiom ${name} : ${step.formula}`], step.comment);
  }

  const lines: string[] = [];
  for (let index = 0; index < pending.length - 1; index += 1) {
    const step = pending[index];
    const name = rememberNumberedLine(state, step.lineNumber, step.formula);
    lines.push(...appendComment([`${step.indent}axiom ${name} : ${step.formula}`], step.comment));
  }

  const last = pending[pending.length - 1];
  const lastName = rememberNumberedLine(state, last.lineNumber, last.formula);
  const premiseNames = pending
    .slice(0, -1)
    .map(
      (step) =>
        state.numberedLineNames.get(step.lineNumber) ?? compatProofLineName(step.lineNumber),
    );

  lines.push(
    ...appendComment(
      [
        `${last.indent}derive ${last.formula} from {${premiseNames.join(', ')}}`,
        `${last.indent}axiom ${lastName} : ${last.formula}`,
      ],
      last.comment,
    ),
  );

  return lines;
}

function looksLikeFormulaCandidate(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^(?:forall|exists)\s+[A-Za-z_][A-Za-z0-9_]*(?:\s+|\.\s*).+$/i.test(trimmed)) {
    return true;
  }
  if (/^(?:\[\]|<>)\s*.+$/.test(trimmed)) {
    return true;
  }
  if (/^(?:!|~|¬|∼)\s*(?:\(.+\)|[A-Za-z_][A-Za-z0-9_.]*(?:\([^)]*\))?|⊤|⊥)$/.test(trimmed)) {
    return true;
  }
  if (/<->|->|<=>|=>/.test(trimmed)) {
    return true;
  }
  if (/[&|∨∧→↔⇒⇔⊃≡]/.test(trimmed)) {
    return true;
  }
  if (/^[⊤⊥]$/.test(trimmed)) {
    return true;
  }
  if (/^[A-Za-z_][A-Za-z0-9_.]*(?:\([^)]*\))?$/.test(trimmed)) {
    return true;
  }
  if (/^\(.*\)$/.test(trimmed)) {
    return true;
  }

  return false;
}

function extractJustifiedStep(rest: string): { formula: string; refs: string[] } | null {
  // Extract refs (comma-separated digits, optionally parenthesized) anchored at the end.
  // Use a right-anchored pattern that greedily captures the full digit list.
  const refsMatch = rest.match(/(?:\(|\[)?\s*(\d+(?:\s*,\s*\d+)*)\s*(?:\)|\])?\s*$/);
  if (!refsMatch) {
    return null;
  }

  const refsStr = refsMatch[1];
  const refs = refsStr.split(/\s*,\s*/);
  // beforeRefs is everything before the refs match
  const beforeRefs = rest.slice(0, refsMatch.index).trim();

  if (!beforeRefs) {
    return null;
  }

  const parts = beforeRefs.split(/\s+/);

  // Try progressively shorter prefixes as the formula, leaving the rest as justification text.
  // When there are multiple tokens, prefer shorter formulas to leave room for justification.
  // Only use the full beforeRefs if it's a single token (e.g. just "Q").
  const startIndex = parts.length === 1 ? 1 : parts.length - 1;
  for (let splitIndex = startIndex; splitIndex >= 1; splitIndex -= 1) {
    const formula = parts.slice(0, splitIndex).join(' ').trim();
    if (looksLikeFormulaCandidate(formula)) {
      return { formula, refs };
    }
  }

  return null;
}

function extractPrefixJustifiedStep(rest: string): { formula: string; refs: string[] } | null {
  const refsMatch = rest.match(
    /^(.+?)\s+(?:\(|\[)?\s*(\d+(?:\s*,\s*\d+)*)\s*(?:\)|\])?\s+(.+)$/,
  );
  if (!refsMatch) {
    return null;
  }

  const formula = refsMatch[3].trim();
  if (!looksLikeFormulaCandidate(formula)) {
    return null;
  }

  return {
    formula,
    refs: refsMatch[2].split(/\s*,\s*/),
  };
}

function transformNumberedProofLine(line: string, state: TransformState): string[] | null {
  const { code, comment } = splitLineComment(line);
  const stripped = stripLeadingProofBars(code);
  const numberedLineMatch = stripped.code.match(/^\s*(?:\[(\d+)\]|(\d+)[.):])\s+(.+?)\s*$/);
  if (!numberedLineMatch) {
    return null;
  }

  const indent = stripped.code.match(/^\s*/)?.[0] ?? '';
  const lineNumber = numberedLineMatch[1] ?? numberedLineMatch[2];
  const rest = numberedLineMatch[3].trim();

  const trailingPremiseMatch = rest.match(/^(.+?)\s+(premise|premisa)$/i);
  const leadingPremiseMatch = rest.match(/^(premise|premisa)\s+(.+)$/i);
  if (trailingPremiseMatch || leadingPremiseMatch) {
    const prefix = flushCompatState(state);
    const formula = (trailingPremiseMatch?.[1] ?? leadingPremiseMatch?.[2] ?? '').trim();
    const name = rememberNumberedLine(state, lineNumber, formula);
    return [...prefix, ...appendComment([`${indent}axiom ${name} : ${formula}`], comment)];
  }

  const assumptionMatch = rest.match(/^(?:assume|asumir|supuesto|hipotesis|hipótesis)\s+(.+)$/i);
  if (assumptionMatch) {
    const prefix = flushCompatState(state);
    const formula = assumptionMatch[1].trim().replace(/^[A-Za-z_][A-Za-z0-9_.]*\s*[:=]\s*/, '');
    const name = rememberNumberedLine(state, lineNumber, formula);
    return [...prefix, ...appendComment([`${indent}axiom ${name} : ${formula}`], comment)];
  }

  const justifiedStep = extractJustifiedStep(rest) ?? extractPrefixJustifiedStep(rest);
  if (justifiedStep) {
    const prefix = flushCompatState(state);
    const { formula, refs } = justifiedStep;
    if (!canEmitPendingDerivedStep(state, { refs })) {
      reserveNumberedLineName(state, lineNumber);
      state.pendingDerivedProofSteps.push({
        lineNumber,
        formula,
        refs,
        indent,
        comment,
        originalLine: line,
      });
      return prefix;
    }
    return [
      ...prefix,
      ...emitPendingDerivedStep(state, {
        lineNumber,
        formula,
        refs,
        indent,
        comment,
        originalLine: line,
      }),
    ];
  }

  state.pendingBareProofSteps.push({
    lineNumber,
    formula: rest,
    indent,
    comment,
  });
  return [];
}

function normalizeUnicodeSyntax(source: string): string {
  let output = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inDoubleBracket = false;

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      output += current;
      if (current === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      output += current;
      if (current === '*' && next === '/') {
        output += '/';
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (inDoubleBracket) {
      output += current;
      if (current === ']' && next === ']') {
        output += ']';
        index += 1;
        inDoubleBracket = false;
      }
      continue;
    }

    if (inString) {
      output += current;
      if (current === '\\' && next) {
        output += next;
        index += 1;
        continue;
      }
      if (current === '"') {
        inString = false;
      }
      continue;
    }

    if (current === '/' && next === '/') {
      output += '//';
      index += 1;
      inLineComment = true;
      continue;
    }

    if (current === '/' && next === '*') {
      output += '/*';
      index += 1;
      inBlockComment = true;
      continue;
    }

    if (current === '[' && next === '[') {
      output += '[[';
      index += 1;
      inDoubleBracket = true;
      continue;
    }

    if (current === '"') {
      output += current;
      inString = true;
      continue;
    }

    if (current === '<' && next === '=' && source[index + 2] === '>') {
      output += '<->';
      index += 2;
      continue;
    }
    if (current === '=' && next === '>') {
      output += '->';
      index += 1;
      continue;
    }
    if (current === '¬' || current === '~' || current === '∼') {
      output += '!';
      continue;
    }
    if (current === '∧') {
      output += '&';
      continue;
    }
    if (current === '∨') {
      output += '|';
      continue;
    }
    if (current === '→' || current === '⇒' || current === '⊃') {
      output += '->';
      continue;
    }
    if (current === '↔' || current === '⇔' || current === '≡') {
      output += '<->';
      continue;
    }
    if (current === '⊢') {
      output += '|-';
      continue;
    }
    if (current === '⊥') {
      output += '⊥';
      continue;
    }
    if (current === '⊤') {
      output += '⊤';
      continue;
    }
    if (current === '∴') {
      output += 'therefore';
      continue;
    }

    output += current;
  }

  return output;
}

function extractNamedFormula(line: string): { name: string; formula: string } | null {
  const axiomMatch = line.match(
    /^\s*(?:(?:export|exportar)\s+)?(?:axiom|axioma|theorem|teorema)\s+([A-Za-z_][A-Za-z0-9_.]*)\s*[:=]\s*(.+?)\s*$/,
  );
  if (axiomMatch) {
    return { name: axiomMatch[1], formula: axiomMatch[2] };
  }

  const assumeMatch = line.match(
    /^\s*(?:assume|asumir)\s+([A-Za-z_][A-Za-z0-9_.]*)\s*[:=]\s*(.+?)\s*$/i,
  );
  if (assumeMatch) {
    return { name: assumeMatch[1], formula: assumeMatch[2] };
  }

  const describedLetMatch = line.match(
    /^\s*(?:(?:export|exportar)\s+)?(?:let|sea)\s+([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*"[^"]*"\s*:\s*(.+?)\s*$/,
  );
  if (describedLetMatch) {
    return { name: describedLetMatch[1], formula: describedLetMatch[2] };
  }

  const letMatch = line.match(
    /^\s*(?:(?:export|exportar)\s+)?(?:let|sea)\s+([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.+?)\s*$/,
  );
  if (!letMatch) {
    return null;
  }

  const rhs = letMatch[2].trim();
  if (
    rhs.startsWith('"') ||
    /^(?:passage|pasaje|formalize|formalizar)\b/i.test(rhs) ||
    /^(?:\d+|true|false)\b/i.test(rhs)
  ) {
    return null;
  }

  return { name: letMatch[1], formula: rhs };
}

function buildStandaloneProof(
  goal: string,
  premises: string[],
  indent: string,
  state: TransformState,
): string[] {
  const proofLines = premises.map(
    (formula) => `${indent}assume ${nextCompatName(state, 'p')} : ${formula}`,
  );
  proofLines.push(`${indent}show ${goal}`);
  proofLines.push(`${indent}qed`);
  return proofLines;
}

function transformLine(line: string, state: TransformState): string[] {
  const { code, comment } = splitLineComment(line);
  const stripped = stripLeadingProofBars(code);
  const effectiveCode = stripped.code;
  const trimmed = effectiveCode.trim();
  if (!trimmed) {
    return [line];
  }

  const premiseMatch = effectiveCode.match(/^\s*(premise|premisa)\s+(.+?)\s*$/i);
  if (premiseMatch) {
    const rest = premiseMatch[2];
    const named = rest.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*[:=]\s*(.+?)\s*$/);
    const name = named?.[1] ?? nextCompatName(state, 'h');
    const formula = (named?.[2] ?? rest).trim();
    rememberFormula(state, name, formula, { local: true });
    state.hasPremiseBlock = true;
    return appendComment(
      [`${effectiveCode.match(/^\s*/)?.[0] ?? ''}assume ${name} : ${formula}`],
      comment,
    );
  }

  const assumeMatch = effectiveCode.match(/^\s*(assume|asumir)\s+(.+?)\s*$/i);
  if (assumeMatch) {
    const indent = effectiveCode.match(/^\s*/)?.[0] ?? '';
    const rest = assumeMatch[2].trim();
    const named = rest.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*[:=]\s*(.+?)\s*$/);
    const name = named?.[1] ?? nextCompatName(state, 'h');
    const formula = (named?.[2] ?? rest).trim();
    rememberFormula(state, name, formula, { local: true });
    return appendComment([`${indent}assume ${name} : ${formula}`], comment);
  }

  const conclusionMatch = effectiveCode.match(
    /^\s*(conclusion|conclusi(?:o|ó)n|therefore|por(?:\s+|_)tanto)\s+(.+?)\s*$/i,
  );
  if (conclusionMatch) {
    const indent = effectiveCode.match(/^\s*/)?.[0] ?? '';
    const goal = conclusionMatch[2].trim();

    if (state.hasPremiseBlock || state.localScope) {
      const lines = appendComment([`${indent}show ${goal}`, `${indent}qed`], comment);
      closeLocalScope(state);
      return lines;
    }

    const knownPremises = Array.from(state.knownFormulas.keys());
    if (knownPremises.length > 0) {
      return appendComment([`${indent}derive ${goal} from {${knownPremises.join(', ')}}`], comment);
    }

    return appendComment([`${indent}check valid ${goal}`], comment);
  }

  const turnstileMatch = effectiveCode.match(/^\s*(.*?)\s*\|-\s*(.+?)\s*$/);
  if (turnstileMatch) {
    const indent = effectiveCode.match(/^\s*/)?.[0] ?? '';
    const left = turnstileMatch[1].trim();
    const goal = turnstileMatch[2].trim();
    const premiseSource = left.startsWith('{') && left.endsWith('}') ? left.slice(1, -1) : left;
    const premises = splitTopLevel(premiseSource);

    if (premises.length === 0) {
      return appendComment([`${indent}check valid ${goal}`], comment);
    }

    return appendComment(buildStandaloneProof(goal, premises, indent, state), comment);
  }

  const deriveMatch = effectiveCode.match(
    /^\s*(derive|derivar|prove|probar)\s+(.+?)\s+(from|desde)\s+(\{.+\}|.+?)\s*$/i,
  );
  if (deriveMatch) {
    const indent = effectiveCode.match(/^\s*/)?.[0] ?? '';
    const command = deriveMatch[1].toLowerCase();
    const canonicalCommand = command === 'prove' || command === 'probar' ? 'prove' : 'derive';
    const goal = deriveMatch[2].trim();
    const premiseSource = deriveMatch[4].trim();
    const unwrappedPremiseSource =
      premiseSource.startsWith('{') && premiseSource.endsWith('}')
        ? premiseSource.slice(1, -1)
        : premiseSource;
    const premiseItems = splitTopLevel(unwrappedPremiseSource);
    // Determine whether each premise needs expansion:
    // - Non-identifier items (formulas with operators like "P -> Q"): always expand
    // - Bare atoms (BARE_ATOM_RE, e.g. P, Q): expand if NOT known in compat state
    //   (unknown bare atoms are inline formula premises, known ones are references to prior results)
    // - Non-bare identifiers (e.g. h1, a1): always pass through as names
    const requiresExpansion = premiseItems.some(
      (item) =>
        !IDENTIFIER_RE.test(item) || (BARE_ATOM_RE.test(item) && !state.knownFormulas.has(item)),
    );

    if (!requiresExpansion) {
      return appendComment(
        [`${indent}${canonicalCommand} ${goal} from {${premiseItems.join(', ')}}`],
        comment,
      );
    }

    const resolvedPremises = premiseItems.map((item) => {
      if (!IDENTIFIER_RE.test(item)) {
        return item;
      }
      if (state.knownFormulas.has(item)) {
        return state.knownFormulas.get(item) ?? null;
      }
      // Bare atom not in known formulas → treat as inline formula
      return BARE_ATOM_RE.test(item) ? item : null;
    });

    if (resolvedPremises.some((item) => item === null)) {
      return appendComment(
        [`${indent}${canonicalCommand} ${goal} from {${premiseItems.join(', ')}}`],
        comment,
      );
    }

    return appendComment(
      buildStandaloneProof(goal, resolvedPremises as string[], indent, state),
      comment,
    );
  }

  if (/^\s*qed\b/i.test(effectiveCode)) {
    const transformed = appendComment([effectiveCode.replace(/\bqed\b/i, 'qed')], comment);
    closeLocalScope(state);
    return transformed;
  }

  const namedFormula = extractNamedFormula(effectiveCode);
  if (namedFormula) {
    rememberFormula(state, namedFormula.name, namedFormula.formula);
  }

  return [line];
}

export function normalizeSTSource(source: string): string {
  const transformState = createTransformState();
  const normalized = normalizeUnicodeSyntax(source);
  const lines = normalized.split('\n');
  const transformed: string[] = [];
  let inBlockComment = false;
  let inDoubleBracket = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (inBlockComment) {
      transformed.push(line);
      if (line.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (inDoubleBracket) {
      transformed.push(line);
      if (line.includes(']]')) {
        inDoubleBracket = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
      inBlockComment = true;
      transformed.push(line);
      continue;
    }

    if (line.includes('[[') && !line.includes(']]')) {
      inDoubleBracket = true;
      transformed.push(line);
      continue;
    }

    transformed.push(...flushResolvablePendingDerivedSteps(transformState));
    const numberedLines = transformNumberedProofLine(line, transformState);
    if (numberedLines !== null) {
      transformed.push(...numberedLines);
      continue;
    }

    transformed.push(...flushCompatState(transformState));
    transformed.push(...transformLine(line, transformState));
  }

  transformed.push(...flushCompatState(transformState));
  for (const pending of transformState.pendingDerivedProofSteps) {
    transformed.push(pending.originalLine);
  }
  return transformed.join('\n');
}

export function createReplCompatState(): ReplCompatState {
  return {
    nextId: 1,
    pendingPremises: [],
    pendingBlockLines: [],
    pendingBlockBraceDepth: 0,
    pendingBlockProofDepth: 0,
    pendingBlockProofAwaitingShow: [],
  };
}

function analyzeReplBlockLine(line: string): { braceDelta: number; trimmed: string } {
  const { code } = splitLineComment(line);
  let braceDelta = 0;
  let inString = false;

  for (let index = 0; index < code.length; index += 1) {
    const current = code[index];
    if (inString) {
      if (current === '\\' && index + 1 < code.length) {
        index += 1;
        continue;
      }
      if (current === '"') {
        inString = false;
      }
      continue;
    }

    if (current === '"') {
      inString = true;
      continue;
    }

    if (current === '{') braceDelta += 1;
    if (current === '}') braceDelta -= 1;
  }

  return { braceDelta, trimmed: code.trim() };
}

function isReplMultilineStart(line: string): boolean {
  const { braceDelta, trimmed } = analyzeReplBlockLine(line);
  if (!trimmed) return false;
  if (/^(assume|asumir)\b/i.test(trimmed)) return true;
  return braceDelta > 0;
}

function appendReplBlockLine(state: ReplCompatState, line: string): boolean {
  state.pendingBlockLines.push(line);
  const { braceDelta, trimmed } = analyzeReplBlockLine(line);
  state.pendingBlockBraceDepth = Math.max(0, state.pendingBlockBraceDepth + braceDelta);

  if (/^(assume|asumir)\b/i.test(trimmed)) {
    const insideProofBody =
      state.pendingBlockProofDepth > 0 &&
      state.pendingBlockProofAwaitingShow[state.pendingBlockProofAwaitingShow.length - 1] === false;
    if (state.pendingBlockProofDepth === 0 || insideProofBody) {
      state.pendingBlockProofDepth += 1;
      state.pendingBlockProofAwaitingShow.push(true);
    }
  } else if (/^(show|demostrar)\b/i.test(trimmed)) {
    if (state.pendingBlockProofAwaitingShow.length > 0) {
      state.pendingBlockProofAwaitingShow[state.pendingBlockProofAwaitingShow.length - 1] = false;
    }
  } else if (/^qed\b/i.test(trimmed)) {
    if (state.pendingBlockProofDepth > 0) {
      state.pendingBlockProofDepth -= 1;
      state.pendingBlockProofAwaitingShow.pop();
    }
  }

  return state.pendingBlockBraceDepth === 0 && state.pendingBlockProofDepth === 0;
}

function consumeReplBlock(state: ReplCompatState): string {
  const source = state.pendingBlockLines.join('\n');
  state.pendingBlockLines = [];
  state.pendingBlockBraceDepth = 0;
  state.pendingBlockProofDepth = 0;
  state.pendingBlockProofAwaitingShow = [];
  return source;
}

export function transformReplInput(
  source: string,
  state: ReplCompatState,
  context?: ReplCompatContext,
): ReplTransformResult {
  const normalized = normalizeUnicodeSyntax(source);

  if (normalized.includes('\n')) {
    state.pendingBlockLines = [];
    state.pendingBlockBraceDepth = 0;
    state.pendingBlockProofDepth = 0;
    state.pendingBlockProofAwaitingShow = [];
    return { kind: 'executeSingle', source: normalizeSTSource(normalized) };
  }

  if (state.pendingBlockLines.length > 0) {
    if (appendReplBlockLine(state, normalized)) {
      return {
        kind: 'executeSingle',
        source: normalizeSTSource(consumeReplBlock(state)),
      };
    }
    return {
      kind: 'buffered',
      source: '',
      message: `Bloque multilinea en curso (${state.pendingBlockLines.length} lineas)...`,
    };
  }

  const trimmed = normalized.trim();
  const premiseMatch = trimmed.match(/^(premise|premisa)\s+(.+?)\s*$/i);
  if (premiseMatch) {
    const rest = premiseMatch[2];
    const named = rest.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*[:=]\s*(.+?)\s*$/);
    const name = named?.[1] ?? `__compat_repl_${state.nextId++}`;
    const formula = (named?.[2] ?? rest).trim();

    state.pendingPremises.push({ name, formula });
    return {
      kind: 'buffered',
      source: '',
      message: `Premisa registrada: ${formula}`,
    };
  }

  const conclusionMatch = trimmed.match(
    /^(conclusion|conclusi(?:o|ó)n|therefore|por(?:\s+|_)tanto)\s+(.+?)\s*$/i,
  );
  if (conclusionMatch && state.pendingPremises.length > 0) {
    const goal = conclusionMatch[2].trim();
    const proof = [
      ...state.pendingPremises.map((premise) => `assume ${premise.name} : ${premise.formula}`),
      `show ${goal}`,
      'qed',
    ].join('\n');

    state.pendingPremises = [];
    return { kind: 'execute', source: proof };
  }

  if (conclusionMatch) {
    const goal = conclusionMatch[2].trim();
    const knownPremises = context?.knownPremises ?? [];
    if (knownPremises.length > 0) {
      return {
        kind: 'executeSingle',
        source: `derive ${goal} from {${knownPremises.join(', ')}}`,
      };
    }
    return {
      kind: 'executeSingle',
      source: `check valid ${goal}`,
    };
  }

  if (isReplMultilineStart(normalized)) {
    if (appendReplBlockLine(state, normalized)) {
      return {
        kind: 'executeSingle',
        source: normalizeSTSource(consumeReplBlock(state)),
      };
    }
    return {
      kind: 'buffered',
      source: '',
      message: `Bloque multilinea en curso (${state.pendingBlockLines.length} lineas)...`,
    };
  }

  return { kind: 'executeSingle', source: normalizeSTSource(normalized) };
}
