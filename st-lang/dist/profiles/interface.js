"use strict";
// ============================================================
// ST Profile Interface — Interfaz base para perfiles lógicos
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = exports.ProfileRegistry = void 0;
// Registro global de perfiles
class ProfileRegistry {
    profiles = new Map();
    register(profile) {
        this.profiles.set(profile.name, profile);
    }
    get(name) {
        return this.profiles.get(name);
    }
    list() {
        return Array.from(this.profiles.keys());
    }
    has(name) {
        return this.profiles.has(name);
    }
}
exports.ProfileRegistry = ProfileRegistry;
// Singleton global
exports.registry = new ProfileRegistry();
//# sourceMappingURL=interface.js.map