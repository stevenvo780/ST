// ============================================================
// CSP Hoare — Ejemplos estándar del libro de Hoare (1985)
// ============================================================
// Construcciones canónicas que también sirven como tests integradores
// de la semántica.
// ============================================================

import type { Process, Event } from './types';
import { STOP, choice, parallel, prefix, recursion, processVar } from './semantics';

/**
 * Máquina expendedora simple: acepta una moneda y luego ofrece al
 * entorno elegir entre té y café.
 *
 *   VM = coin → ((tea → STOP) □ (coffee → STOP))
 *
 * Para uso en bucle infinito, ver `vendingMachineLoop`.
 */
export function vendingMachine(): Process {
  return prefix('coin', choice(prefix('tea', STOP), prefix('coffee', STOP)));
}

/** Versión recursiva: tras servir, vuelve al estado inicial. */
export function vendingMachineLoop(): Process {
  return recursion(
    'VM',
    prefix('coin', choice(prefix('tea', processVar('VM')), prefix('coffee', processVar('VM')))),
  );
}

/**
 * Filósofo `i` (dining philosophers a la Hoare): toma su tenedor
 * izquierdo (`L`), luego el derecho (`R`), come, los suelta y repite.
 *
 *   PHIL_i = picks_up.L → picks_up.R → eats → puts_down.R → puts_down.L → STOP
 *
 * El bloqueo clásico aparece cuando todos los filósofos toman primero
 * el izquierdo y luego intentan tomar el derecho: ya nadie lo tendrá
 * libre. Lo detectamos con `isDeadlocked` sobre la composición paralela.
 */
export function philosopher(name: string): Process {
  const pickL: Event = `pick.${name}.L`;
  const pickR: Event = `pick.${name}.R`;
  const eats: Event = `eat.${name}`;
  const putR: Event = `put.${name}.R`;
  const putL: Event = `put.${name}.L`;
  return prefix(pickL, prefix(pickR, prefix(eats, prefix(putR, prefix(putL, STOP)))));
}

/**
 * Tenedor `i`: oscila entre "libre" y "tomado". Solo puede ser tomado o
 * soltado, alternativamente.
 *
 *   FORK_i = pick → put → FORK_i
 *
 * En el modelo de Hoare, los nombres de evento son compartidos entre
 * filósofo y tenedor: `pick.phi.X` debe coincidir con el evento
 * correspondiente del fork.
 *
 * Aquí codificamos el deadlock estructuralmente: la composición paralela
 * de N filósofos sin recursión queda en STOP global cuando todos se
 * bloquean.
 */
function fork(_forkId: number, philLeft: string, philRight: string): Process {
  // El tenedor es L para `philLeft` y R para `philRight`.
  const pickL: Event = `pick.${philLeft}.L`;
  const putL: Event = `put.${philLeft}.L`;
  const pickR: Event = `pick.${philRight}.R`;
  const putR: Event = `put.${philRight}.R`;
  // Solo aceptamos cada movimiento UNA vez (modelado finito → deadlock visible).
  return choice(prefix(pickL, prefix(putL, STOP)), prefix(pickR, prefix(putR, STOP)));
}

/**
 * Composición paralela de `n` filósofos circulares con sus tenedores
 * compartidos. El alfabeto de sincronización es exactamente el conjunto
 * de eventos `pick.*` y `put.*` que comparten filósofo y fork.
 *
 * Con `n ≥ 2` y la estrategia ingenua (todos toman primero el izquierdo)
 * llegamos a deadlock estructural una vez todos hicieron `pick.L`.
 */
export function diningPhilosophers(n: number): Process {
  if (n < 2) throw new Error('diningPhilosophers requiere n ≥ 2');

  // Construimos `n` filósofos y `n` tenedores en una mesa circular.
  // Fork `i` está entre Phil `i` y Phil `(i+1) mod n`.
  const phils: Process[] = [];
  const forks: Process[] = [];
  for (let i = 0; i < n; i++) {
    phils.push(philosopher(`P${i}`));
  }
  for (let i = 0; i < n; i++) {
    const left = `P${i}`;
    const right = `P${(i + 1) % n}`;
    forks.push(fork(i, left, right));
  }

  // Alfabeto: todos los `pick.*` y `put.*`.
  const sync: Event[] = [];
  for (let i = 0; i < n; i++) {
    sync.push(`pick.P${i}.L`, `pick.P${i}.R`, `put.P${i}.L`, `put.P${i}.R`);
  }

  // Componemos en cascada: ((Phil0 |[A]| Fork0) |[A]| Phil1) |[A]| ...
  let acc: Process = phils[0];
  for (let i = 0; i < n; i++) {
    acc = parallel(acc, forks[i], sync);
    if (i + 1 < n) {
      acc = parallel(acc, phils[i + 1], sync);
    }
  }
  return acc;
}
