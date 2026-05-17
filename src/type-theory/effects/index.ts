// ============================================================
// Algebraic effects + free monads — Punto de entrada público
// ============================================================
//
// API:
//   - Núcleo: pure / perform / bind / map / sequence / handle / run
//   - Estados: getState / putState / modify / runState / handleState
//   - Reader:  ask / asks / runReader / handleReader
//   - Writer:  tell / runWriter / handleWriter (+ monoides: listMonoid,
//                                                stringMonoid, sumMonoid)
//   - Exception: throw_ / runException / handleException

export type { Eff, Effect, Handler, Operation, Monoid, ExceptionResult } from './types';

export { pure, perform, bind, map, sequence, handle, run } from './core';

export { STATE_GET, STATE_PUT, getState, putState, modify, runState, handleState } from './state';
export type { State, StateGet, StatePut } from './state';

export { READER_ASK, ask, asks, runReader, handleReader } from './reader';
export type { Reader, ReaderAsk } from './reader';

export {
  WRITER_TELL,
  tell,
  runWriter,
  handleWriter,
  listMonoid,
  stringMonoid,
  sumMonoid,
} from './writer';
export type { Writer, WriterTell } from './writer';

export { EXCEPTION_THROW, throw_, runException, handleException } from './exception';
export type { Exception, ExceptionThrow } from './exception';
