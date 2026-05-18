# `namespaces/logic.ts`

Namespace: Logic

Agrupa los perfiles lógicos disponibles en ST. Cada sub-namespace expone
los símbolos del módulo correspondiente sin colisiones de nombres entre
lógicas (CTL.Formula vs LTL.Formula, etc).

Importa así:
  import { Logic } from '@stevenvo780/st-lang';
  Logic.modal.s5.isValid(formula);
  Logic.ctl.modelCheckCTL(kripke, formula);
