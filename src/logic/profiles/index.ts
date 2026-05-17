// ============================================================
// ST Profiles — Barrel de registro automático
// ============================================================
// Este archivo importa y registra todos los perfiles built-in.
// Para añadir un nuevo perfil, simplemente impórtalo aquí y
// llama a registry.register(new MiPerfil()).
//
// Los perfiles externos pueden usar registerProfile() de la API
// pública sin modificar este archivo.
// ============================================================

import { registry } from './interface';

// ── Built-in profiles ─────────────────────────────────────────
import { ClassicalPropositional } from './classical/propositional';
import { ClassicalFirstOrder } from './classical/first-order';
import { ModalK } from './modal/k';
import { ParaconsistentBelnap } from './paraconsistent/belnap';
import { DeonticStandard } from './deontic/standard';
import { EpistemicS5 } from './epistemic/s5';
import { AristotelianSyllogistic } from './aristotelian/syllogistic';
import { IntuitionisticPropositional } from './intuitionistic/propositional';
import { TemporalLTL } from './temporal/ltl';
import { ProbabilisticBasic } from './probabilistic/basic';
import { ArithmeticProfile } from './arithmetic';

// Registro idempotente
const builtins = [
  ClassicalPropositional,
  ClassicalFirstOrder,
  ModalK,
  ParaconsistentBelnap,
  DeonticStandard,
  EpistemicS5,
  AristotelianSyllogistic,
  IntuitionisticPropositional,
  TemporalLTL,
  ProbabilisticBasic,
  ArithmeticProfile,
];

for (const Profile of builtins) {
  const instance = new Profile();
  if (!registry.has(instance.name)) {
    registry.register(instance);
  }
}

// Re-exportar todo para conveniencia
export {
  ClassicalPropositional,
  ClassicalFirstOrder,
  ModalK,
  ParaconsistentBelnap,
  DeonticStandard,
  EpistemicS5,
  AristotelianSyllogistic,
  IntuitionisticPropositional,
  TemporalLTL,
  ProbabilisticBasic,
  ArithmeticProfile,
};
export { registry, ProfileRegistry } from './interface';
