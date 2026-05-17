// ============================================================
// ST Proof Certificate — Tipos públicos
// ============================================================
//
// Formato canónico portable para certificados de prueba inspirado
// en LFSC (LF + Side Conditions) y Dedukti. La filosofía es
// "check-only": el verificador NO hace búsqueda de prueba ni
// resuelve fórmulas — sólo comprueba que cada paso aplica
// correctamente una regla declarada sobre premisas ya derivadas.
//
// Las fórmulas viajan como strings en una representación canónica
// definida por la profile/perfil. El verificador trata strings con
// comparación literal previa normalización (trim + colapsar
// whitespace interno). Esto hace al certificado independiente del
// AST interno del prover y permite intercambio entre herramientas.

/**
 * Un paso del certificado. Cada paso tiene un id único dentro del
 * certificado, una regla declarada, una lista de argumentos
 * (referencias a ids previos o términos literales), una conclusión
 * derivada por aplicar la regla a las premisas, y la lista de ids
 * de los pasos de los que depende.
 *
 * - `id`: identificador único en el certificado (e.g. `s1`, `step-3`).
 * - `rule`: nombre canónico de la regla. Ver `STANDARD_RULES`.
 * - `args`: lista de argumentos textuales para la regla. Para reglas
 *   tipo `modus-ponens` los args suelen ser ids de premisas en el
 *   orden esperado por la regla (e.g. `["s1", "s2"]`). Reglas como
 *   `axiom` o `assumption` pueden tener `args` vacíos o incluir un
 *   nombre del axioma.
 * - `conclusion`: fórmula derivada en el paso, en forma canónica.
 * - `depends`: ids de pasos previos referenciados (ya sea por args
 *   o por contexto). El verificador valida que no haya ciclos y que
 *   todos los ids citados existan.
 */
export interface CertStep {
  id: string;
  rule: string;
  args: string[];
  conclusion: string;
  depends: string[];
}

/**
 * Firma criptográfica de un certificado. Por defecto Ed25519 vía
 * WebCrypto cuando está disponible; cae a HMAC-SHA256 en runtimes
 * que no soporten Ed25519 (Node antiguo, Bun viejo).
 */
export interface CertSignature {
  /** Algoritmo usado. */
  algorithm: 'Ed25519' | 'HMAC-SHA256';
  /** Clave pública en hex (raw export). Para HMAC: clave compartida. */
  publicKey: string;
  /** Firma en hex sobre la forma canónica sin hash ni signature. */
  signature: string;
}

/**
 * Certificado portable de prueba. Estructura inspirada en LFSC.
 *
 * `hash` es SHA-256 de la forma canónica del certificado SIN los
 * campos `hash` ni `signature`. Esto permite verificar integridad
 * antes y después de firmar.
 *
 * Ejemplo mínimo (modus ponens):
 *
 * ```ts
 * const cert: ProofCertificate = {
 *   version: '1.0',
 *   goal: 'q',
 *   profile: 'classical.propositional',
 *   axioms: ['p', 'p -> q'],
 *   steps: [
 *     { id: 's1', rule: 'axiom', args: ['p'], conclusion: 'p', depends: [] },
 *     { id: 's2', rule: 'axiom', args: ['p -> q'], conclusion: 'p -> q', depends: [] },
 *     { id: 's3', rule: 'modus-ponens', args: ['s2', 's1'], conclusion: 'q', depends: ['s2', 's1'] },
 *   ],
 *   hash: '...',
 * };
 * ```
 */
export interface ProofCertificate {
  version: '1.0';
  /** Fórmula final probada, en forma canónica. */
  goal: string;
  /** Perfil lógico bajo el cual se interpreta la prueba. */
  profile: string;
  /** Axiomas asumidos sobre los que se construye la prueba. */
  axioms: string[];
  /** Pasos del certificado en orden topológico (deps antes que dependientes). */
  steps: CertStep[];
  /** SHA-256 hex de la forma canónica sin `hash` ni `signature`. */
  hash: string;
  /** Firma opcional. Si presente, debe verificar contra la forma canónica sin firma. */
  signature?: CertSignature;
}

/**
 * Resultado de verificar un certificado en modo check-only.
 *
 * `valid` sólo es `true` si TODOS los chequeos pasan:
 *   - el hash coincide con la forma canónica del certificado;
 *   - todos los ids son únicos y todas las referencias existen;
 *   - no hay ciclos en `depends`;
 *   - el goal aparece como conclusión de algún paso;
 *   - cada paso aplica su regla correctamente vía
 *     `CertRuleChecker` (regla declarada existe y el checker
 *     retorna true para los args/conclusion/premisas).
 *
 * `errors` lista todas las violaciones detectadas; el verificador
 * NO se detiene en la primera para dar feedback completo.
 *
 * `stepsVerified` cuenta los pasos cuya regla fue chequeada con
 * éxito por su `CertRuleChecker`. `totalSteps` es `steps.length`.
 */
export interface VerificationResult {
  valid: boolean;
  errors: string[];
  stepsVerified: number;
  totalSteps: number;
}

/**
 * Firma de un checker de regla. Recibe los argumentos crudos del
 * paso, la conclusión declarada y las premisas resueltas (las
 * conclusiones de los pasos referenciados en `depends`, en el
 * orden en que aparecen en `depends`).
 *
 * Debe retornar `true` si y sólo si la regla se aplica
 * correctamente. NO debe hacer búsqueda — sólo chequear estructura
 * sintáctica de strings.
 */
export type CertRuleChecker = (args: string[], conclusion: string, premises: string[]) => boolean;
