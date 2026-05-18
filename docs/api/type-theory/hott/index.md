# `type-theory/hott/index.ts`

============================================================ HoTT — Homotopy Type Theory (núcleo público) ============================================================ Extiende MLTT con:   - Path A x y como espacio de caminos (no proposición)   - refl, transport, ap, J-eliminator (computacionales sobre refl)   - pathSym (inverso) y pathConcat (concatenación)   - HITs: S¹ (circle, base, loop) y suspensión (north, south, meridian)   - Univalence como axioma (ua) no computacional API mínima compatible con MLTT:   inferType / checkType / normalize / alphaBetaEq
