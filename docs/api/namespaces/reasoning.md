# `namespaces/reasoning.ts`

Namespace: Reasoning

Razonamiento no-monótono, probabilístico, abductivo y herramientas
de manipulación simbólica. Argumentación Dung, revisión de creencias AGM,
abducción, lógica de Markov, redes Bayesianas, citation reasoning,
análisis hyperreal, cache de teoremas, anti-unificación, term-rewriting.

Importa así:
  import { Reasoning } from '@stevenvo780/st-lang';
  const ext = Reasoning.argumentation.computeExtensions(af, 'grounded');
  const cited = Reasoning.citationReasoning.deriveWithCitations(claims, ev);
