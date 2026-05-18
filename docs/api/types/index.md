# `types/index.ts`

Resultado de una operación lógica sobre una fórmula o argumento.

## Contents

- [`LogicStatus`](#logicstatus) — Type
- [`Severity`](#severity) — Type
- [`Diagnostic`](#diagnostic) — Interface
- [`FormulaKind`](#formulakind) — Type
- [`Formula`](#formula) — Interface
- [`isFormula`](#isformula) — Function
- [`SourceLocation`](#sourcelocation) — Interface
- [`TextLayerState`](#textlayerstate) — Interface
- [`DefinitionEntry`](#definitionentry) — Interface
- [`SourceInfo`](#sourceinfo) — Interface
- [`InterpretationEntry`](#interpretationentry) — Interface
- [`Valuation`](#valuation) — Type
- [`Model`](#model) — Interface
- [`World`](#world) — Interface
- [`Judgment`](#judgment) — Interface
- [`Theory`](#theory) — Interface
- [`ProofStepSource`](#proofstepsource) — Type
- [`ProofStep`](#proofstep) — Interface
- [`ProofMethod`](#proofmethod) — Type
- [`PremiseRef`](#premiseref) — Interface
- [`ProofMetadata`](#proofmetadata) — Interface
- [`AlternativeDerivationVariant`](#alternativederivationvariant) — Interface
- [`AlternativeDerivationSample`](#alternativederivationsample) — Interface
- [`Proof`](#proof) — Interface
- [`TableauTraceEntry`](#tableautraceentry) — Interface
- [`RunResult`](#runresult) — Interface
- [`TruthTableResult`](#truthtableresult) — Interface
- [`TruthTableRow`](#truthtablerow) — Interface
- [`LogicProfile`](#logicprofile) — Interface
- [`Anchor`](#anchor) — Interface
- [`Passage`](#passage) — Interface
- [`Formalization`](#formalization) — Interface
- [`Claim`](#claim) — Interface
- [`Support`](#support) — Interface
- [`Confidence`](#confidence) — Interface
- [`Context`](#context) — Interface
- [`ProtocolMethod`](#protocolmethod) — Type
- [`ProtocolRequest`](#protocolrequest) — Interface
- [`ProtocolResponse`](#protocolresponse) — Interface
- [`SymbolInfo`](#symbolinfo) — Interface
- [`HoverInfo`](#hoverinfo) — Interface
- [`CompletionItem`](#completionitem) — Interface
- [`ExecutionOutput`](#executionoutput) — Interface

## `LogicStatus`

> Type · `types/index.ts:8`

Resultado de una operación lógica sobre una fórmula o argumento.

```ts
export type LogicStatus = | 'valid' | 'invalid' | 'satisfiable' | 'unsatisfiable' | 'provable' | 'refutable' | 'unknown' | 'error';
```


## `Severity`

> Type · `types/index.ts:21`

Severidad de un diagnóstico emitido por el linter o el motor de ST.

```ts
export type Severity = 'error' | 'warning' | 'info' | 'hint';
```


## `Diagnostic`

> Interface · `types/index.ts:26`

Diagnóstico emitido durante el parseo, análisis o ejecución de un programa ST.

```ts
export interface Diagnostic
```


## `FormulaKind`

> Type · `types/index.ts:41`

Discriminante del nodo AST de una fórmula lógica de ST.

```ts
export type FormulaKind = | 'atom' | 'list' | 'not' | 'and' | 'or' | 'implies' | 'biconditional' | 'forall' | 'exists' | 'predicate' | 'equals' | 'modal_necessity' | 'modal_possibility' | 'temporal_next' | 'temporal_until' | 'nand' | 'nor' | 'xor' // Constantes lógicas (⊤/⊥, true/false) | 'true' | 'false' // Arithmetic | 'number' | 'add' | 'subtract' | 'multiply' | 'divide' | 'modulo' | 'less' | 'greater' | 'less_eq' | 'greater_eq' | 'fn_call';
```


## `Formula`

> Interface · `types/index.ts:111`

Nodo del AST de una fórmula lógica. Cubre lógica proposicional, modal, temporal, aritmética y FO.

```ts
export interface Formula
```


## `isFormula`

> Function · `types/index.ts:122`

```ts
export function isFormula(value: unknown): value is Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `value` | `unknown` | no |  |

### Returns

`value is Formula` — 


## `SourceLocation`

> Interface · `types/index.ts:130`

Posición en el archivo fuente (1-based). Usada en diagnósticos, nodos AST y el LSP.

```ts
export interface SourceLocation
```


## `TextLayerState`

> Interface · `types/index.ts:141`

Estado del Text Layer en un momento de ejecución: passages, formalizaciones, asertos y más.

```ts
export interface TextLayerState
```


## `DefinitionEntry`

> Interface · `types/index.ts:159`

Entrada del mapa de definiciones (v3): abreviaciones de fórmulas parametrizadas.

```ts
export interface DefinitionEntry
```


## `SourceInfo`

> Interface · `types/index.ts:169`

Metadatos bibliográficos de una fuente declarada con `source { ... }`.

```ts
export interface SourceInfo
```


## `InterpretationEntry`

> Interface · `types/index.ts:182`

Entrada de interpretación (v3): vínculo entre texto en lenguaje natural y una fórmula.

```ts
export interface InterpretationEntry
```


## `Valuation`

> Type · `types/index.ts:191`

Mapa de variables proposicionales a valores booleanos: `{ P: true, Q: false }`.

```ts
export type Valuation = Record<string, boolean>;
```


## `Model`

> Interface · `types/index.ts:196`

Modelo semántico que satisface (o refuta) una fórmula. El tipo determina qué campos aplican.

```ts
export interface Model
```


## `World`

> Interface · `types/index.ts:206`

Mundo posible en un modelo modal de Kripke: valuación local y relación de accesibilidad.

```ts
export interface World
```


## `Judgment`

> Interface · `types/index.ts:215`

Juicio lógico: una fórmula nombrada con su status tras ser evaluada por el motor.

```ts
export interface Judgment
```


## `Theory`

> Interface · `types/index.ts:226`

Teoría activa en el intérprete: axiomas, teoremas y juicios acumulados durante la ejecución.

```ts
export interface Theory
```


## `ProofStepSource`

> Type · `types/index.ts:237`

Origen estructural de un paso de prueba: cómo se justificó ese paso.

```ts
export type ProofStepSource = 'premise' | 'assumption' | 'rule' | 'semantic' | 'subproof' | 'goal';
```


## `ProofStep`

> Interface · `types/index.ts:240`

Paso individual en una prueba formal: fórmula, justificación y referencias a pasos anteriores.

```ts
export interface ProofStep
```


## `ProofMethod`

> Type · `types/index.ts:251`

Método de prueba empleado por el motor: deducción natural, tableau, semántico o SAT.

```ts
export type ProofMethod = 'natural_deduction' | 'tableau' | 'semantic' | 'sat';
```


## `PremiseRef`

> Interface · `types/index.ts:254`

Referencia a una premisa nombrada (axioma o teorema) usada en una prueba.

```ts
export interface PremiseRef
```


## `ProofMetadata`

> Interface · `types/index.ts:260`

Metadatos de diagnóstico de una prueba: conteos de pasos, derivaciones alternativas, etc.

```ts
export interface ProofMetadata
```


## `AlternativeDerivationVariant`

> Interface · `types/index.ts:272`

Variante alternativa de un paso de derivación (mismo resultado, diferente regla/justificación).

```ts
export interface AlternativeDerivationVariant
```


## `AlternativeDerivationSample`

> Interface · `types/index.ts:279`

Muestra de derivaciones alternativas detectadas para una fórmula dentro de una prueba.

```ts
export interface AlternativeDerivationSample
```


## `Proof`

> Interface · `types/index.ts:286`

Prueba formal completa o parcial con su goal, pasos y status.

```ts
export interface Proof
```


## `TableauTraceEntry`

> Interface · `types/index.ts:300`

Entrada de traza del algoritmo tableau para depuración y visualización paso a paso.

```ts
export interface TableauTraceEntry
```


## `RunResult`

> Interface · `types/index.ts:324`

Resultado completo de ejecutar un comando ST: status, prueba, modelo, tabla de verdad y más.

```ts
export interface RunResult
```


## `TruthTableResult`

> Interface · `types/index.ts:357`

Resultado de una operación `truth_table`: filas, tautología/contradicción y sub-fórmulas.

```ts
export interface TruthTableResult
```


## `TruthTableRow`

> Interface · `types/index.ts:370`

Fila de una tabla de verdad: valuación de variables y valor resultante (boolean o Belnap).

```ts
export interface TruthTableRow
```


## `LogicProfile`

> Interface · `types/index.ts:378`

Interfaz que implementa cada uno de los 11 perfiles lógicos de ST (clásico, modal, temporal, etc.).

```ts
export interface LogicProfile
```


## `Anchor`

> Interface · `types/index.ts:401`

Ancla dentro de un documento externo: apunta a un bloque, párrafo o rango específico.

```ts
export interface Anchor
```


## `Passage`

> Interface · `types/index.ts:408`

Pasaje textual vinculado desde el Text Layer: fragmento de un documento externo con ancla.

```ts
export interface Passage
```


## `Formalization`

> Interface · `types/index.ts:416`

Formalización: vinculación entre un pasaje textual y su representación en lógica formal.

```ts
export interface Formalization
```


## `Claim`

> Interface · `types/index.ts:424`

Aserto del Text Layer: afirmación con fórmula opcional, soporte bibliográfico y confianza.

```ts
export interface Claim
```


## `Support`

> Interface · `types/index.ts:435`

Vínculo de soporte entre un aserto y una fuente bibliográfica.

```ts
export interface Support
```


## `Confidence`

> Interface · `types/index.ts:441`

Nivel de confianza numérico (0-1) asignado a un aserto del Text Layer.

```ts
export interface Confidence
```


## `Context`

> Interface · `types/index.ts:447`

Contexto textual adicional asociado a un aserto del Text Layer.

```ts
export interface Context
```


## `ProtocolMethod`

> Type · `types/index.ts:455`

Métodos del protocolo editor de ST (JSON-RPC sobre stdio o socket).

```ts
export type ProtocolMethod = | 'parse' | 'check' | 'run' | 'render' | 'hover' | 'symbols' | 'goto_definition' | 'completion';
```


## `ProtocolRequest`

> Interface · `types/index.ts:466`

Solicitud al servidor de protocolo del editor de ST.

```ts
export interface ProtocolRequest
```


## `ProtocolResponse`

> Interface · `types/index.ts:473`

Respuesta del servidor de protocolo del editor de ST.

```ts
export interface ProtocolResponse
```


## `SymbolInfo`

> Interface · `types/index.ts:481`

Información de un símbolo del workspace para completado y hover en el editor.

```ts
export interface SymbolInfo
```


## `HoverInfo`

> Interface · `types/index.ts:500`

Información de hover: texto enriquecido y rango de la entidad bajo el cursor.

```ts
export interface HoverInfo
```


## `CompletionItem`

> Interface · `types/index.ts:506`

Ítem de completado de código sugerido por el servidor de protocolo.

```ts
export interface CompletionItem
```


## `ExecutionOutput`

> Interface · `types/index.ts:517`

Salida combinada de la ejecución de un programa ST: stdout, stderr, diagnostics y resultados.

```ts
export interface ExecutionOutput
```

