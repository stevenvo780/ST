import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createInterpreter, evaluate } from '../api';

interface STIntegrationFixture {
  id: string;
  source: string;
  expectedStatus: string;
  expectedProofMethod?: string;
  expectedJustifications?: string[];
}

const fixtures = JSON.parse(
  readFileSync(
    path.resolve(process.cwd(), '../packages/agora-contracts/fixtures/st-integration.json'),
    'utf8',
  ),
) as STIntegrationFixture[];

describe('Agora integration fixtures', () => {
  for (const fixture of fixtures) {
    it(fixture.id, () => {
      const result = evaluate(fixture.source);
      expect(result.ok).toBe(true);
      expect(result.diagnostics).toHaveLength(0);
      expect(result.results[0]?.status).toBe(fixture.expectedStatus);
      if (fixture.expectedProofMethod) {
        expect(result.results[0]?.proof?.method).toBe(fixture.expectedProofMethod);
      }
      for (const justification of fixture.expectedJustifications ?? []) {
        expect(
          result.results[0]?.proof?.steps.some((step) => step.justification === justification),
        ).toBe(true);
      }
    });
  }

  it('createInterpreter mantiene compatibilidad con el flujo que consume AgoraFront', () => {
    const st = createInterpreter();
    const result = st.exec(
      fixtures[0]?.source ?? 'logic classical.propositional\ncheck valid (P -> P)',
    );
    expect(result.ok).toBe(true);
    expect(result.results[0]?.status).toBe(fixtures[0]?.expectedStatus ?? 'valid');
  });
});
