# `proof-systems/certificate/verify.ts`

============================================================ ST Proof Certificate — Check-only verifier ============================================================ El verificador NO hace búsqueda de prueba. Asume que el certificado declara cada paso con su regla y premisas, y se limita a:   1. validar integridad (hash + estructura);   2. validar acíclicidad de `depends`;   3. resolver premisas y delegar al `CertRuleChecker` de la regla;   4. comprobar que el goal aparece como conclusión.

## `verifyCertificate`

> Function · `proof-systems/certificate/verify.ts:63`

Verifica un certificado en modo check-only.

Las reglas custom (parámetro `rules`) se prueban PRIMERO; si no
está la regla, se busca en `STANDARD_RULES`. Esto permite a
profiles externos extender el conjunto sin tocar el core.

```ts
export async function verifyCertificate( cert: ProofCertificate, rules: Map<string, CertRuleChecker> = STANDARD_RULES, ): Promise<VerificationResult>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cert` | `ProofCertificate` | no |  |
| `rules` | `Map<string, CertRuleChecker>` | yes |  |

### Returns

`Promise<VerificationResult>` — 

