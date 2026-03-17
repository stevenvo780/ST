import { LogicProfile } from '../types';
export { LogicProfile };
export declare class ProfileRegistry {
    private profiles;
    register(profile: LogicProfile): void;
    get(name: string): LogicProfile | undefined;
    list(): string[];
    has(name: string): boolean;
}
export declare const registry: ProfileRegistry;
//# sourceMappingURL=interface.d.ts.map