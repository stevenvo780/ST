// ============================================================
// Tipos para presentaciones finitas de grupos ⟨S | R⟩.
// ============================================================
//
// Un generador es un símbolo alfanumérico de un caracter. Su
// inverso se representa intercambiando mayúscula/minúscula:
//   'a'  ↔ 'A'         'r' ↔ 'R'
// Esta convención (clásica en cómputo combinatorio de grupos)
// hace que palabras sobre el alfabeto libre F(S) sean strings o
// arrays cortos y la operación "inverso de letra" sea barata.
//
// Una `Word` es una secuencia ordenada de letras (generadores o
// sus inversos). La palabra vacía `[]` representa el neutro `1`.
//
// Una `GroupPresentation` `⟨S | R⟩` consta de los generadores S
// y un conjunto de relaciones R, donde cada relación r ∈ R es
// una palabra que se interpreta como `r = 1` en el grupo cociente
// F(S)/⟪R⟫.
// ============================================================

export type Generator = string;
export type Word = Generator[];

export interface GroupPresentation {
  generators: Generator[];
  relations: Word[];
}
