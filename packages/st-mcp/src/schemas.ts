import { z } from 'zod';

/**
 * Perfiles lógicos válidos en st-lang.
 * Se mantienen como literales explícitos para validación temprana en MCP,
 * pero `createServer` también acepta cualquier slug que `listProfiles()`
 * de st-lang reporte (forward-compat con nuevos perfiles).
 */
export const KNOWN_PROFILES = [
  'classical.propositional',
  'classical.first_order',
  'modal.k',
  'paraconsistent.belnap',
  'deontic.standard',
  'epistemic.s5',
  'aristotelian.syllogistic',
  'intuitionistic.propositional',
  'temporal.ltl',
  'probabilistic.basic',
  'arithmetic',
] as const;

export type KnownProfile = (typeof KNOWN_PROFILES)[number];

/**
 * Schema de input para `st_check`: verifica si una fórmula es válida
 * (tautología / teorema) bajo el perfil indicado.
 */
export const CheckInputShape = {
  formula: z
    .string()
    .min(1)
    .describe(
      'Fórmula lógica en sintaxis ST (ej: "(P -> P)", "((P -> Q) & (Q -> R)) -> (P -> R)"). Operadores: ! ¬ & | -> <->; cuantificadores forall x. y exists x.; modales [] (necesidad) y <> (posibilidad).',
    ),
  profile: z
    .string()
    .default('classical.propositional')
    .describe(
      'Perfil lógico (ej: classical.propositional, classical.first_order, modal.k, intuitionistic.propositional, paraconsistent.belnap, deontic.standard, epistemic.s5, aristotelian.syllogistic, temporal.ltl, probabilistic.basic, arithmetic).',
    ),
};

/**
 * Schema de input para `st_derive`: intenta derivar una conclusión a
 * partir de axiomas en el perfil dado.
 */
export const DeriveInputShape = {
  axioms: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      'Lista de fórmulas que se asumen como axiomas (ej: ["P -> Q", "P"]). Se les asignan nombres a1..aN automáticamente.',
    ),
  conclusion: z
    .string()
    .min(1)
    .describe('Fórmula que se quiere derivar a partir de los axiomas.'),
  profile: z
    .string()
    .default('classical.propositional')
    .describe('Perfil lógico (default: classical.propositional).'),
};

/**
 * Schema de input para `st_countermodel`: si una fórmula NO es válida,
 * devuelve una valuación que la falsifica.
 */
export const CountermodelInputShape = {
  formula: z
    .string()
    .min(1)
    .describe('Fórmula presuntamente inválida (ej: "(P -> Q)").'),
  profile: z
    .string()
    .default('classical.propositional')
    .describe(
      'Perfil lógico. Solo perfiles con búsqueda de contramodelo (classical.propositional, modal.k, etc.) generarán salida.',
    ),
};

/**
 * Schema de input para `st_formalize`: registra un pasaje de texto (NL)
 * junto a su contraparte formal en sintaxis ST, devolviendo la fórmula
 * registrada y los diagnósticos. Aborda el caso típico de
 * "formalización asistida" — el LLM propone la fórmula, ST la valida y
 * la deja registrada.
 */
export const FormalizeInputShape = {
  text: z
    .string()
    .min(1)
    .describe('Texto natural que se quiere formalizar (proposición o enunciado en lenguaje natural).'),
  formula: z
    .string()
    .min(1)
    .describe('Fórmula propuesta en sintaxis ST que captura el significado del texto.'),
  anchor: z
    .string()
    .optional()
    .describe(
      'Identificador opcional del pasaje (ej: "doc.md#section1"). Si se omite, se usa un anchor genérico "mcp.input#p1".',
    ),
  profile: z
    .string()
    .default('classical.propositional')
    .describe('Perfil lógico bajo el que se interpreta la fórmula.'),
};

export const CheckInput = z.object(CheckInputShape);
export const DeriveInput = z.object(DeriveInputShape);
export const CountermodelInput = z.object(CountermodelInputShape);
export const FormalizeInput = z.object(FormalizeInputShape);

export type CheckInputT = z.infer<typeof CheckInput>;
export type DeriveInputT = z.infer<typeof DeriveInput>;
export type CountermodelInputT = z.infer<typeof CountermodelInput>;
export type FormalizeInputT = z.infer<typeof FormalizeInput>;
