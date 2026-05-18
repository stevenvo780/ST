// ============================================================
// ST dL-Hybrid — Tests sobre los ejemplos canónicos del directorio
// ============================================================
// Versiones programáticas de thermostat.dl, water-tank.dl y traffic-light.dl
// que verifican que el motor valida (o refuta correctamente) las
// propiedades documentadas en cada archivo.

import { describe, it, expect } from 'vitest';
import { parseFormula } from '../parser';
import { checkValid } from '../tableau';
import { DLHybridProfile } from '../profile';

describe('dl-hybrid examples — thermostat', () => {
  // [ ?(t >= 18); {t' = -1 & t > 17} ] t >= 17
  // El dominio t > 17 fuerza que la evolución se detenga antes de que
  // t baje de 17 (estricto), así la post-condición t ≥ 17 se cumple en
  // todos los puntos del rango.
  it('temperatura no cae bajo 17 si arranca >= 18 con t apagado y dominio t > 17', () => {
    const res = checkValid(parseFormula("[ ?(t >= 18); {t' = -1 & t > 17} ] t >= 17"));
    expect(res.status).toBe('valid');
  });
});

describe('dl-hybrid examples — water-tank', () => {
  // Versión simplificada: si el sensor dispara la apertura, el tanque
  // no se desborda mientras el dominio guarda x < 10.
  it('tanque no desborda con válvula abierta y dominio x < 10', () => {
    const res = checkValid(parseFormula("[ ?(x <= 1); v := 1; {x' = 2 & x < 10} ] x <= 10"));
    expect(res.status).toBe('valid');
  });
});

describe('dl-hybrid examples — traffic-light', () => {
  // Invariante de mutua exclusión: cada transición preserva g + y + r = 1.
  // Probamos desde estados específicos para evitar la malla con todos
  // los valores cubriendo cero/uno (la malla por defecto incluiría
  // muchos estados sin sentido para este ejemplo).
  it('transición verde → amarillo preserva g + y + r = 1', () => {
    // pre: g = 1 & y = 0 & r = 0
    // tras g := 0; y := 1 queda (0,1,0) → suma 1.
    const res = checkValid(
      parseFormula('g = 1 & y = 0 & r = 0 -> [ g := 0; y := 1 ] g + y + r = 1'),
    );
    expect(res.status).toBe('valid');
  });

  it('transición amarillo → rojo preserva g + y + r = 1', () => {
    const res = checkValid(
      parseFormula('g = 0 & y = 1 & r = 0 -> [ y := 0; r := 1 ] g + y + r = 1'),
    );
    expect(res.status).toBe('valid');
  });
});

describe('dl-hybrid profile — adapter smoke', () => {
  it('explainSystem describe el sistema correctamente', () => {
    const p = new DLHybridProfile();
    const desc = p.explainSystem();
    expect(desc).toContain('dL');
    expect(desc).toContain('híbridos');
  });
});
