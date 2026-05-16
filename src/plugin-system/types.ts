import { Formula } from '../types';

export interface PluginCheckResult {
  valid: boolean;
  result?: string;
}

export interface ProfilePlugin {
  name: string;
  description?: string;
  version: string;
  evaluate(formula: Formula, env: Record<string, unknown>): unknown;
  checkValid(formula: Formula): PluginCheckResult;
  supportedOperators?: Set<string>;
}

export interface PluginInfo {
  name: string;
  version: string;
  description?: string;
}

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
}
