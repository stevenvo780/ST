import { describe, expect, it } from 'vitest';

import { ProtocolHandler } from '../protocol/handler';
import { createTextLayerState, parseAnchorPath, registerPassage } from '../text-layer/compiler';

describe('ProtocolHandler validation', () => {
  it('rechaza params invalidos antes de despachar', () => {
    const handler = new ProtocolHandler();
    const response = handler.handle({
      id: 1,
      method: 'parse',
      params: { source: 42 },
    });

    expect(response.error?.code).toBe(-32602);
    expect(response.error?.message).toContain("'source'");
  });

  it('rechaza line y column invalidos en hover', () => {
    const handler = new ProtocolHandler();
    const response = handler.handle({
      id: 2,
      method: 'hover',
      params: { source: 'logic classical.propositional', line: 0, column: -1 },
    });

    expect(response.error?.code).toBe(-32602);
    expect(response.error?.message).toContain("'line'");
  });
});

describe('Text layer anchor validation', () => {
  it('parsea anchors validos con tipado robusto', () => {
    expect(parseAnchorPath('clase.md#h2-intro')).toEqual({
      path: 'clase.md',
      fragment: 'h2-intro',
      type: 'heading',
    });
    expect(parseAnchorPath('clase.md#p3')).toEqual({
      path: 'clase.md',
      fragment: 'p3',
      type: 'paragraph',
    });
  });

  it('rechaza anchors invalidos', () => {
    expect(() => parseAnchorPath('')).toThrow();
    expect(() => parseAnchorPath('###')).toThrow();
    expect(() => parseAnchorPath('doc.md#a#b')).toThrow();
  });

  it('devuelve diagnosticos en registerPassage si el anchor es invalido', () => {
    const state = createTextLayerState();
    const diagnostics = registerPassage(state, 'p1', '###');

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe('error');
    expect(state.passages.size).toBe(0);
  });
});
