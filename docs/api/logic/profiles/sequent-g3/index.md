# `logic/profiles/sequent-g3/index.ts`

============================================================ G3 Sequent Calculus — Entrada publica del perfil ============================================================ Este perfil expone el calculo de secuentes G3 (Gentzen reformulado por Kleene) para logica proposicional clasica. La interfaz que se reexporta es minima y suficiente para integrarlo desde otros perfiles o pruebas:   import { proveFormula, proveSequent, proofToLatex }     from 'src/profiles/sequent-g3';
