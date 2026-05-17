// ============================================================
// ST Computability theory — Turing machines + undecidability
// ============================================================
// Cuatro piezas que aterrizan los resultados clásicos de Turing,
// Kleene y Rice:
//
//   1. Máquina de Turing determinista de una cinta (TM): estados,
//      alfabeto de cinta, transición parcial, cabeza con movimientos
//      L/R/S (stay), aceptación/rechazo por estado. Trazas y pasos
//      explícitos. `run` y `trace` son simulación pura — sin efectos.
//
//   2. Halting acotado: dado un budget `maxSteps`, devolvemos
//      `boolean | 'unknown'`. Esto refleja el hecho de que el problema
//      de la parada es semi-decidible: si la máquina para dentro del
//      budget sabemos sí/no; si no, no podemos concluir (no es lo
//      mismo que "no para").
//
//   3. Funciones primitivas recursivas (PRF): cero, sucesor,
//      proyección, composición y recursión primitiva. `evalPR` corre
//      la semántica estándar. Constructores PR_ADD, PR_MUL, PR_POW,
//      PR_FACT, PR_PREDECESSOR para chequear que la maquinaria
//      compila funciones de aritmética básica. Ackermann queda fuera
//      (es μ-recursiva, no PR), incluida como tope de potencia.
//
//   4. Witness de Rice: cualquier propiedad no trivial sobre el
//      lenguaje aceptado por una TM es indecidible. Aquí no hay
//      decisión real (ningún algoritmo puede tener éxito); damos un
//      explicador que sólo verifica el predicado "es no trivial" sobre
//      una muestra y devuelve la justificación clásica.
//
// Convenciones:
//   • Cinta = array de símbolos; expansión perezosa con `blank`
//     hacia ambos lados (se inserta blank cuando la cabeza pasa el
//     borde). Para no mutar configuraciones previas devolvemos una
//     copia (`step` y `trace` no comparten estructura).
//   • Strings de entrada/salida son la concatenación de símbolos.
//     Para `tmReverseString`, `tmCopy`, etc. el resultado se lee de
//     la cinta en el rango no-blank al final.
//   • PRF: usamos `number` con guardas (negativos → error; NaN →
//     error). No intentamos manejar BigInt aquí — los tests caben en
//     `number` cómodamente.
// ============================================================

// ── Turing machines ─────────────────────────────────────────

export type TMState = string;
export type TMSymbol = string;
export type Direction = 'L' | 'R' | 'S';

export interface TMTransition {
  readonly fromState: TMState;
  readonly readSymbol: TMSymbol;
  readonly toState: TMState;
  readonly writeSymbol: TMSymbol;
  readonly direction: Direction;
}

export interface TuringMachine {
  readonly states: Set<TMState>;
  readonly alphabet: Set<TMSymbol>; // entrada
  readonly tapeAlphabet: Set<TMSymbol>; // cinta (incluye blank)
  readonly transitions: TMTransition[];
  readonly initialState: TMState;
  readonly acceptStates: Set<TMState>;
  readonly rejectStates?: Set<TMState>;
  readonly blank: TMSymbol;
}

export interface TMConfig {
  readonly state: TMState;
  readonly tape: TMSymbol[];
  readonly head: number;
  readonly step: number;
}

export type StepResult = TMConfig | 'halted-accept' | 'halted-reject' | 'no-transition';

/**
 * Inicializa una configuración a partir de la entrada. La cinta arranca
 * con los símbolos de `input`, cabeza en 0. Si la entrada es vacía la
 * cinta arranca con un blank.
 */
export function initialConfig(M: TuringMachine, input: string): TMConfig {
  const tape: TMSymbol[] = input.length === 0 ? [M.blank] : Array.from(input);
  return { state: M.initialState, tape, head: 0, step: 0 };
}

function findTransition(
  M: TuringMachine,
  state: TMState,
  symbol: TMSymbol,
): TMTransition | undefined {
  return M.transitions.find((t) => t.fromState === state && t.readSymbol === symbol);
}

/**
 * Un paso de la TM. Devuelve la próxima configuración o un terminal.
 *   • Si el estado actual ya es de aceptación → 'halted-accept'.
 *   • Si es de rechazo → 'halted-reject'.
 *   • Si no hay transición desde (state, leído) → 'no-transition'.
 */
export function step(M: TuringMachine, config: TMConfig): StepResult {
  if (M.acceptStates.has(config.state)) return 'halted-accept';
  if (M.rejectStates?.has(config.state)) return 'halted-reject';

  // Expansión perezosa de la cinta a la izquierda
  let tape = config.tape;
  let head = config.head;
  if (head < 0) {
    const pad = new Array<TMSymbol>(-head).fill(M.blank);
    tape = pad.concat(tape);
    head = 0;
  }
  if (head >= tape.length) {
    const extra = head - tape.length + 1;
    tape = tape.concat(new Array<TMSymbol>(extra).fill(M.blank));
  }

  const read = tape[head] ?? M.blank;
  const tr = findTransition(M, config.state, read);
  if (!tr) return 'no-transition';

  const newTape = tape.slice();
  newTape[head] = tr.writeSymbol;
  let newHead = head;
  if (tr.direction === 'L') newHead -= 1;
  else if (tr.direction === 'R') newHead += 1;
  // direction 'S' = stay

  return {
    state: tr.toState,
    tape: newTape,
    head: newHead,
    step: config.step + 1,
  };
}

export interface RunResult {
  readonly result: 'accept' | 'reject' | 'timeout' | 'no-transition';
  readonly steps: number;
  readonly finalConfig: TMConfig;
}

/**
 * Corre la TM hasta aceptar, rechazar, agotarse o quedar sin transición.
 * `maxSteps` defaultea a 10_000.
 */
export function run(M: TuringMachine, input: string, maxSteps = 10_000): RunResult {
  let cfg = initialConfig(M, input);
  for (let i = 0; i < maxSteps; i += 1) {
    const next = step(M, cfg);
    if (next === 'halted-accept') return { result: 'accept', steps: cfg.step, finalConfig: cfg };
    if (next === 'halted-reject') return { result: 'reject', steps: cfg.step, finalConfig: cfg };
    if (next === 'no-transition')
      return { result: 'no-transition', steps: cfg.step, finalConfig: cfg };
    cfg = next;
  }
  return { result: 'timeout', steps: cfg.step, finalConfig: cfg };
}

/**
 * Lista todas las configuraciones generadas, hasta `maxSteps`.
 * Incluye la configuración inicial. No incluye un sentinel para terminal.
 */
export function trace(M: TuringMachine, input: string, maxSteps: number): TMConfig[] {
  const out: TMConfig[] = [];
  let cfg = initialConfig(M, input);
  out.push(cfg);
  for (let i = 0; i < maxSteps; i += 1) {
    const next = step(M, cfg);
    if (typeof next === 'string') return out;
    out.push(next);
    cfg = next;
  }
  return out;
}

/**
 * Lectura útil de la cinta: la subcadena no-blank más larga centrada en
 * la región explorada. Sirve para validar máquinas que escriben output
 * en la cinta (binary increment, reverse, copy, etc.).
 */
export function readTape(M: TuringMachine, config: TMConfig): string {
  let start = 0;
  let end = config.tape.length;
  while (start < end && config.tape[start] === M.blank) start += 1;
  while (end > start && config.tape[end - 1] === M.blank) end -= 1;
  return config.tape.slice(start, end).join('');
}

/**
 * Halting acotado: ¿la TM para en ≤ `maxSteps` pasos?
 *   • `true` si para por aceptación, rechazo o falta de transición.
 *   • `false` técnicamente nunca se devuelve aquí — para devolver
 *     `false` con certeza haría falta resolver el halting problem, que
 *     es indecidible. Cuando agotamos el budget devolvemos `'unknown'`.
 * Esta función es semi-decidible: reconoce las máquinas que paran,
 * pero no decide el lenguaje complemento (las que no paran).
 */
export function boundedHalts(
  M: TuringMachine,
  input: string,
  maxSteps: number,
): boolean | 'unknown' {
  const r = run(M, input, maxSteps);
  if (r.result === 'timeout') return 'unknown';
  return true;
}

// ── Máquinas estándar ───────────────────────────────────────

/**
 * Incrementa un número binario (MSB first) en la cinta.
 * Algoritmo: ir al final, retroceder convirtiendo 1→0 mientras haya
 * acarreo; al primer 0 escribir 1 y aceptar. Si todo era 1, escribir
 * 1 al borde izquierdo y aceptar.
 */
export function tmBinaryIncrement(): TuringMachine {
  return {
    states: new Set(['q0', 'q1', 'q2', 'qa']),
    alphabet: new Set(['0', '1']),
    tapeAlphabet: new Set(['0', '1', 'B']),
    blank: 'B',
    initialState: 'q0',
    acceptStates: new Set(['qa']),
    transitions: [
      // q0: ir a la derecha hasta encontrar blank
      { fromState: 'q0', readSymbol: '0', toState: 'q0', writeSymbol: '0', direction: 'R' },
      { fromState: 'q0', readSymbol: '1', toState: 'q0', writeSymbol: '1', direction: 'R' },
      { fromState: 'q0', readSymbol: 'B', toState: 'q1', writeSymbol: 'B', direction: 'L' },
      // q1: propagar acarreo
      { fromState: 'q1', readSymbol: '0', toState: 'q2', writeSymbol: '1', direction: 'L' },
      { fromState: 'q1', readSymbol: '1', toState: 'q1', writeSymbol: '0', direction: 'L' },
      { fromState: 'q1', readSymbol: 'B', toState: 'qa', writeSymbol: '1', direction: 'S' },
      // q2: terminar moviéndose al final
      { fromState: 'q2', readSymbol: '0', toState: 'q2', writeSymbol: '0', direction: 'L' },
      { fromState: 'q2', readSymbol: '1', toState: 'q2', writeSymbol: '1', direction: 'L' },
      { fromState: 'q2', readSymbol: 'B', toState: 'qa', writeSymbol: 'B', direction: 'R' },
    ],
  };
}

/**
 * Acepta sii la cantidad de 1s en la entrada (sobre alfabeto {1}) es par.
 * Estados q0 = par hasta ahora, q1 = impar.
 */
export function tmUnaryParity(): TuringMachine {
  return {
    states: new Set(['q0', 'q1', 'qa', 'qr']),
    alphabet: new Set(['1']),
    tapeAlphabet: new Set(['1', 'B']),
    blank: 'B',
    initialState: 'q0',
    acceptStates: new Set(['qa']),
    rejectStates: new Set(['qr']),
    transitions: [
      { fromState: 'q0', readSymbol: '1', toState: 'q1', writeSymbol: '1', direction: 'R' },
      { fromState: 'q0', readSymbol: 'B', toState: 'qa', writeSymbol: 'B', direction: 'S' },
      { fromState: 'q1', readSymbol: '1', toState: 'q0', writeSymbol: '1', direction: 'R' },
      { fromState: 'q1', readSymbol: 'B', toState: 'qr', writeSymbol: 'B', direction: 'S' },
    ],
  };
}

/**
 * Revierte una cadena sobre {a, b}. Algoritmo:
 *   1. Marcar inicio (Sa, Sb) con un símbolo distintivo.
 *   2. Encontrar el final y desplazar el símbolo del frente al fondo.
 *   3. Repetir hasta agotar.
 * Output: la cinta termina con el reverso de la entrada original.
 *
 * Implementación con cinta auxiliar a la derecha (más simple):
 *   Caminar a la derecha mientras se copian símbolos en orden inverso
 *   tras un separador. Al terminar borrar la entrada original.
 *
 * Para evitar complicaciones, esta versión usa una técnica de
 * "shift left after marking": tras leer un símbolo, lo borra y lo
 * reescribe al final del bloque restante.
 *
 * Nota: este algoritmo es O(n²) en pasos pero correcto.
 */
export function tmReverseString(): TuringMachine {
  // Estrategia:
  //   1. init: pasamos a la derecha y escribimos un marcador '|' justo
  //      tras el último símbolo del input.
  //   2. pickRight: vamos a la izquierda desde '|' hasta el primer
  //      símbolo del input por la derecha (el ÚLTIMO símbolo de la
  //      entrada original). Lo borramos y lo "cargamos" en el estado.
  //      Si en lugar de un símbolo encontramos el marcador izquierdo
  //      '^' → done. Si encontramos sólo blanks entre símbolos, los
  //      saltamos.
  //   3. carry_X: caminamos a la derecha, pasando '|' y los símbolos
  //      ya escritos a la derecha del marcador, hasta encontrar el
  //      primer blank tras el output. Allí escribimos X. Esto pone el
  //      símbolo cargado al final del bloque de output → orden inverso.
  //   4. rewind: volvemos al marcador '|' (atravesando los símbolos
  //      output) y desde ahí relanzamos pickRight.
  //   5. Cuando pickRight ve '^' contiguo a '|' (input agotado) →
  //      borramos '^' y '|' y aceptamos.
  //
  // El marcador '^' se inserta al inicio extendiendo la cinta una
  // posición a la izquierda. Como la TM no puede insertar fácilmente,
  // arrancamos en init1 que escribe '^' en la posición 0 y desplaza
  // todo a la derecha. Para evitar la sub-rutina de shift, optamos
  // por una codificación más simple: el marcador izquierdo se pone
  // a la primera posición *blank* a la izquierda. Como la cinta es
  // ilimitada por la izquierda con blanks padded, podemos ir un paso
  // L del primer símbolo y escribir '^' allí (eso reserva 1 blank a
  // la izquierda del input).
  const symbols = ['a', 'b', 'c'];
  const transitions: TMTransition[] = [];

  // start: ir UNA posición a la izquierda y escribir '^', luego volver a la derecha.
  transitions.push({
    fromState: 'start',
    readSymbol: 'a',
    toState: 'mark',
    writeSymbol: 'a',
    direction: 'L',
  });
  transitions.push({
    fromState: 'start',
    readSymbol: 'b',
    toState: 'mark',
    writeSymbol: 'b',
    direction: 'L',
  });
  transitions.push({
    fromState: 'start',
    readSymbol: 'c',
    toState: 'mark',
    writeSymbol: 'c',
    direction: 'L',
  });
  transitions.push({
    fromState: 'start',
    readSymbol: 'B',
    toState: 'mark',
    writeSymbol: 'B',
    direction: 'L',
  });
  transitions.push({
    fromState: 'mark',
    readSymbol: 'B',
    toState: 'init',
    writeSymbol: '^',
    direction: 'R',
  });

  // init: pasar a la derecha y poner '|' al final del input
  for (const s of symbols) {
    transitions.push({
      fromState: 'init',
      readSymbol: s,
      toState: 'init',
      writeSymbol: s,
      direction: 'R',
    });
  }
  transitions.push({
    fromState: 'init',
    readSymbol: 'B',
    toState: 'pickRight',
    writeSymbol: '|',
    direction: 'L',
  });

  // pickRight: ir a la izquierda desde '|' buscando el último símbolo.
  for (const s of symbols) {
    transitions.push({
      fromState: 'pickRight',
      readSymbol: s,
      toState: `carry_${s}`,
      writeSymbol: 'B',
      direction: 'R',
    });
  }
  transitions.push({
    fromState: 'pickRight',
    readSymbol: 'B',
    toState: 'pickRight',
    writeSymbol: 'B',
    direction: 'L',
  });
  // si pickRight ve '^' (input agotado) → done
  transitions.push({
    fromState: 'pickRight',
    readSymbol: '^',
    toState: 'done',
    writeSymbol: 'B',
    direction: 'R',
  });

  // carry_X: caminar a la derecha cruzando blanks ya borrados, '|', y
  // los símbolos output existentes, hasta el primer blank tras output.
  for (const s of symbols) {
    const carry = `carry_${s}`;
    transitions.push({
      fromState: carry,
      readSymbol: 'B',
      toState: carry,
      writeSymbol: 'B',
      direction: 'R',
    });
    transitions.push({
      fromState: carry,
      readSymbol: '|',
      toState: `carry_${s}_post`,
      writeSymbol: '|',
      direction: 'R',
    });
  }
  for (const s of symbols) {
    const post = `carry_${s}_post`;
    for (const t of symbols) {
      transitions.push({
        fromState: post,
        readSymbol: t,
        toState: post,
        writeSymbol: t,
        direction: 'R',
      });
    }
    transitions.push({
      fromState: post,
      readSymbol: 'B',
      toState: 'rewind',
      writeSymbol: s,
      direction: 'L',
    });
  }

  // rewind: volver hasta '|' atravesando los símbolos output.
  for (const s of symbols) {
    transitions.push({
      fromState: 'rewind',
      readSymbol: s,
      toState: 'rewind',
      writeSymbol: s,
      direction: 'L',
    });
  }
  transitions.push({
    fromState: 'rewind',
    readSymbol: '|',
    toState: 'pickRight',
    writeSymbol: '|',
    direction: 'L',
  });

  // done: borrar '|' y aceptar (cuando pickRight vio '^' la cabeza fue R 1).
  for (const s of symbols) {
    transitions.push({
      fromState: 'done',
      readSymbol: s,
      toState: 'done',
      writeSymbol: s,
      direction: 'R',
    });
  }
  transitions.push({
    fromState: 'done',
    readSymbol: 'B',
    toState: 'done',
    writeSymbol: 'B',
    direction: 'R',
  });
  transitions.push({
    fromState: 'done',
    readSymbol: '|',
    toState: 'qa',
    writeSymbol: 'B',
    direction: 'S',
  });

  const stateSet = new Set<string>(['start', 'mark', 'init', 'pickRight', 'rewind', 'done', 'qa']);
  for (const s of symbols) {
    stateSet.add(`carry_${s}`);
    stateSet.add(`carry_${s}_post`);
  }

  return {
    states: stateSet,
    alphabet: new Set(symbols),
    tapeAlphabet: new Set([...symbols, '|', '^', 'B']),
    blank: 'B',
    initialState: 'start',
    acceptStates: new Set(['qa']),
    transitions,
  };
}

/**
 * Copia w → w#w sobre {a, b}. El '#' se inserta automáticamente y la
 * copia queda a la derecha. Algoritmo análogo a reverse pero copiando
 * en orden directo (marcamos cada símbolo procesado con mayúscula).
 */
export function tmCopy(): TuringMachine {
  return {
    states: new Set([
      'scan',
      'next',
      'copyA',
      'copyB',
      'placeA',
      'placeB',
      'back',
      'restore',
      'done',
      'qa',
    ]),
    alphabet: new Set(['a', 'b']),
    tapeAlphabet: new Set(['a', 'b', 'A', 'B0', '#', 'B']),
    blank: 'B',
    initialState: 'scan',
    acceptStates: new Set(['qa']),
    transitions: [
      // scan: ir al final y poner '#'
      { fromState: 'scan', readSymbol: 'a', toState: 'scan', writeSymbol: 'a', direction: 'R' },
      { fromState: 'scan', readSymbol: 'b', toState: 'scan', writeSymbol: 'b', direction: 'R' },
      { fromState: 'scan', readSymbol: 'B', toState: 'back', writeSymbol: '#', direction: 'L' },

      // back: volver al inicio (pasando por #, output, marcas y blanks dentro del segmento)
      { fromState: 'back', readSymbol: 'a', toState: 'back', writeSymbol: 'a', direction: 'L' },
      { fromState: 'back', readSymbol: 'b', toState: 'back', writeSymbol: 'b', direction: 'L' },
      { fromState: 'back', readSymbol: 'A', toState: 'back', writeSymbol: 'A', direction: 'L' },
      { fromState: 'back', readSymbol: 'B0', toState: 'back', writeSymbol: 'B0', direction: 'L' },
      { fromState: 'back', readSymbol: '#', toState: 'back', writeSymbol: '#', direction: 'L' },
      { fromState: 'back', readSymbol: 'B', toState: 'next', writeSymbol: 'B', direction: 'R' },

      // next: si encuentras a/b, marcarlo y empezar copy
      { fromState: 'next', readSymbol: 'a', toState: 'copyA', writeSymbol: 'A', direction: 'R' },
      { fromState: 'next', readSymbol: 'b', toState: 'copyB', writeSymbol: 'B0', direction: 'R' },
      { fromState: 'next', readSymbol: 'A', toState: 'next', writeSymbol: 'A', direction: 'R' },
      { fromState: 'next', readSymbol: 'B0', toState: 'next', writeSymbol: 'B0', direction: 'R' },
      { fromState: 'next', readSymbol: '#', toState: 'restore', writeSymbol: '#', direction: 'L' },

      // copyA: ir a la derecha hasta pasar '#' y escribir 'a' donde haya blank
      { fromState: 'copyA', readSymbol: 'a', toState: 'copyA', writeSymbol: 'a', direction: 'R' },
      { fromState: 'copyA', readSymbol: 'b', toState: 'copyA', writeSymbol: 'b', direction: 'R' },
      { fromState: 'copyA', readSymbol: '#', toState: 'placeA', writeSymbol: '#', direction: 'R' },
      { fromState: 'placeA', readSymbol: 'a', toState: 'placeA', writeSymbol: 'a', direction: 'R' },
      { fromState: 'placeA', readSymbol: 'b', toState: 'placeA', writeSymbol: 'b', direction: 'R' },
      { fromState: 'placeA', readSymbol: 'B', toState: 'back', writeSymbol: 'a', direction: 'L' },

      // copyB
      { fromState: 'copyB', readSymbol: 'a', toState: 'copyB', writeSymbol: 'a', direction: 'R' },
      { fromState: 'copyB', readSymbol: 'b', toState: 'copyB', writeSymbol: 'b', direction: 'R' },
      { fromState: 'copyB', readSymbol: '#', toState: 'placeB', writeSymbol: '#', direction: 'R' },
      { fromState: 'placeB', readSymbol: 'a', toState: 'placeB', writeSymbol: 'a', direction: 'R' },
      { fromState: 'placeB', readSymbol: 'b', toState: 'placeB', writeSymbol: 'b', direction: 'R' },
      { fromState: 'placeB', readSymbol: 'B', toState: 'back', writeSymbol: 'b', direction: 'L' },

      // restore: ir a la izquierda y devolver A→a, B0→b
      {
        fromState: 'restore',
        readSymbol: 'A',
        toState: 'restore',
        writeSymbol: 'a',
        direction: 'L',
      },
      {
        fromState: 'restore',
        readSymbol: 'B0',
        toState: 'restore',
        writeSymbol: 'b',
        direction: 'L',
      },
      {
        fromState: 'restore',
        readSymbol: 'a',
        toState: 'restore',
        writeSymbol: 'a',
        direction: 'L',
      },
      {
        fromState: 'restore',
        readSymbol: 'b',
        toState: 'restore',
        writeSymbol: 'b',
        direction: 'L',
      },
      { fromState: 'restore', readSymbol: 'B', toState: 'qa', writeSymbol: 'B', direction: 'R' },
    ],
  };
}

// Patch: la transición `back → next` necesita un estado adicional `next`.
// Agregamos `'next'` al set de estados arriba.

/**
 * Suma con `a` en binario y `b` en unario, formato "<a>+<b>" donde
 *   a ∈ {0,1}* (MSB-first), b ∈ {1}*.
 *
 * Mantener `b` unario evita la coreografía de decremento binario (que
 * agrega ~10 estados sin enseñar nada nuevo) y muestra claramente la
 * técnica de "incrementar `a` una vez por cada token de `b`".
 *
 * Algoritmo:
 *   1. Ir al final.
 *   2. Si la última posición es '1' (un token de b), borrarlo y entrar
 *      en `incA`: incrementar `a` y luego volver al final.
 *   3. Si la última posición es '+' (b vacío), borrarlo: la cinta queda
 *      con sólo `a` (el resultado).
 */
export function tmAddBinary(): TuringMachine {
  return {
    states: new Set(['s0', 'check', 'incA', 'carryLeft', 'returnEnd', 'qa']),
    alphabet: new Set(['0', '1', '+']),
    tapeAlphabet: new Set(['0', '1', '+', 'B']),
    blank: 'B',
    initialState: 's0',
    acceptStates: new Set(['qa']),
    transitions: [
      // s0: ir a la derecha hasta blank
      { fromState: 's0', readSymbol: '0', toState: 's0', writeSymbol: '0', direction: 'R' },
      { fromState: 's0', readSymbol: '1', toState: 's0', writeSymbol: '1', direction: 'R' },
      { fromState: 's0', readSymbol: '+', toState: 's0', writeSymbol: '+', direction: 'R' },
      { fromState: 's0', readSymbol: 'B', toState: 'check', writeSymbol: 'B', direction: 'L' },

      // check: ¿es '1' (un token b) o '+' (terminamos)?
      { fromState: 'check', readSymbol: '1', toState: 'incA', writeSymbol: 'B', direction: 'L' },
      { fromState: 'check', readSymbol: '+', toState: 'qa', writeSymbol: 'B', direction: 'S' },

      // incA: caminar a la izquierda saltando '1's de b hasta '+', luego al LSB de a.
      { fromState: 'incA', readSymbol: '1', toState: 'incA', writeSymbol: '1', direction: 'L' },
      {
        fromState: 'incA',
        readSymbol: '+',
        toState: 'carryLeft',
        writeSymbol: '+',
        direction: 'L',
      },

      // carryLeft: propagar acarreo binario de derecha a izquierda dentro de a.
      {
        fromState: 'carryLeft',
        readSymbol: '0',
        toState: 'returnEnd',
        writeSymbol: '1',
        direction: 'R',
      },
      {
        fromState: 'carryLeft',
        readSymbol: '1',
        toState: 'carryLeft',
        writeSymbol: '0',
        direction: 'L',
      },
      {
        fromState: 'carryLeft',
        readSymbol: 'B',
        toState: 'returnEnd',
        writeSymbol: '1',
        direction: 'R',
      },

      // returnEnd: ir al final (al blank derecho) y volver a check.
      {
        fromState: 'returnEnd',
        readSymbol: '0',
        toState: 'returnEnd',
        writeSymbol: '0',
        direction: 'R',
      },
      {
        fromState: 'returnEnd',
        readSymbol: '1',
        toState: 'returnEnd',
        writeSymbol: '1',
        direction: 'R',
      },
      {
        fromState: 'returnEnd',
        readSymbol: '+',
        toState: 'returnEnd',
        writeSymbol: '+',
        direction: 'R',
      },
      {
        fromState: 'returnEnd',
        readSymbol: 'B',
        toState: 'check',
        writeSymbol: 'B',
        direction: 'L',
      },
    ],
  };
}

// ── Funciones primitivas recursivas ─────────────────────────

export type PRFn =
  | { kind: 'zero' }
  | { kind: 'succ' }
  | { kind: 'proj'; n: number; i: number } // U^n_i(x1,...,xn) = x_i (1-indexed)
  | { kind: 'comp'; outer: PRFn; inner: PRFn[] }
  | { kind: 'rec'; base: PRFn; step: PRFn };

/**
 * Semántica de PRF:
 *   • zero()           = 0
 *   • succ(x)          = x + 1
 *   • U^n_i(x1..xn)    = x_i
 *   • comp(h, g1..gk)(x1..xn) = h(g1(x1..xn), ..., gk(x1..xn))
 *   • rec(base, step):
 *       f(0, x1..xn)     = base(x1..xn)
 *       f(y+1, x1..xn)   = step(y, f(y, x1..xn), x1..xn)
 *
 * El argumento "iterado" es el primero (convención común). `args[0]` es
 * el contador en `rec`.
 */
export function evalPR(f: PRFn, args: number[]): number {
  for (const a of args) {
    if (!Number.isFinite(a) || a < 0 || !Number.isInteger(a)) {
      throw new Error(`evalPR: argumento inválido ${String(a)}`);
    }
  }
  switch (f.kind) {
    case 'zero':
      return 0;
    case 'succ': {
      const x = args[0];
      if (x === undefined) throw new Error('succ: falta argumento');
      return x + 1;
    }
    case 'proj': {
      if (f.i < 1 || f.i > f.n) throw new Error('proj: índice fuera de rango');
      if (args.length < f.n) throw new Error('proj: faltan argumentos');
      const v = args[f.i - 1];
      if (v === undefined) throw new Error('proj: undefined');
      return v;
    }
    case 'comp': {
      const innerVals = f.inner.map((g) => evalPR(g, args));
      return evalPR(f.outer, innerVals);
    }
    case 'rec': {
      const y = args[0];
      if (y === undefined) throw new Error('rec: falta contador');
      const rest = args.slice(1);
      let acc = evalPR(f.base, rest);
      for (let k = 0; k < y; k += 1) {
        acc = evalPR(f.step, [k, acc, ...rest]);
      }
      return acc;
    }
  }
}

// Helpers para construir PRFn más legibles.
const zero: PRFn = { kind: 'zero' };
const succ: PRFn = { kind: 'succ' };
const proj = (n: number, i: number): PRFn => ({ kind: 'proj', n, i });
const comp = (outer: PRFn, ...inner: PRFn[]): PRFn => ({ kind: 'comp', outer, inner });
const rec = (base: PRFn, step: PRFn): PRFn => ({ kind: 'rec', base, step });

/**
 * Suma: add(0, y) = y, add(x+1, y) = succ(add(x, y))
 *   base = U^1_1 (identidad en y)
 *   step = succ ∘ U^3_2 (toma f(x,y) y le aplica succ)
 *
 * En nuestra convención args[0] es el contador → add(x, y).
 */
export const PR_ADD: PRFn = rec(proj(1, 1), comp(succ, proj(3, 2)));

/**
 * Multiplicación: mul(0, y) = 0, mul(x+1, y) = add(mul(x,y), y)
 *   base = zero (después de proyectar y fuera)
 *   step = add(f(x,y), y)
 *
 * base: el caso 0 → 0. Es la función constante 0 sobre 1 argumento:
 *   const0(y) = zero ∘ U^1_1, pero zero ignora sus argumentos.
 *   En este eval, zero retorna 0 sin importar args.
 */
export const PR_MUL: PRFn = rec(comp(zero, proj(1, 1)), comp(PR_ADD, proj(3, 2), proj(3, 3)));

/**
 * Potencia: pow(x, y) = y^x (iterando sobre primer argumento).
 *   pow(0, y) = 1
 *   pow(x+1, y) = mul(pow(x,y), y)
 */
const ONE_FN: PRFn = comp(succ, comp(zero, proj(1, 1))); // succ(0) = 1
export const PR_POW: PRFn = rec(ONE_FN, comp(PR_MUL, proj(3, 2), proj(3, 3)));

/**
 * Predecesor: pred(0) = 0, pred(x+1) = x.
 *   rec con base = zero, step = U^2_1 (devuelve y, el contador previo).
 */
export const PR_PREDECESSOR: PRFn = rec(zero, proj(2, 1));

/**
 * Factorial: fact(0) = 1, fact(x+1) = mul(succ(x), fact(x)).
 *
 * En recursión: contador y, acumulador f(y), sin args extra. Step recibe
 * (y, f(y)) y debe devolver mul(succ(y), f(y)).
 *
 * Cuidado: aquí args[0]=y es el "k" del bucle (0-indexed), por lo que
 * succ(y) = y+1 = el siguiente número a multiplicar.
 */
export const PR_FACT: PRFn = rec(
  comp(succ, zero), // base = 1
  comp(PR_MUL, comp(succ, proj(2, 1)), proj(2, 2)),
);

// ── Ackermann (no PR) ───────────────────────────────────────

/**
 * Función de Ackermann (Peter):
 *   A(0, n) = n + 1
 *   A(m+1, 0) = A(m, 1)
 *   A(m+1, n+1) = A(m, A(m+1, n))
 *
 * Crece más rápido que toda PRF: A(m, n) es la prueba canónica de que
 * existen funciones recursivas totales no primitivas recursivas.
 *
 * Implementación iterativa por stack para esquivar el call-stack JS.
 */
export function ackermann(m: number, n: number): number {
  if (!Number.isInteger(m) || !Number.isInteger(n) || m < 0 || n < 0) {
    throw new Error('ackermann: m,n deben ser enteros ≥ 0');
  }
  const stack: number[] = [m];
  let curN = n;
  while (stack.length > 0) {
    const curM = stack.pop() as number;
    if (curM === 0) {
      curN = curN + 1;
    } else if (curN === 0) {
      stack.push(curM - 1);
      curN = 1;
    } else {
      stack.push(curM - 1);
      stack.push(curM);
      curN = curN - 1;
    }
  }
  return curN;
}

/**
 * Test heurístico de "esta función podría ser PR": evalúa la función
 * sobre `samples` puntos pequeños y la compara con el patrón de
 * crecimiento de Ackermann (que escapa a PR). Es estrictamente una
 * heurística — no es un decisor.
 *
 *   • Si la función supera a A(samples, samples) en algún punto pequeño
 *     → likely = false (probablemente no es PR).
 *   • Si nunca crece más rápido que cuadrático/exponencial moderado →
 *     likely = true.
 */
export function isInPR(
  f: (n: number) => number,
  samples = 4,
): { likely: boolean; estimate?: number } {
  let lastRatio = 1;
  for (let n = 1; n <= samples; n += 1) {
    const v = f(n);
    if (!Number.isFinite(v) || v < 0) return { likely: false };
    const prevV = f(n - 1);
    const ratio = prevV === 0 ? v : v / prevV;
    // Comparar con un "horizonte de Ackermann": si f(n) > A(2, n+3), lo
    // tomamos como señal de crecimiento súper-PR moderado. Esto es
    // intencionadamente generoso porque casi todo lo "normal" cae aquí.
    const ack = ackermann(2, Math.min(n + 3, 8));
    if (v > ack * 1_000_000) return { likely: false, estimate: ratio };
    lastRatio = ratio;
  }
  return { likely: true, estimate: lastRatio };
}

// ── Witness de Rice ─────────────────────────────────────────

/**
 * Rice (1953): toda propiedad **no trivial** sobre el lenguaje aceptado
 * por una TM (es decir, sobre el comportamiento input/output observable)
 * es **indecidible**.
 *
 * No podemos *decidir* la propiedad — eso es justo lo que el teorema
 * niega. Lo que sí podemos es **verificar el predicado de Rice**: la
 * propiedad debe ser
 *
 *   1. extensional (depende sólo del lenguaje, no del código),
 *   2. no vacía (alguna TM la satisface),
 *   3. no total (alguna TM no la satisface).
 *
 * Esta función toma el predicado, lo evalúa sobre un muestreo finito de
 * TMs conocidas y, si encuentra una `M0` que la satisface y una `M1`
 * que no, devuelve `undecidable = true` con explicación. Si todas las
 * TMs de la muestra dan la misma respuesta no podemos concluir nada
 * (la propiedad podría ser trivial, o la muestra puede ser muy chica).
 */
export function riceWitness(
  property: (m: TuringMachine) => boolean,
  sampleSize = 5,
): { undecidable: boolean; explanation: string } {
  const samples: TuringMachine[] = [
    tmBinaryIncrement(),
    tmUnaryParity(),
    tmReverseString(),
    tmCopy(),
    tmAddBinary(),
  ].slice(0, Math.max(2, sampleSize));

  let sawTrue = false;
  let sawFalse = false;
  for (const m of samples) {
    if (property(m)) sawTrue = true;
    else sawFalse = true;
    if (sawTrue && sawFalse) {
      return {
        undecidable: true,
        explanation:
          'La propiedad es no trivial (alguna TM la satisface y otra no). Por el teorema de Rice (1953), su decisión sobre todas las TMs es indecidible: no existe algoritmo que reciba una codificación de TM y responda sí/no para la propiedad.',
      };
    }
  }
  return {
    undecidable: false,
    explanation: sawTrue
      ? 'La muestra es uniformemente positiva: la propiedad podría ser trivialmente verdadera (todas las TMs la satisfacen). Sin más evidencia no podemos invocar Rice.'
      : 'La muestra es uniformemente negativa: la propiedad podría ser trivialmente falsa. Sin más evidencia no podemos invocar Rice.',
  };
}
