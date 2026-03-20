import { Formula } from '../types';

/**
 * Motor de Internado de Fórmulas (Hash-Consing)
 * Asegura que fórmulas idénticas compartan la misma instancia en memoria.
 */
export class FormulaFactory {
  private static cache = new Map<string, Formula>();

  /**
   * Crea o recupera una instancia única de una fórmula.
   */
  static create(f: Formula): Formula {
    if (!f) return f;

    // Generar hash estructural
    const hash = this.hash(f);

    // Si ya existe en caché, devolver la instancia existente
    const cached = this.cache.get(hash);
    if (cached) {
      return cached;
    }

    // Si no existe, congelar la nueva instancia y guardarla
    // Importante: No modificamos f.source para no perder info de depuración,
    // pero el hash ignora el source para permitir la compartición estructural.
    this.cache.set(hash, f);
    return f;
  }

  /**
   * Genera un hash único basado únicamente en la estructura de la fórmula.
   * Ignora metadatos como 'source' o 'id'.
   */
  private static hash(f: Formula): string {
    const parts: string[] = [f.kind];

    if (f.name) parts.push(`n:${f.name}`);
    if (f.variable) parts.push(`v:${f.variable}`);
    if (f.value !== undefined) parts.push(`val:${f.value}`);

    if (f.params) {
      parts.push(`p:${f.params.join(',')}`);
    }

    if (f.args && f.args.length > 0) {
      parts.push('a[');
      for (const arg of f.args) {
        parts.push(this.hash(arg));
        parts.push(',');
      }
      parts.push(']');
    }

    return parts.join('|');
  }

  /**
   * Limpia la caché de fórmulas (útil para liberar RAM entre ejecuciones pesadas).
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Devuelve el número de fórmulas únicas en memoria.
   */
  static size(): number {
    return this.cache.size;
  }
}
