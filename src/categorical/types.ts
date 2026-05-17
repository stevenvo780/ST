// ============================================================
// ST Categorical — Tipos públicos
// ============================================================
// Definiciones de interfaz para Category, Functor,
// NaturalTransformation, Cone, Diagram y MonoidalCategory.
//
// Decisión de diseño: cada morfismo se identifica por su `id`
// (clave estable string-able). La categoría es responsable de
// resolver compose / source / target a partir de la identidad
// del morfismo. Esto permite igualdad estructural simple por
// `id`, sin tener que comparar callbacks o funciones.
// ============================================================

/**
 * Identidad estable de un morfismo. Las categorías construidas
 * en este módulo usan strings derivados de `src→tgt:name`, pero
 * un cliente puede definir su propio esquema mientras sea único.
 */
export type MorId = string;

/**
 * Una categoría sobre objetos `Obj` y morfismos `Mor`. Las
 * propiedades `objects` y `morphisms` exponen el grafo subyacente
 * para tests y consumidores que necesiten iterar.
 *
 * Los morfismos viven en un `Map<MorId, Mor>` para que el chequeo
 * de leyes pueda muestrear pares aleatorios sin coste prohibitivo.
 */
export interface Category<Obj, Mor> {
  readonly name: string;
  readonly objects: Set<Obj>;
  readonly morphisms: Map<MorId, Mor>;

  /** Devuelve la identidad para un objeto (axioma: existe y es única). */
  identity(obj: Obj): Mor;
  /** Composición g ∘ f (lee de derecha a izquierda: aplica f y luego g). */
  compose(g: Mor, f: Mor): Mor;
  /** Dominio del morfismo. */
  source(m: Mor): Obj;
  /** Codominio del morfismo. */
  target(m: Mor): Obj;

  /** Igualdad de morfismos (semántica del modelo concreto). */
  eqMor(a: Mor, b: Mor): boolean;
  /** Igualdad de objetos (semántica del modelo concreto). */
  eqObj(a: Obj, b: Obj): boolean;

  /** Devuelve todos los morfismos a→b. Útil para tests y para limits. */
  hom(a: Obj, b: Obj): Mor[];

  /** Verifica asociatividad: (h∘g)∘f = h∘(g∘f) sobre un muestreo. */
  verifyAssociativity(sample?: number): boolean;
  /** Verifica id ∘ f = f y f ∘ id = f. */
  verifyIdentity(sample?: number): boolean;
}

/**
 * Functor F : C → D, dado por su acción en objetos y morfismos.
 * Debe preservar identidad y composición; ambas son verificables.
 */
export interface Functor<O1, M1, O2, M2> {
  readonly name: string;
  readonly source: Category<O1, M1>;
  readonly target: Category<O2, M2>;
  onObjects(obj: O1): O2;
  onMorphisms(mor: M1): M2;
  /** F(id_a) = id_{F(a)} para todo objeto. */
  verifyIdentityPreservation(): boolean;
  /** F(g∘f) = F(g)∘F(f). */
  verifyComposition(sample?: number): boolean;
}

/**
 * Transformación natural η : F ⇒ G entre functores paralelos
 * F, G : C → D. Cada componente `η_a : F(a) → G(a)`. La condición
 * de naturalidad es G(f) ∘ η_a = η_b ∘ F(f) para f : a→b en C.
 */
export interface NaturalTransformation<O1, M1, O2, M2> {
  readonly name: string;
  readonly source: Functor<O1, M1, O2, M2>;
  readonly target: Functor<O1, M1, O2, M2>;
  component(obj: O1): M2;
  verifyNaturality(sample?: number): boolean;
}

/**
 * Un diagrama es un functor desde una categoría índice J (típicamente
 * pequeña, finita) a la categoría ambiente C. Para nuestros usos
 * concretos representamos el diagrama por sus vértices (objetos
 * de C imagen) y sus aristas (morfismos forzados entre ellos).
 */
export interface Diagram<O, M> {
  readonly vertices: Map<string, O>;
  readonly edges: Array<{ from: string; to: string; mor: M }>;
}

/**
 * Cono sobre un diagrama: un objeto ápice junto con un morfismo
 * (`leg`) hacia cada vértice del diagrama, conmutando con sus aristas.
 */
export interface Cone<O, M> {
  apex: O;
  legs: Map<string, M>;
}

/**
 * Cocono (dual del cono): un ápice con morfismos *desde* cada vértice.
 */
export interface Cocone<O, M> {
  apex: O;
  legs: Map<string, M>;
}

/**
 * Categoría monoidal: añade producto tensorial y unidad sobre
 * la estructura categórica. No imponemos asociadores ni unitores
 * explícitos — los modelos concretos (Set con ×) son estrictos
 * suficiente para verificar α, λ, ρ por igualdad en objetos.
 */
export interface MonoidalCategory<O, M> extends Category<O, M> {
  readonly unit: O;
  tensor(a: O, b: O): O;
  tensorMor(f: M, g: M): M;
  /** Unitor izquierdo: 1 ⊗ a ≅ a (verificable por igualdad de objetos). */
  verifyLeftUnitor(sample?: number): boolean;
  /** Unitor derecho: a ⊗ 1 ≅ a. */
  verifyRightUnitor(sample?: number): boolean;
  /** Asociador: (a⊗b)⊗c = a⊗(b⊗c). */
  verifyAssociator(sample?: number): boolean;
}
