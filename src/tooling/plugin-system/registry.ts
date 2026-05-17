import { PluginConflictError, PluginValidationError } from './errors';
import { PluginInfo, ProfilePlugin } from './types';
import { validatePlugin } from './validate';

export class ProfileRegistry {
  private static plugins: Map<string, ProfilePlugin> = new Map();

  static register(plugin: ProfilePlugin): void {
    const result = validatePlugin(plugin);
    if (!result.valid) {
      throw new PluginValidationError(result.errors);
    }
    if (ProfileRegistry.plugins.has(plugin.name)) {
      throw new PluginConflictError(plugin.name);
    }
    ProfileRegistry.plugins.set(plugin.name, plugin);
  }

  static unregister(name: string): boolean {
    return ProfileRegistry.plugins.delete(name);
  }

  static get(name: string): ProfilePlugin | undefined {
    return ProfileRegistry.plugins.get(name);
  }

  static list(): PluginInfo[] {
    const out: PluginInfo[] = [];
    for (const plugin of ProfileRegistry.plugins.values()) {
      const info: PluginInfo = { name: plugin.name, version: plugin.version };
      if (plugin.description !== undefined) {
        info.description = plugin.description;
      }
      out.push(info);
    }
    return out;
  }

  static has(name: string): boolean {
    return ProfileRegistry.plugins.has(name);
  }

  static size(): number {
    return ProfileRegistry.plugins.size;
  }

  static clear(): void {
    ProfileRegistry.plugins.clear();
  }
}
