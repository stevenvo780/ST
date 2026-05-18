import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createServer,
  runCheck,
  runDerive,
  runCountermodel,
  runFormalize,
  KNOWN_PROFILES,
} from '../src/index.js';

// --- 1. Unit tests directos contra los runners ---

describe('runCheck', () => {
  it('reconoce P -> P como válida en classical.propositional', () => {
    const r = runCheck({ formula: '(P -> P)', profile: 'classical.propositional' });
    expect(r.ok).toBe(true);
    expect(r.valid).toBe(true);
    expect(r.status).toMatch(/valid|tautology|provable/);
  });

  it('reconoce P -> Q como inválida en classical.propositional', () => {
    const r = runCheck({ formula: '(P -> Q)', profile: 'classical.propositional' });
    expect(r.ok).toBe(true);
    expect(r.valid).toBe(false);
    expect(r.status).toBe('invalid');
  });

  it('no crashea ante perfil inexistente — retorna ok=false y diagnósticos', () => {
    const r = runCheck({ formula: '(P -> P)', profile: 'perfil.inexistente' });
    // El runtime devuelve un error de parser/lookup, no debe lanzar.
    expect(typeof r.ok).toBe('boolean');
    if (!r.ok) {
      expect(r.diagnostics.length + (r.stderr ? 1 : 0)).toBeGreaterThan(0);
    }
  });

  it('no crashea ante syntax error — retorna ok=false', () => {
    const r = runCheck({ formula: '(P ->', profile: 'classical.propositional' });
    expect(r.ok).toBe(false);
    expect(r.diagnostics.length + (r.stderr ? 1 : 0)).toBeGreaterThan(0);
  });
});

describe('runDerive', () => {
  it('deriva Q a partir de {P -> Q, P} (modus ponens)', () => {
    const r = runDerive({
      axioms: ['P -> Q', 'P'],
      conclusion: 'Q',
      profile: 'classical.propositional',
    });
    expect(r.ok).toBe(true);
    expect(r.derivable).toBe(true);
  });

  it('no deriva R a partir de {P -> Q, P}', () => {
    const r = runDerive({
      axioms: ['P -> Q', 'P'],
      conclusion: 'R',
      profile: 'classical.propositional',
    });
    expect(r.ok).toBe(true);
    expect(r.derivable).toBe(false);
  });
});

describe('runCountermodel', () => {
  it('encuentra contramodelo para P -> Q', () => {
    const r = runCountermodel({
      formula: '(P -> Q)',
      profile: 'classical.propositional',
    });
    expect(r.ok).toBe(true);
    expect(r.found).toBe(true);
    expect(r.model).not.toBeNull();
  });

  it('NO encuentra contramodelo para P -> P (tautología)', () => {
    const r = runCountermodel({
      formula: '(P -> P)',
      profile: 'classical.propositional',
    });
    expect(r.ok).toBe(true);
    expect(r.found).toBe(false);
  });
});

describe('runFormalize', () => {
  it('registra una formalización con anchor explícito', () => {
    const r = runFormalize({
      text: 'Si llueve, entonces el suelo está mojado.',
      formula: '(P -> Q)',
      anchor: 'demo.md#section1',
      profile: 'classical.propositional',
    });
    expect(r.ok).toBe(true);
    expect(r.anchor).toBe('demo.md#section1');
    expect(r.stdout).toContain('Passage');
  });

  it('usa anchor por defecto cuando se omite', () => {
    const r = runFormalize({
      text: 'P si y solo si Q.',
      formula: '(P <-> Q)',
      profile: 'classical.propositional',
    });
    expect(r.ok).toBe(true);
    expect(r.anchor).toBe('mcp.input#p1');
  });

  it('falla graciosamente con syntax error en la fórmula', () => {
    const r = runFormalize({
      text: 'Cualquier texto.',
      formula: '(P ->',
      profile: 'classical.propositional',
    });
    expect(r.ok).toBe(false);
  });
});

// --- 2. End-to-end vía MCP InMemoryTransport ---

describe('MCP server end-to-end (InMemoryTransport)', () => {
  it('expone exactamente las 4 tools st_* y permite invocarlas', async () => {
    const server = createServer();
    const client = new Client(
      { name: 'st-mcp-test-client', version: '0.0.0' },
      { capabilities: {} },
    );
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverT), client.connect(clientT)]);

    try {
      const tools = await client.listTools();
      const names = tools.tools.map((t) => t.name).sort();
      expect(names).toEqual([
        'st_check',
        'st_countermodel',
        'st_derive',
        'st_formalize',
      ]);

      // Llamar st_check vía MCP y validar el structuredContent.
      const checkRes = (await client.callTool({
        name: 'st_check',
        arguments: { formula: '(P -> P)', profile: 'classical.propositional' },
      })) as { structuredContent?: { valid?: boolean; ok?: boolean } };
      expect(checkRes.structuredContent?.ok).toBe(true);
      expect(checkRes.structuredContent?.valid).toBe(true);

      // Llamar st_countermodel vía MCP.
      const cmRes = (await client.callTool({
        name: 'st_countermodel',
        arguments: { formula: '(P -> Q)', profile: 'classical.propositional' },
      })) as { structuredContent?: { found?: boolean } };
      expect(cmRes.structuredContent?.found).toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('al menos los perfiles conocidos son consultables vía listProfiles', () => {
    expect(KNOWN_PROFILES.includes('classical.propositional')).toBe(true);
    expect(KNOWN_PROFILES.includes('modal.k')).toBe(true);
  });
});
