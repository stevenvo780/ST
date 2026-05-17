// ============================================================
// ST Profile Interface — Interfaz base para perfiles lógicos
// ============================================================

import { LogicProfile } from '../../types';

export { LogicProfile };

// Registro global de perfiles
export class ProfileRegistry {
  private profiles: Map<string, LogicProfile> = new Map();

  register(profile: LogicProfile): void {
    this.profiles.set(profile.name, profile);
  }

  get(name: string): LogicProfile | undefined {
    return this.profiles.get(name);
  }

  list(): string[] {
    return Array.from(this.profiles.keys());
  }

  has(name: string): boolean {
    return this.profiles.has(name);
  }
}

// Singleton global
export const registry = new ProfileRegistry();
