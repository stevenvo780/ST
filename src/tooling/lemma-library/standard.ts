// ============================================================
// standardLibrary() — ensamble de la biblioteca curada base
// ============================================================

import { LemmaLibrary } from './library';
import { PROPOSITIONAL_LEMMAS } from './propositional';
import { ARITHMETIC_LEMMAS } from './arithmetic';
import { SET_THEORY_LEMMAS } from './set-theory';
import { MODAL_LEMMAS } from './modal';
import { FIRSTORDER_LEMMAS } from './firstorder';

export function standardLibrary(): LemmaLibrary {
  const lib = new LemmaLibrary();
  for (const lemma of PROPOSITIONAL_LEMMAS) lib.add(lemma);
  for (const lemma of ARITHMETIC_LEMMAS) lib.add(lemma);
  for (const lemma of SET_THEORY_LEMMAS) lib.add(lemma);
  for (const lemma of MODAL_LEMMAS) lib.add(lemma);
  for (const lemma of FIRSTORDER_LEMMAS) lib.add(lemma);
  return lib;
}
