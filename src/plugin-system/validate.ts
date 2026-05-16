import { PluginValidationResult, ProfilePlugin } from './types';

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validatePlugin(plugin: unknown): PluginValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(plugin)) {
    return { valid: false, errors: ['plugin debe ser un objeto'] };
  }

  if (!isNonEmptyString(plugin.name)) {
    errors.push('name: falta o no es string no vacío');
  }

  if (!isNonEmptyString(plugin.version)) {
    errors.push('version: falta o no es string no vacío');
  } else if (!SEMVER_RE.test(plugin.version)) {
    errors.push(`version: "${plugin.version}" no cumple semver (X.Y.Z)`);
  }

  if (typeof plugin.evaluate !== 'function') {
    errors.push('evaluate: falta o no es función');
  } else if (plugin.evaluate.length < 2) {
    errors.push('evaluate: debe aceptar (formula, env)');
  }

  if (typeof plugin.checkValid !== 'function') {
    errors.push('checkValid: falta o no es función');
  } else if (plugin.checkValid.length < 1) {
    errors.push('checkValid: debe aceptar (formula)');
  }

  if (plugin.description !== undefined && typeof plugin.description !== 'string') {
    errors.push('description: si está presente debe ser string');
  }

  if (plugin.supportedOperators !== undefined && !(plugin.supportedOperators instanceof Set)) {
    errors.push('supportedOperators: si está presente debe ser un Set<string>');
  } else if (plugin.supportedOperators instanceof Set) {
    for (const op of plugin.supportedOperators) {
      if (typeof op !== 'string') {
        errors.push('supportedOperators: todos los elementos deben ser string');
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertPlugin(plugin: unknown): asserts plugin is ProfilePlugin {
  const result = validatePlugin(plugin);
  if (!result.valid) {
    throw new Error(`Plugin inválido: ${result.errors.join('; ')}`);
  }
}
