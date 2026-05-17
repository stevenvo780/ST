import { describe, expect, it } from 'vitest';

import {
  claimsToMDX,
  diffMDX,
  mdxToClaims,
  mdxToClaimsDetailed,
  stripMDXMetadata,
  type Claim,
} from '../../../text-layer/v2';

const mk = (
  id: string,
  formula = `F_${id}`,
  profile = 'classical.propositional',
  dependencies: string[] = [],
): Claim => ({ id, formula, profile, dependencies });

describe('mdxToClaims — comment style', () => {
  it('extrae 2 claims comment-style con ids correctos', () => {
    const mdx = [
      '# Documento',
      'Aquí afirmo que <!-- st:claim id="c1" profile="classical.propositional" formula="A->B" --> es válido.',
      '',
      'Y también que <!-- st:claim id="c2" profile="classical.propositional" formula="B->C" deps="c1" --> sigue.',
    ].join('\n');

    const claims = mdxToClaims(mdx);
    expect(claims).toHaveLength(2);
    expect(claims.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(claims[0]?.formula).toBe('A->B');
    expect(claims[1]?.dependencies).toEqual(['c1']);
    expect(claims[0]?.profile).toBe('classical.propositional');
  });

  it('soporta comillas simples y sin comillas en atributos', () => {
    const mdx = `<!-- st:claim id='c1' profile=classical formula="A&B" -->`;
    const claims = mdxToClaims(mdx);
    expect(claims).toHaveLength(1);
    expect(claims[0]?.id).toBe('c1');
    expect(claims[0]?.profile).toBe('classical');
    expect(claims[0]?.formula).toBe('A&B');
  });
});

describe('mdxToClaims — fence style', () => {
  it('extrae 3 claims fence-style', () => {
    const mdx = [
      '# Doc',
      '',
      '```st-claim id=c1 profile=classical.propositional',
      'A -> B',
      '```',
      '',
      'Prosa intermedia.',
      '',
      '```st-claim id=c2 profile=classical.propositional deps=c1',
      '(A -> B) & A',
      '```',
      '',
      '```st-claim id=c3 profile=classical.propositional deps=c1,c2',
      'B',
      '```',
    ].join('\n');

    const claims = mdxToClaims(mdx);
    expect(claims).toHaveLength(3);
    expect(claims.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
    expect(claims[2]?.dependencies).toEqual(['c1', 'c2']);
    expect(claims[1]?.formula).toBe('(A -> B) & A');
  });

  it('preserva formula multi-línea en fence', () => {
    const mdx = ['```st-claim id=c1 profile=p', 'A & B', '& C', '```'].join('\n');
    const claims = mdxToClaims(mdx);
    expect(claims).toHaveLength(1);
    expect(claims[0]?.formula).toBe('A & B\n& C');
  });
});

describe('mdxToClaims — edge cases', () => {
  it('MDX sin claims devuelve array vacío', () => {
    expect(mdxToClaims('# Solo prosa\n\nNada aquí.')).toEqual([]);
    expect(mdxToClaims('')).toEqual([]);
  });

  it('ignora bloque malformado sin id y acumula warning', () => {
    const mdx = [
      '<!-- st:claim profile="p" formula="A" -->', // sin id
      '<!-- st:claim id="ok" profile="p" formula="B" -->',
    ].join('\n');
    const { claims, warnings } = mdxToClaimsDetailed(mdx);
    expect(claims).toHaveLength(1);
    expect(claims[0]?.id).toBe('ok');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toMatch(/sin id/);
  });

  it('ignora fence sin profile y acumula warning', () => {
    const mdx = ['```st-claim id=c1', 'A', '```'].join('\n');
    const { claims, warnings } = mdxToClaimsDetailed(mdx);
    expect(claims).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toMatch(/sin profile/);
  });

  it('ignora claim duplicada y acumula warning', () => {
    const mdx = [
      '<!-- st:claim id="c1" profile="p" formula="A" -->',
      '<!-- st:claim id="c1" profile="p" formula="B" -->',
    ].join('\n');
    const { claims, warnings } = mdxToClaimsDetailed(mdx);
    expect(claims).toHaveLength(1);
    expect(claims[0]?.formula).toBe('A');
    expect(warnings.some((w) => /duplicado/.test(w.message))).toBe(true);
  });

  it('no lanza con MDX completamente roto', () => {
    expect(() => mdxToClaims('<!-- st:claim incompleto')).not.toThrow();
    expect(() => mdxToClaims('```st-claim sin-cierre\nA')).not.toThrow();
  });

  it('rawBlock preserva el texto original del bloque', () => {
    const block = '<!-- st:claim id="c1" profile="p" formula="A" -->';
    const claims = mdxToClaims(`pre ${block} post`);
    expect(claims[0]?.rawBlock).toBe(block);
  });
});

describe('claimsToMDX', () => {
  it('emite formato fence por default', () => {
    const out = claimsToMDX([mk('c1', 'A->B')]);
    expect(out).toContain('```st-claim');
    expect(out).toContain('id=c1');
    expect(out).toContain('A->B');
    expect(out.trim().endsWith('```')).toBe(true);
  });

  it('emite formato comment cuando se pide', () => {
    const out = claimsToMDX([mk('c1', 'A->B')], { template: 'comment' });
    expect(out).toContain('<!-- st:claim');
    expect(out).toContain('id="c1"');
    expect(out).toContain('formula="A->B"');
    expect(out).toContain('-->');
  });

  it('serializa dependencies como csv', () => {
    const out = claimsToMDX([mk('c2', 'B', 'p', ['c1', 'c0'])], { template: 'comment' });
    expect(out).toContain('deps="c1,c0"');
  });

  it('omite deps cuando está vacío', () => {
    const out = claimsToMDX([mk('c1', 'A')], { template: 'comment' });
    expect(out).not.toContain('deps=');
  });
});

describe('round-trip claimsToMDX → mdxToClaims', () => {
  const sample: Claim[] = [
    mk('c1', 'A -> B', 'classical.propositional', []),
    mk('c2', '(A -> B) & A', 'classical.propositional', ['c1']),
    mk('c3', 'B', 'classical.propositional', ['c1', 'c2']),
  ];

  it('preserva claims con template fence', () => {
    const mdx = claimsToMDX(sample, { template: 'fence' });
    const parsed = mdxToClaims(mdx).map(stripMDXMetadata);
    expect(parsed).toEqual(sample);
  });

  it('preserva claims con template comment', () => {
    const mdx = claimsToMDX(sample, { template: 'comment' });
    const parsed = mdxToClaims(mdx).map(stripMDXMetadata);
    expect(parsed).toEqual(sample);
  });
});

describe('diffMDX', () => {
  it('detecta add, modify y remove correctamente', () => {
    const before = claimsToMDX(
      [mk('c1', 'A', 'p', []), mk('c2', 'B', 'p', ['c1']), mk('c3', 'C', 'p', [])],
      { template: 'fence' },
    );
    const after = claimsToMDX(
      [
        mk('c1', 'A', 'p', []), // sin cambios
        mk('c2', 'B & X', 'p', ['c1']), // modificada
        // c3 eliminada
        mk('c4', 'D', 'p', ['c1']), // añadida
      ],
      { template: 'fence' },
    );

    const delta = diffMDX(before, after);
    expect(delta.added.map((c) => c.id)).toEqual(['c4']);
    expect(delta.removed).toEqual(['c3']);
    expect(delta.modified.map((m) => m.id)).toEqual(['c2']);
    expect(delta.modified[0]?.before.formula).toBe('B');
    expect(delta.modified[0]?.after.formula).toBe('B & X');
  });

  it('cambio en profile cuenta como modified', () => {
    const before = claimsToMDX([mk('c1', 'A', 'classical.propositional', [])]);
    const after = claimsToMDX([mk('c1', 'A', 'intuitionistic.propositional', [])]);
    const delta = diffMDX(before, after);
    expect(delta.modified).toHaveLength(1);
    expect(delta.added).toEqual([]);
    expect(delta.removed).toEqual([]);
  });

  it('cambio en dependencies cuenta como modified', () => {
    const before = claimsToMDX([mk('c1', 'A', 'p', ['x'])]);
    const after = claimsToMDX([mk('c1', 'A', 'p', ['x', 'y'])]);
    const delta = diffMDX(before, after);
    expect(delta.modified).toHaveLength(1);
    expect(delta.modified[0]?.after.dependencies).toEqual(['x', 'y']);
  });

  it('orden de dependencies no cuenta como modified', () => {
    const before = claimsToMDX([mk('c1', 'A', 'p', ['x', 'y'])]);
    const after = claimsToMDX([mk('c1', 'A', 'p', ['y', 'x'])]);
    const delta = diffMDX(before, after);
    expect(delta.modified).toEqual([]);
  });

  it('MDX idéntico → delta vacío', () => {
    const mdx = claimsToMDX([mk('c1', 'A', 'p', []), mk('c2', 'B', 'p', ['c1'])]);
    expect(diffMDX(mdx, mdx)).toEqual({ added: [], removed: [], modified: [] });
  });

  it('mezcla comment y fence en mismo MDX', () => {
    const mdx = [
      '<!-- st:claim id="c1" profile="p" formula="A" -->',
      '',
      '```st-claim id=c2 profile=p deps=c1',
      'B',
      '```',
    ].join('\n');
    const claims = mdxToClaims(mdx);
    expect(claims).toHaveLength(2);
    expect(claims.map((c) => c.id)).toEqual(['c1', 'c2']);
  });
});
