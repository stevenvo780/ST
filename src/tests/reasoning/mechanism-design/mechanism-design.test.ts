import { describe, it, expect } from 'vitest';
import {
  vcgMechanism,
  socialWelfare,
  isStrategyProof,
  firstPriceSealed,
  secondPriceSealed,
  englishAuction,
  dutchAuction,
  myersonOptimal,
  virtualValuation,
  findReserve,
  expectedRevenue,
  uniformDistribution,
  type Agent,
  type BidderDistribution,
} from '../../../reasoning/mechanism-design';

function agent(id: string, vals: Record<string, number>): Agent {
  return { id, valuation: new Map(Object.entries(vals)) };
}

describe('mechanism-design — VCG', () => {
  it('VCG con 3 agents y 1 item: gana el de mayor valor, paga el segundo', () => {
    const items = ['item'];
    const agents = [agent('a', { item: 10 }), agent('b', { item: 5 }), agent('c', { item: 3 })];
    const out = vcgMechanism(agents, items);
    expect(out.allocation.get('a')).toBe('item');
    expect(out.allocation.has('b')).toBe(false);
    expect(out.allocation.has('c')).toBe(false);
    // Payment de 'a' = welfare otros sin 'a' (b se queda con item, valor 5)
    //                 - welfare otros en alloc (b,c sin nada → 0) = 5.
    expect(out.payments.get('a')).toBe(5);
    expect(out.payments.get('b')).toBe(0);
    expect(out.payments.get('c')).toBe(0);
  });

  it('VCG con 2 agents y 2 items: cada uno se lleva su preferido', () => {
    const items = ['x', 'y'];
    const agents = [agent('a', { x: 10, y: 2 }), agent('b', { x: 1, y: 8 })];
    const out = vcgMechanism(agents, items);
    expect(out.allocation.get('a')).toBe('x');
    expect(out.allocation.get('b')).toBe('y');
    // welfare óptimo sin 'a' = b se lleva y (8) o x (1) → 8. En alloc, b=8.
    // Externalidad de 'a' = 8 - 8 = 0. (no impide a 'b').
    expect(out.payments.get('a')).toBe(0);
    expect(out.payments.get('b')).toBe(0);
  });

  it('VCG maximiza social welfare', () => {
    const items = ['a', 'b'];
    const agents = [
      agent('p', { a: 9, b: 1 }),
      agent('q', { a: 3, b: 7 }),
      agent('r', { a: 2, b: 4 }),
    ];
    const out = vcgMechanism(agents, items);
    const welfare = socialWelfare(out, agents);
    expect(welfare).toBe(9 + 7); // p:a (9), q:b (7).
  });

  it('VCG es strategy-proof (verificación empírica)', () => {
    const sp = isStrategyProof((ags) => vcgMechanism(ags, ['x', 'y']), 100);
    expect(sp).toBe(true);
  });

  it('VCG combinatorial: 2 agents, 2 items, valuations sobre bundles', () => {
    const items = ['A', 'B'];
    const agents = [
      // 'p' valora el bundle entero más alto que cualquier item individual.
      agent('p', { A: 4, B: 4, 'A+B': 15 }),
      agent('q', { A: 5, B: 5, 'A+B': 6 }),
    ];
    const out = vcgMechanism(agents, items);
    // Óptimo: p se queda con A+B (welfare 15) vs split (4+5? — p:B=4, q:A=5 → 9).
    expect(out.allocation.get('p')).toBe('A+B');
    expect(out.allocation.has('q')).toBe(false);
    // Sin p: q se queda con A+B (6). En alloc q tiene 0. Pago p = 6.
    expect(out.payments.get('p')).toBe(6);
  });

  it('VCG: agente con valuation 0 no recibe nada', () => {
    const items = ['x'];
    const agents = [agent('a', { x: 0 }), agent('b', { x: 5 })];
    const out = vcgMechanism(agents, items);
    expect(out.allocation.get('b')).toBe('x');
    expect(out.allocation.has('a')).toBe(false);
    expect(out.payments.get('b')).toBe(0);
  });
});

describe('mechanism-design — sealed-bid auctions', () => {
  it('First-price: gana max bid y paga su propio bid', () => {
    const bids = new Map([
      ['a', 7],
      ['b', 5],
      ['c', 3],
    ]);
    const r = firstPriceSealed(bids);
    expect(r.winner).toBe('a');
    expect(r.payment).toBe(7);
  });

  it('Second-price (Vickrey): gana max bid y paga el segundo', () => {
    const bids = new Map([
      ['a', 10],
      ['b', 7],
      ['c', 3],
    ]);
    const r = secondPriceSealed(bids);
    expect(r.winner).toBe('a');
    expect(r.payment).toBe(7);
  });

  it('Second-price = VCG cuando hay un solo item', () => {
    const items = ['item'];
    const agents = [agent('a', { item: 10 }), agent('b', { item: 7 }), agent('c', { item: 3 })];
    const vcg = vcgMechanism(agents, items);
    const bids = new Map([
      ['a', 10],
      ['b', 7],
      ['c', 3],
    ]);
    const sp = secondPriceSealed(bids);
    expect(sp.winner).toBe('a');
    expect(sp.payment).toBe(vcg.payments.get('a'));
  });

  it('Auctions sin bidders válidos: no hay ganador', () => {
    const empty = new Map<string, number>();
    expect(firstPriceSealed(empty).winner).toBe('');
    expect(secondPriceSealed(empty).winner).toBe('');
    expect(firstPriceSealed(empty).payment).toBe(0);
    expect(secondPriceSealed(empty).payment).toBe(0);
  });

  it('Second-price con un solo bidder: paga 0', () => {
    const bids = new Map([['solo', 5]]);
    const r = secondPriceSealed(bids);
    expect(r.winner).toBe('solo');
    expect(r.payment).toBe(0);
  });
});

describe('mechanism-design — English and Dutch', () => {
  it('English ascending termina cuando el 2do desiste — paga ≈ 2do precio', () => {
    const bids = new Map([
      ['a', 10],
      ['b', 7],
      ['c', 4],
    ]);
    const r = englishAuction(bids, 1);
    expect(r.winner).toBe('a');
    // increment=1, second=7 → cae en grid → paga exactamente 7.
    expect(r.payment).toBe(7);
  });

  it('English con increment grande: paga next step sobre el 2do precio', () => {
    const bids = new Map([
      ['a', 100],
      ['b', 65],
    ]);
    const r = englishAuction(bids, 10);
    expect(r.winner).toBe('a');
    // second=65 no es múltiplo de 10 → paga 70.
    expect(r.payment).toBe(70);
  });

  it('Dutch descending equivale a first-price', () => {
    // Si cada bidder está dispuesto a aceptar a su valuation,
    // el primero en cruzar el precio es el de mayor valuation.
    const bidders = new Map([
      ['a', 10],
      ['b', 7],
      ['c', 4],
    ]);
    const r = dutchAuction(20, bidders, 1);
    expect(r.winner).toBe('a');
    // Reloj parte de 20, baja a 10 → 'a' acepta.
    expect(r.payment).toBe(10);
  });

  it('Dutch sin nadie dispuesto: no se vende', () => {
    const bidders = new Map<string, number>();
    const r = dutchAuction(10, bidders, 1);
    expect(r.winner).toBe('');
    expect(r.payment).toBe(0);
  });
});

describe('mechanism-design — Myerson optimal auction', () => {
  it('virtualValuation: para uniform[0,1], φ(v) = 2v - 1', () => {
    const u = uniformDistribution(0, 1);
    expect(virtualValuation(0.5, u)).toBeCloseTo(0, 9);
    expect(virtualValuation(0.75, u)).toBeCloseTo(0.5, 9);
    expect(virtualValuation(0.25, u)).toBeCloseTo(-0.5, 9);
  });

  it('findReserve uniform[0,1] = 1/2', () => {
    const u = uniformDistribution(0, 1);
    expect(findReserve(u)).toBeCloseTo(0.5, 6);
  });

  it('Myerson con bids sobre reserve: gana el mayor, paga max(2do, reserve)', () => {
    const u = uniformDistribution(0, 1);
    const dists = new Map<string, BidderDistribution>([
      ['a', u],
      ['b', u],
      ['c', u],
    ]);
    const bids = new Map([
      ['a', 0.9],
      ['b', 0.7],
      ['c', 0.3],
    ]);
    const r = myersonOptimal(bids, dists);
    expect(r.winner).toBe('a');
    // φ_a = 2*0.9-1 = 0.8; φ_b = 2*0.7-1 = 0.4; φ_c = -0.4
    // payment = invertVirtual(target=0.4) = 0.7. > reserve 0.5 → 0.7.
    expect(r.payment).toBeCloseTo(0.7, 4);
    expect(r.reserve).toBeCloseTo(0.5, 4);
  });

  it('Myerson sin nadie sobre reserve: no se vende', () => {
    const u = uniformDistribution(0, 1);
    const dists = new Map<string, BidderDistribution>([
      ['a', u],
      ['b', u],
    ]);
    const bids = new Map([
      ['a', 0.3],
      ['b', 0.2],
    ]);
    const r = myersonOptimal(bids, dists);
    expect(r.winner).toBe('');
    expect(r.payment).toBe(0);
    expect(r.reserve).toBeCloseTo(0.5, 4);
  });

  it('Myerson con 1 bidder sobre reserve: paga el reserve', () => {
    const u = uniformDistribution(0, 1);
    const dists = new Map<string, BidderDistribution>([
      ['a', u],
      ['b', u],
    ]);
    const bids = new Map([
      ['a', 0.8],
      ['b', 0.2],
    ]);
    const r = myersonOptimal(bids, dists);
    expect(r.winner).toBe('a');
    // φ_b = -0.6, target = max(-0.6, 0) = 0 → paga reserve = 0.5.
    expect(r.payment).toBeCloseTo(0.5, 4);
  });
});

describe('mechanism-design — revenue equivalence', () => {
  it('Revenue equivalence: 1st-price (con shading) ≈ 2nd-price truthful', () => {
    // Setup: 2 bidders IID uniform[0,1]. Equilibrio simétrico de
    // 1st-price: b(v) = (n-1)/n · v = v/2. Para 2nd-price es v.
    const u = uniformDistribution(0, 1);
    const dists = new Map<string, BidderDistribution>([
      ['a', u],
      ['b', u],
    ]);

    // 1st-price con shading aplicado a las valuations sampleadas.
    const firstPriceWithShade = (bids: Map<string, number>) => {
      const shaded = new Map<string, number>();
      for (const [id, v] of bids) shaded.set(id, v * 0.5);
      return firstPriceSealed(shaded);
    };

    const rev1 = expectedRevenue(firstPriceWithShade, dists, 4000);
    const rev2 = expectedRevenue(secondPriceSealed, dists, 4000);

    // Ambos deberían dar ~1/3 (resultado clásico para n=2, uniform[0,1]).
    // Banda ancha por Monte Carlo (4k samples).
    expect(rev1).toBeGreaterThan(0.27);
    expect(rev1).toBeLessThan(0.4);
    expect(rev2).toBeGreaterThan(0.27);
    expect(rev2).toBeLessThan(0.4);
    expect(Math.abs(rev1 - rev2)).toBeLessThan(0.05);
  });

  it('Myerson optimal supera (o iguala) a 2nd-price sin reserve en expected revenue', () => {
    const u = uniformDistribution(0, 1);
    const dists = new Map<string, BidderDistribution>([
      ['a', u],
      ['b', u],
    ]);
    const myer = expectedRevenue(
      (bids) => {
        const r = myersonOptimal(bids, dists);
        return { winner: r.winner, payment: r.payment };
      },
      dists,
      4000,
    );
    const second = expectedRevenue(secondPriceSealed, dists, 4000);
    // Myerson > 2nd-price (reserve eleva el precio mínimo).
    // Para n=2 uniform[0,1]: 2nd-price = 1/3 ≈ 0.333; Myerson = 5/12 ≈ 0.417.
    expect(myer).toBeGreaterThan(second - 0.02);
  });
});

describe('mechanism-design — invariants', () => {
  it('VCG payments son no-negativos para valuations no-negativas', () => {
    const items = ['x', 'y', 'z'];
    const agents = [
      agent('a', { x: 7, y: 3, z: 1 }),
      agent('b', { x: 4, y: 8, z: 2 }),
      agent('c', { x: 1, y: 1, z: 9 }),
    ];
    const out = vcgMechanism(agents, items);
    for (const p of out.payments.values()) {
      expect(p).toBeGreaterThanOrEqual(-1e-9);
    }
  });

  it('Allocation de VCG no asigna el mismo item a dos agentes', () => {
    const items = ['x', 'y'];
    const agents = [
      agent('a', { x: 5, y: 5 }),
      agent('b', { x: 5, y: 5 }),
      agent('c', { x: 5, y: 5 }),
    ];
    const out = vcgMechanism(agents, items);
    const assigned = [...out.allocation.values()];
    const unique = new Set(assigned);
    expect(unique.size).toBe(assigned.length);
  });
});
