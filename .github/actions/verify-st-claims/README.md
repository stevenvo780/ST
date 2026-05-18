# verify-st-claims

GitHub Action that fails a PR if any `.st` files fail to validate in their declared profile.

## Quickstart

```yaml
- uses: stevenvo780/ST/.github/actions/verify-st-claims@v1
  with:
    paths: 'docs/proofs/**/*.st'
    default-profile: 'classical.propositional'
```

Or as a reusable step in your own repo (after tagging `v1` in this repo):

```yaml
- uses: stevenvo780/verify-st-claims@v1
  with:
    paths: 'docs/proofs/**/*.st'
    default-profile: 'classical.propositional'
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `paths` | No | `**/*.st` | Comma-separated glob patterns for `.st` files to verify |
| `default-profile` | No | `classical.propositional` | Profile to use when a file has no header declaration |
| `fail-on-warning` | No | `false` | Also fail if any file produces warnings |

## Outputs

| Output | Description |
|---|---|
| `verified-count` | Number of files that passed |
| `failed-count` | Number of files that failed |

## Profile header format

Add a `;; profile: <slug>` line as the very first non-empty line of your `.st` file.
This line is stripped before evaluation so the ST parser never sees it.

```
;; profile: modal.k

logic modal.k
axiom t1 = []P
check valid ([]P -> []P)
```

The `;; profile:` declaration **overrides** the `default-profile` input for that specific file.

## Supported profiles

| Slug | Description |
|---|---|
| `classical.propositional` | Classical propositional logic |
| `classical.first_order` | Classical first-order logic (FOL) |
| `modal.k` | Modal logic K (basic frame) |
| `epistemic.s5` | Epistemic logic S5 |
| `intuitionistic.propositional` | Intuitionistic propositional logic |
| `paraconsistent.belnap` | Paraconsistent Belnap 4-valued logic |
| `deontic.standard` | Standard deontic logic |
| `aristotelian.syllogistic` | Aristotelian syllogistic |
| `temporal.ltl` | Temporal LTL |
| `probabilistic.basic` | Basic probabilistic logic |
| `arithmetic` | Arithmetic |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | All matched files passed |
| `1` | One or more files failed (or `fail-on-warning: true` and warnings found) |

## Full example workflow

```yaml
name: Verify ST Claims

on:
  pull_request:
    paths:
      - '**/*.st'

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Verify .st files
        id: verify
        uses: stevenvo780/ST/.github/actions/verify-st-claims@v1
        with:
          paths: '**/*.st'
          default-profile: 'classical.propositional'
          fail-on-warning: 'false'

      - name: Print results
        if: always()
        run: |
          echo "Verified: ${{ steps.verify.outputs.verified-count }}"
          echo "Failed:   ${{ steps.verify.outputs.failed-count }}"
```

## Local simulation (no Docker required)

```bash
# From the repo root:
INPUT_PATHS="docs/proofs/**/*.st" \
INPUT_DEFAULT_PROFILE="classical.propositional" \
INPUT_FAIL_ON_WARNING="false" \
node .github/actions/verify-st-claims/verify.mjs
```

## Tagging a new release

```bash
git tag -a v1 -m "verify-st-claims v1"
git push origin v1
# Update the floating tag:
git tag -f v1
git push origin v1 --force
```
