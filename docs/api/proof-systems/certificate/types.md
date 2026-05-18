# `proof-systems/certificate/types.ts`

Un paso del certificado. Cada paso tiene un id único dentro del
certificado, una regla declarada, una lista de argumentos
(referencias a ids previos o términos literales), una conclusión
derivada por aplicar la regla a las premisas, y la lista de ids
de los pasos de los que depende.

- `id`: identificador único en el certificado (e.g. `s1`, `step-3`).
- `rule`: nombre canónico de la regla. Ver `STANDARD_RULES`.
- `args`: lista de argumentos textuales para la regla. Para reglas
  tipo `modus-ponens` los args suelen ser ids de premisas en el
  orden esperado por la regla (e.g. `["s1", "s2"]`). Reglas como
  `axiom` o `assumption` pueden tener `args` vacíos o incluir un
  nombre del axioma.
- `conclusion`: fórmula derivada en el paso, en forma canónica.
- `depends`: ids de pasos previos referenciados (ya sea por args
  o por contexto). El verificador valida que no haya ciclos y que
  todos los ids citados existan.

## Contents

- [`CertStep`](#certstep) — Interface
- [`CertSignature`](#certsignature) — Interface
- [`ProofCertificate`](#proofcertificate) — Interface
- [`VerificationResult`](#verificationresult) — Interface
- [`CertRuleChecker`](#certrulechecker) — Type

## `CertStep`

> Interface · `proof-systems/certificate/types.ts:36`

Un paso del certificado. Cada paso tiene un id único dentro del
certificado, una regla declarada, una lista de argumentos
(referencias a ids previos o términos literales), una conclusión
derivada por aplicar la regla a las premisas, y la lista de ids
de los pasos de los que depende.

- `id`: identificador único en el certificado (e.g. `s1`, `step-3`).
- `rule`: nombre canónico de la regla. Ver `STANDARD_RULES`.
- `args`: lista de argumentos textuales para la regla. Para reglas
  tipo `modus-ponens` los args suelen ser ids de premisas en el
  orden esperado por la regla (e.g. `["s1", "s2"]`). Reglas como
  `axiom` o `assumption` pueden tener `args` vacíos o incluir un
  nombre del axioma.
- `conclusion`: fórmula derivada en el paso, en forma canónica.
- `depends`: ids de pasos previos referenciados (ya sea por args
  o por contexto). El verificador valida que no haya ciclos y que
  todos los ids citados existan.

```ts
export interface CertStep
```


## `CertSignature`

> Interface · `proof-systems/certificate/types.ts:49`

Firma criptográfica de un certificado. Por defecto Ed25519 vía
WebCrypto cuando está disponible; cae a HMAC-SHA256 en runtimes
que no soporten Ed25519 (Node antiguo, Bun viejo).

```ts
export interface CertSignature
```


## `ProofCertificate`

> Interface · `proof-systems/certificate/types.ts:82`

Certificado portable de prueba. Estructura inspirada en LFSC.

`hash` es SHA-256 de la forma canónica del certificado SIN los
campos `hash` ni `signature`. Esto permite verificar integridad
antes y después de firmar.

Ejemplo mínimo (modus ponens):

```ts
const cert: ProofCertificate = {
  version: '1.0',
  goal: 'q',
  profile: 'classical.propositional',
  axioms: ['p', 'p -> q'],
  steps: [
    { id: 's1', rule: 'axiom', args: ['p'], conclusion: 'p', depends: [] },
    { id: 's2', rule: 'axiom', args: ['p -> q'], conclusion: 'p -> q', depends: [] },
    { id: 's3', rule: 'modus-ponens', args: ['s2', 's1'], conclusion: 'q', depends: ['s2', 's1'] },
  ],
  hash: '...',
};
```

```ts
export interface ProofCertificate
```


## `VerificationResult`

> Interface · `proof-systems/certificate/types.ts:116`

Resultado de verificar un certificado en modo check-only.

`valid` sólo es `true` si TODOS los chequeos pasan:
  - el hash coincide con la forma canónica del certificado;
  - todos los ids son únicos y todas las referencias existen;
  - no hay ciclos en `depends`;
  - el goal aparece como conclusión de algún paso;
  - cada paso aplica su regla correctamente vía
    `CertRuleChecker` (regla declarada existe y el checker
    retorna true para los args/conclusion/premisas).

`errors` lista todas las violaciones detectadas; el verificador
NO se detiene en la primera para dar feedback completo.

`stepsVerified` cuenta los pasos cuya regla fue chequeada con
éxito por su `CertRuleChecker`. `totalSteps` es `steps.length`.

```ts
export interface VerificationResult
```


## `CertRuleChecker`

> Type · `proof-systems/certificate/types.ts:133`

Firma de un checker de regla. Recibe los argumentos crudos del
paso, la conclusión declarada y las premisas resueltas (las
conclusiones de los pasos referenciados en `depends`, en el
orden en que aparecen en `depends`).

Debe retornar `true` si y sólo si la regla se aplica
correctamente. NO debe hacer búsqueda — sólo chequear estructura
sintáctica de strings.

```ts
export type CertRuleChecker = (args: string[], conclusion: string, premises: string[]) => boolean;
```

