export class PluginConflictError extends Error {
  readonly pluginName: string;

  constructor(pluginName: string) {
    super(
      `Plugin "${pluginName}" ya está registrado. Llamá unregister("${pluginName}") antes de registrar una nueva versión.`,
    );
    this.name = 'PluginConflictError';
    this.pluginName = pluginName;
    Object.setPrototypeOf(this, PluginConflictError.prototype);
  }
}

export class PluginValidationError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(`Plugin inválido: ${errors.join('; ')}`);
    this.name = 'PluginValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, PluginValidationError.prototype);
  }
}
