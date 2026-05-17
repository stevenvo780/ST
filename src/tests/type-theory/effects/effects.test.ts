import { describe, expect, it } from 'vitest';
import {
  ask,
  asks,
  bind,
  getState,
  handle,
  handleException,
  handleReader,
  handleState,
  handleWriter,
  listMonoid,
  map,
  modify,
  perform,
  pure,
  putState,
  run,
  runException,
  runReader,
  runState,
  runWriter,
  sequence,
  stringMonoid,
  sumMonoid,
  tell,
  throw_,
} from '../../../type-theory/effects';
import type { Eff, Handler } from '../../../type-theory/effects';

describe('effects / núcleo', () => {
  it('pure(42) ejecutado con run devuelve 42', () => {
    const eff = pure(42);
    expect(run(eff)).toBe(42);
  });

  it('bind(pure(1), x => pure(x+1)) ↦ 2', () => {
    const eff = bind(pure(1), (x) => pure(x + 1));
    expect(run(eff)).toBe(2);
  });

  it('map aplica función pura al resultado', () => {
    const eff = map(pure(10), (x) => x * 3);
    expect(run(eff)).toBe(30);
  });

  it('sequence colecta resultados en orden', () => {
    const effs: Eff<never, number>[] = [pure(1), pure(2), pure(3), pure(4)];
    expect(run(sequence(effs))).toEqual([1, 2, 3, 4]);
  });

  it('bind respeta la ley de identidad izquierda: pure(a) >>= f ≡ f(a)', () => {
    const f = (x: number) => pure(x * 2);
    const lhs = bind(pure(5), f);
    const rhs = f(5);
    expect(run(lhs)).toBe(run(rhs));
  });

  it('bind respeta la ley de identidad derecha: m >>= pure ≡ m', () => {
    const m = pure(7);
    const lhs = bind(m, (a) => pure(a));
    expect(run(lhs)).toBe(run(m));
  });

  it('bind respeta asociatividad: (m >>= f) >>= g ≡ m >>= (x => f(x) >>= g)', () => {
    const m = pure(3);
    const f = (x: number) => pure(x + 1);
    const g = (x: number) => pure(x * 10);
    const lhs = bind(bind(m, f), g);
    const rhs = bind(m, (x) => bind(f(x), g));
    expect(run(lhs)).toBe(run(rhs));
  });
});

describe('effects / State', () => {
  it('getState devuelve el estado inicial', () => {
    const { result, state } = runState(getState<number>(), 100);
    expect(result).toBe(100);
    expect(state).toBe(100);
  });

  it('putState sobrescribe el estado y devuelve undefined', () => {
    const { result, state } = runState(putState(99), 0);
    expect(result).toBeUndefined();
    expect(state).toBe(99);
  });

  it('getState luego putState modifica estado', () => {
    const prog = bind(getState<number>(), (s) => putState(s + 1));
    const { state } = runState(prog, 41);
    expect(state).toBe(42);
  });

  it('counter: incrementa N veces y devuelve el final', () => {
    function counterLoop(n: number): Eff<unknown, number> {
      if (n === 0) return getState<number>();
      return bind(
        modify<number>((s) => s + 1),
        () => counterLoop(n - 1),
      );
    }
    const { result, state } = runState(counterLoop(5), 0);
    expect(state).toBe(5);
    expect(result).toBe(5);
  });

  it('modify ≡ get >>= (s -> put (fn s))', () => {
    const fn = (s: number) => s * 2 + 1;
    const viaModify = runState(modify<number>(fn), 4);
    const viaGetPut = runState(
      bind(getState<number>(), (s) => putState(fn(s))),
      4,
    );
    expect(viaModify.state).toBe(viaGetPut.state);
    expect(viaModify.state).toBe(9);
  });

  it('runState propaga estado a través de un cómputo no trivial', () => {
    // prog: lee, multiplica por 3, escribe; lee, suma 1, escribe; lee
    const prog = bind(getState<number>(), (s1) =>
      bind(putState(s1 * 3), () =>
        bind(getState<number>(), (s2) => bind(putState(s2 + 1), () => getState<number>())),
      ),
    );
    const { result, state } = runState(prog, 10);
    expect(result).toBe(31);
    expect(state).toBe(31);
  });
});

describe('effects / Reader', () => {
  it('ask devuelve el ambiente', () => {
    expect(runReader(ask<string>(), 'hola')).toBe('hola');
  });

  it('asks proyecta el ambiente', () => {
    const prog = asks<{ name: string; age: number }, string>((r) => r.name.toUpperCase());
    expect(runReader(prog, { name: 'alice', age: 30 })).toBe('ALICE');
  });

  it('runReader provee el mismo env a múltiples ask', () => {
    const prog = bind(ask<number>(), (a) => bind(ask<number>(), (b) => pure(a + b)));
    expect(runReader(prog, 21)).toBe(42);
  });
});

describe('effects / Writer', () => {
  it('tell + tell + return: log es lista de tells', () => {
    const prog = bind(tell('a'), () => bind(tell('b'), () => bind(tell('c'), () => pure(42))));
    const { result, log } = runWriter(prog, stringMonoid);
    expect(result).toBe(42);
    expect(log).toBe('abc');
  });

  it('Writer con monoide de listas concatena en orden', () => {
    const prog = bind(tell([1, 2]), () =>
      bind(tell([3]), () => bind(tell([4, 5]), () => pure('done'))),
    );
    const { result, log } = runWriter(prog, listMonoid<number>());
    expect(result).toBe('done');
    expect(log).toEqual([1, 2, 3, 4, 5]);
  });

  it('Writer con monoide aditivo suma los tells', () => {
    const prog = bind(tell(10), () => bind(tell(20), () => bind(tell(30), () => pure('ok'))));
    const { result, log } = runWriter(prog, sumMonoid);
    expect(result).toBe('ok');
    expect(log).toBe(60);
  });
});

describe('effects / Exception', () => {
  it('throw aborta el cómputo (la cont nunca corre)', () => {
    const prog = bind(throw_<string>('boom'), (_unused: never): Eff<never, never> => {
      // Esto NO debe ejecutarse: la continuación tras throw es inalcanzable.
      throw new Error('continuación no debería invocarse');
    });
    const r = runException<string, never>(prog);
    expect(r).toEqual({ kind: 'error', error: 'boom' });
  });

  it('runException captura throw y devuelve error', () => {
    const prog = bind(pure(1), () => throw_<{ code: number }>({ code: 404 }));
    const r = runException<{ code: number }, never>(prog);
    expect(r.kind).toBe('error');
    if (r.kind === 'error') expect(r.error.code).toBe(404);
  });

  it('runException sobre cómputo puro devuelve ok', () => {
    const prog = bind(pure(1), (x) => pure(x + 1));
    const r = runException<string, number>(prog);
    expect(r).toEqual({ kind: 'ok', value: 2 });
  });
});

describe('effects / composición de efectos', () => {
  it('State + Reader: cuenta por env, lee estado final', () => {
    // Programa: inc el estado por `env.amount`; devuelve estado final.
    const prog = bind(ask<{ amount: number }>(), (env) =>
      bind(
        modify<number>((s) => s + env.amount),
        () => getState<number>(),
      ),
    );
    // Aplicamos primero Reader (peel) y luego State (terminal).
    const afterReader = handleReader<unknown, number, { amount: number }>(prog, { amount: 7 });
    const { result, state } = runState<number, number>(afterReader, 100);
    expect(result).toBe(107);
    expect(state).toBe(107);
  });

  it('State + Writer: cada paso registra el log y muta estado', () => {
    function step(label: string, delta: number): Eff<unknown, void> {
      return bind(tell([label]), () =>
        bind(
          modify<number>((s) => s + delta),
          () => pure(undefined),
        ),
      );
    }
    const prog = bind(step('a', 1), () => bind(step('b', 2), () => step('c', 3)));
    const afterWriter = handleWriter<unknown, string[], void>(prog, listMonoid<string>());
    const { result, state } = runState<number, { result: void; log: string[] }>(afterWriter, 0);
    expect(state).toBe(6);
    expect(result.log).toEqual(['a', 'b', 'c']);
  });

  it('Exception + State: throw devuelve error con estado en el momento del fallo', () => {
    const prog = bind(
      modify<number>((s) => s + 1),
      () =>
        bind(
          modify<number>((s) => s + 1),
          () => bind(throw_<string>('halt'), () => getState<number>()),
        ),
    );
    // Capturamos la excepción dejando intactos los efectos de estado y
    // luego ejecutamos runState (que ve sólo State).
    const caught = handleException<unknown, string, number>(prog);
    const { result, state } = runState<
      number,
      { kind: 'ok'; value: number } | { kind: 'error'; error: string }
    >(caught, 0);
    expect(result).toEqual({ kind: 'error', error: 'halt' });
    expect(state).toBe(2);
  });

  it('Reader + Writer + State: stack triple, cada efecto independiente', () => {
    const prog = bind(ask<number>(), (env) =>
      bind(tell([`env=${env}`]), () =>
        bind(
          modify<number>((s) => s + env),
          () => bind(getState<number>(), (s) => bind(tell([`state=${s}`]), () => pure(s))),
        ),
      ),
    );
    const a1 = handleReader<unknown, number, number>(prog, 10);
    const a2 = handleWriter<unknown, string[], number>(a1, listMonoid<string>());
    const { result, state } = runState<number, { result: number; log: string[] }>(a2, 5);
    expect(state).toBe(15);
    expect(result.result).toBe(15);
    expect(result.log).toEqual(['env=10', 'state=15']);
  });

  it('handleException sobre Reader + Exception: error short-circuit', () => {
    const prog = bind(ask<number>(), (env) =>
      env > 0 ? pure(env) : bind(throw_<string>('non-positive'), () => pure(-1)),
    );
    const r1 = runException<string, number>(handleReader<unknown, number, number>(prog, 7));
    expect(r1).toEqual({ kind: 'ok', value: 7 });
    const r2 = runException<string, number>(handleReader<unknown, number, number>(prog, -1));
    expect(r2).toEqual({ kind: 'error', error: 'non-positive' });
  });

  it('handle: handler genérico custom (Log) procesa una sola operación', () => {
    // Definimos un efecto custom 'Log' y un handler que acumula mensajes.
    const logProg = bind(perform<'Log', string, undefined>('Log', 'first'), () =>
      bind(perform<'Log', string, undefined>('Log', 'second'), () => pure(42)),
    );
    const collected: string[] = [];
    const logHandler: Handler<'Log', unknown, unknown, never, number> = {
      effect: 'Log',
      handle: (input, continuation) => {
        collected.push(input as string);
        return continuation(undefined);
      },
    };
    const result = run(handle<unknown, never, number>(logProg, logHandler));
    expect(result).toBe(42);
    expect(collected).toEqual(['first', 'second']);
  });

  it('handle: handler ignora efectos de otro tag', () => {
    // Programa con dos operaciones distintas; el handler de 'A' deja 'B' intacto.
    const prog = bind(perform<'A', number, number>('A', 10), (x) =>
      bind(perform<'B', number, number>('B', x + 1), (y) => pure(y * 2)),
    );
    // Handler que duplica el input de 'A' como su output.
    const handlerA: Handler<'A', unknown, unknown, unknown, number> = {
      effect: 'A',
      handle: (input, continuation) => continuation((input as number) * 2),
    };
    // Handler que retorna el input de 'B' inalterado.
    const handlerB: Handler<'B', unknown, unknown, unknown, number> = {
      effect: 'B',
      handle: (input, continuation) => continuation(input as number),
    };
    const stage1 = handle<unknown, unknown, number>(prog, handlerA);
    const stage2 = handle<unknown, never, number>(stage1, handlerB);
    // A(10) -> 20 ; B(21) -> 21 ; * 2 = 42
    expect(run(stage2)).toBe(42);
  });

  it('handleState (componible) produce Eff<R, {result, state}> sin ejecutar', () => {
    // Verifica que handleState devuelve un Eff puro cuando no quedan otros
    // efectos, y que su valor coincide con runState.
    const prog = bind(
      modify<number>((s) => s + 5),
      () => getState<number>(),
    );
    const handled = handleState<never, number, number>(prog, 10);
    // Como ya no quedan efectos, handled debe ser pure({ result, state }).
    expect(handled.kind).toBe('pure');
    if (handled.kind === 'pure') {
      expect(handled.value.result).toBe(15);
      expect(handled.value.state).toBe(15);
    }
  });
});

describe('effects / sequence con efectos', () => {
  it('sequence sobre State acumula correctamente', () => {
    const steps: Eff<unknown, number>[] = [
      bind(
        modify<number>((s) => s + 1),
        () => getState<number>(),
      ),
      bind(
        modify<number>((s) => s * 2),
        () => getState<number>(),
      ),
      bind(
        modify<number>((s) => s - 3),
        () => getState<number>(),
      ),
    ];
    const { result, state } = runState<number, number[]>(sequence(steps), 10);
    // 10 -> 11 -> 22 -> 19
    expect(result).toEqual([11, 22, 19]);
    expect(state).toBe(19);
  });
});
