# Agent-Ready Design System — Execution Plan v4.1

> Status: **proposed, awaiting owner review.** Nothing below is built yet.
> Every version number was checked against the npm registry or the source repository on 2026-10-08.

---

## 1. Goal

**Design-system-enabled prototyping.** Type a requirement in plain language; get a working,
clickable prototype built **only** from this design system's tokens, components, patterns and
flows — the way Lovable or v0 produce a prototype, except the output is governed by *our* system
instead of a generic one.

**The prototype is the handoff.** No Figma file is handed to developers. The prototype is real,
readable React source that imports our design-system packages, passes typecheck, lint and tests,
and can be dropped into a product codebase. A prototype that only runs inside a viewer is not
developer-ready and does not count.

Everything else in this plan exists to make that output correct:

- **Contracts** tell the AI what each piece is for, what it must never be used for, and how it
  behaves.
- **Validators** (plain scripts, same result every run) reject a prototype that breaks a rule,
  before a human sees it.
- **Agents** do the building, auditing and fixing; **a human approves**.

> **Core principle.** AI must not infer experience integrity from composition. Every layer —
> component, pattern block, pattern, flow, journey — states its own rules explicitly, and those
> rules are checked. *Skills decide when to act, scripts compute, files hold the state.*

### Who does what

The owner is a designer, not a coder. The owner **decides and reviews**; agents **write**.

| The owner does | Agents do |
|---|---|
| Describes a component, pattern or flow in plain language | Turn it into a contract, code, tests and stories |
| Reviews it in **Storybook** (a browser page per component, pattern and flow) | Run every check and report in plain language |
| Approves or rejects proposed fixes | Propose fixes; never apply them without approval |
| Owns business rules and flow decisions | Encode them as checkable rules |

Every phase below ends with **something the owner can open and look at**.

---

## 2. Final decisions

| Decision | Choice | Version (pinned) | Licence |
|---|---|---|---|
| Framework | React | 19.2 | MIT |
| Components | **shadcn — Base UI edition** (code copied into our repo, we own it) | shadcn CLI 4.21.4 | MIT |
| Behaviour layer under the components | **Base UI** (keyboard, focus, screen-reader behaviour) | @base-ui/react 1.8.0 | MIT |
| Gap rule | A component shadcn lacks is built from **Base UI**, wrapped in shadcn's style | — | — |
| Styling | Tailwind CSS, themed **only** from our tokens | tailwindcss 4.3.3 | MIT |
| Token compiler | Terrazzo (full support for the DTCG 2025.10 format) | @terrazzo/cli 2.7.1 | MIT |
| Tables | TanStack Table (what shadcn's data table already uses) | @tanstack/react-table 9.2.6 | MIT |
| Visual review | Storybook | 10.6.1 | MIT |
| Tests | Vitest + Playwright | vitest 5.0.3 · @playwright/test 1.64.0 | MIT / Apache-2.0 |
| Flows | XState (machines stored as JSON) + graph tools | xstate 5.33.2 · @xstate/graph 3.0.4 | MIT |
| Requirement → prototype | **Prototype spec** (our JSON, validated against a Zod catalog generated from contracts) → **our deterministic code emitter** → runnable React app (Vite) | zod 4 · vite | MIT |
| Agents (local) | Claude Agent SDK | @anthropic-ai/claude-agent-sdk 0.3.x | Anthropic Commercial Terms |
| Agents (autonomous, scheduled) | Claude Managed Agents (beta) | API beta `managed-agents-2026-04-01` | Anthropic Commercial Terms |
| Figma (later, optional) | **ds-contracts** via the switch in §6 | @ds-contracts/schema 16.0.0 · @ds-contracts/cli 0.4.0 | MIT |

**Nothing paid.** Explicitly avoided: Ark Plus, Park UI Plus, MUI X Pro, AG Grid Enterprise.

**Rejected:** Astryx (StyleX styling and beta), Ark UI (paid examples, swappability not needed),
Radix (slowing), Mantine (fights our tokens), MCP Apps / A2UI (bypass the design system),
XState v6 (alpha), Style Dictionary (no `$extends` or resolvers).

**json-render dropped.** It renders a JSON spec at runtime, which is not code a developer can
take. Its two useful ideas — a catalog that constrains the AI, and a prompt generated from that
catalog — we implement directly from our contracts.

**Pre-1.0 dependencies** (ds-contracts 0.4 / schema 16): pinned to exact versions
and each kept behind **one adapter file**, so a breaking upgrade touches one file.

---

## 3. Where every idea comes from

We rebuild from scratch. No files are copied from a repository without a licence.

| Source | What we take | How | Licence |
|---|---|---|---|
| **weave-ds-template** (cris-achiardi) | The AI-readability architecture: contract with **intent** (`purpose`, `behaviour`, `notFor`); **states that declare who controls them** (`intrinsic`/`authored`, `consumer`/`internal`); **axes** narrowed from a shared **prop canon**; generated prop map with a `--check` gate; **conformance cases as data** transcribed from the W3C ARIA patterns; `pnpm verify` chain; CLAUDE.md "load context on demand" and **honesty rules**; ADR governance with an auto-generated index; one config file for the system's identity (`ds.config.json`) | **Ideas only, rewritten** | **No licence → nothing copied** |
| **ds-base-ui** (christinevall) | **Token discipline**: two tiers (definitions → usage), components use semantic tokens only, zero raw colours; a CI validator that enforces the same rules CLAUDE.md states; "ground yourself first" protocol; SessionStart hook that reports system health; Storybook as the review surface; "wrap Base UI, never rebuild focus/keyboard/ARIA" | Ideas, and code where useful with attribution | MIT © Christine Vallaure |
| **ds-contracts-poc** (Southleft) | The **contract structure** that lets Figma be generated: `id`, `version`, props with per-surface bindings, anatomy parts bound to **token paths**, `{prop}` substitution, the token **integrity gate**; the Figma bundle and parity referee — through the switch in §6 | **Dependency** (pinned) + structural compatibility | MIT © Southleft |
| **Astryx** (Meta) | `ds manifest --json` (machine-readable list of everything), `ds doctor` (one health command), stable error codes | Ideas only | MIT |
| **Us** | Pattern Blocks → Patterns → Flows → Journeys; experience validation; knowledge graph; requirement → prototype; the agent roster | Built | — |

**Two places where we deliberately differ from weave:**

1. **Paints are bound to tokens.** Weave leaves paint sockets empty (`null`, its ADR-0003) because it
   is an unstyled template. We are a real system: every paint names a semantic token. This is also
   what ds-base-ui enforces and what ds-contracts requires.
2. **One framework backend.** Weave ships four (React, Vue, Angular, Web Components) to prove its
   contract is framework-neutral. We keep the contract framework-neutral but implement React only.

---

## 4. Architecture

```
EXPERIENCE LAYERS (each uses the one below AND adds its own meaning)

  Journey        continuity over time            journey.contract.json
  Flow           states, transitions, rules      flow.contract.json  (+ XState machine)
  Pattern        a recurring task, solved        pattern.contract.json
  Pattern Block  a composition with one job      block.contract.json + React
  Component      an interaction primitive        component.contract.json + React (shadcn/Base UI)
  Tokens         visual decisions                DTCG 2025.10 JSON
  ─────────────────────────────────────────────────────────────────────────────
  CONTRACTS      one per item, every layer — intent, constraints, states, relationships
  ─────────────────────────────────────────────────────────────────────────────
  AGENT INFRASTRUCTURE
  scripts (indexer, validators, graph) → .ai/ maps → rules + skills → agents → human approves
```

**Two validation loops.**

| Loop | Question | Examples |
|---|---|---|
| Structural | Did we build the system correctly? | A raw colour in a component; a prop value not in the canon; a contract that fails its schema; a token reference that does not exist |
| Experience | Does the assembled experience behave correctly? | An unreachable flow state; an async step with no failure path; a recoverable error that loses the user's input; Flow B needing data Flow A never produces |

Both loops are scripts. A separate, clearly labelled *agent judgment* section ("does this pattern
meet its objective?") is advisory and decided by a human — it never counts as passing.

---

## 5. The component contract (our schema)

One file per component: `contracts/components/<Name>/<Name>.contract.json`, validated by
`contracts/schema/component.schema.json`. Fields, and where each comes from:

| Field | Meaning | From |
|---|---|---|
| `id` | Stable identity, never renamed: `ds.<kebab-name>` | ds-contracts |
| `name` | Display / export name | ds-contracts (`name`) · weave (`component`) |
| `version` | Semver; bumped on any change to props, states, anatomy or a11y | ds-contracts |
| `status` | `{ level: experimental \| stable \| deprecated, since, note, replacedBy? }` | weave |
| `intent.purpose` | One paragraph: why it exists | weave |
| `intent.behaviour[]` | What it must do | weave |
| `intent.notFor[]` | What it must never be used for, and what to use instead | weave |
| `usage.useCases[]`, `usage.patterns[]`, `usage.antiPatterns[]` | Where it fits, with examples | ours |
| `axes` | Variant axes, each a **subset of the prop canon** with a default | weave |
| `props` | Every other prop: `name`, `type` (`enum` \| `boolean` \| `text` \| `arrayOf`), `default`, `description` | ds-contracts |
| `states` | Each state: `kind` (intrinsic/authored), `control` (consumer/internal), `description`, `visual` | weave |
| `semantics` | `role`, `focusable`, plus `element` for the web binding | weave + ds-contracts |
| `a11y` | `focusVisible`, `minHitArea`, `contrast`, `keyboard`, `notes[]` | both |
| `composition` | `children` and named `slots` (`accepts`, `min`, `max`, `required`) | weave |
| `anatomy` | Tree of named parts; each part has `tokens` (CSS property → **token path**), `states` overrides, `layout`, and `whenAxis` overrides using `{axis}` substitution | weave shape, ds-contracts token binding |
| `behaviour` | Optional named primitives: `collection`, `member`, `range`, `dismisses`, `form` | weave |
| `relationships` | `pairsWith`, `contains`, `usedBy` (the indexer fills `usedBy`) | ours |
| `bindings.code` | `{ importPath, export, element }` | ds-contracts |
| `bindings.figma` | Per-axis/prop Figma property names and value spellings; `anchors` once generated | ds-contracts |

**Token references are token paths**, e.g. `{color.action.{variant}.background}` — never CSS
variable names. This keeps contracts independent of the CSS prefix and is exactly what
ds-contracts expects.

A trimmed Button example lives in `contracts/components/Button/` once Phase 3 runs.

---

## 6. The ds-contracts switch — exact specification

**Purpose.** ds-contracts is optional and off by default. Developers receive the prototype, not a
Figma file, so this switch serves designers only (keeping a Figma library in step with code). But everything we build is
ds-contracts-compatible **from day one**, so turning it on later is one setting — not a rewrite.

### 6.1 The switch

```jsonc
// ds.config.json
{
  "name": "ds", "scope": "@ds", "tokenPrefix": "ds", "dataPrefix": "ds",
  "dsContracts": {
    "enabled": false,                 // ← THE SWITCH. true = Figma steps run
    "schema": "16.0.0",              // pinned @ds-contracts/schema
    "cli": "0.4.0",                  // pinned @ds-contracts/cli
    "outDir": ".ai/ds-contracts"     // generated, never hand-edited
  }
}
```

### 6.2 What runs while the switch is OFF (from Phase 2 onwards)

The compatibility is **gated in CI even when the switch is off**, so it can never quietly rot:

1. `pnpm contracts:export` — converts every one of our contracts into ds-contracts format in
   `.ai/ds-contracts/contracts/` and our tokens into ds-contracts' token dialect in
   `.ai/ds-contracts/tokens/`.
2. `pnpm contracts:export --check` — the output must be byte-identical to what is committed, and
   **every exported contract must pass `@ds-contracts/schema`'s own validator**. Any failure turns
   CI red with the component and field named.
3. The **token integrity gate**: every token path referenced by any contract (after `{axis}`
   substitution) must exist in our token set. (Same rule ds-contracts enforces.)

### 6.3 What turning the switch ON adds

| Step | Command | Needs |
|---|---|---|
| Build a Figma bundle (contracts + tokens + light/dark modes in one file) | `ds-contracts figma bundle .ai/ds-contracts/contracts/*.json --tokens .ai/ds-contracts/tokens --modes light,dark --out .ai/ds-contracts/bundle.json` | Nothing extra |
| Load it into Figma | Paste the bundle into the ds-contracts plugin's Build tab, or `ds-contracts figma push` | Figma account + plugin |
| Write Figma identities back into our contracts | Anchors returned by the plugin → `bindings.figma.anchors` | — |
| Detect drift between code and Figma | `ds-contracts diff` (exit 0 clean · 1 drift · 2 error) in CI | `FIGMA_TOKEN` |

We **do not** use ds-contracts' React generator: our components are shadcn/Base UI code, and its
generated React does not yet guarantee keyboard and screen-reader behaviour (deferred to its V1.1).

### 6.4 Field mapping (ours → ds-contracts)

| Ours | ds-contracts | Rule |
|---|---|---|
| `id`, `name`, `version` | same | copied |
| `status.level` | `status` | `experimental` → `draft`; `stable` → `stable`; `deprecated` → `deprecated` |
| `intent.purpose` | `description` | first sentence; full text kept in `documentationLinks` → our docs page |
| `intent.notFor`, `usage.*` | — | not exported (ds-contracts has no field); stays in our contract |
| each `axes.<axis>` | `props[]` entry: `type: { enum: values }`, `default`, `bindings.figma: { kind: "VARIANT", property, values }`, `bindings.code: { prop }` | Figma spellings from `bindings.figma` |
| `props[]` boolean | `props[]`, `bindings.figma.kind: "BOOLEAN"` | — |
| `props[]` text / children | `props[]`, `type: "text"`, `bindings.figma.kind: "TEXT"` | — |
| `props[]` arrayOf | `props[]`, `type: { arrayOf }`, `bindings.figma.kind: "NONE"` | code-only (Figma has no list type) |
| `states` with `control: internal` and name `hover` / `focus-visible` / `disabled` | `states[]` | other intrinsic states are not exported |
| `states` with `control: consumer` (e.g. `loading`) | already a boolean prop | — |
| `semantics.element`, `semantics.role` | `semantics: { element, role }` | element from `bindings.code.element` |
| `a11y.focusVisible`, `minHitArea`, `contrast` | `a11y` | `keyboard`, `notes` not exported |
| `anatomy.<part>.tokens` | `anatomy.<part>.tokens` | identical shape: CSS property → `{token.path}` |
| `anatomy.<part>.whenAxis["size=s"]` | `{size}` substitution in the token path | the exporter folds per-value overrides into one substituted path where the paths line up, otherwise refuses by name |
| `anatomy.<part>.states` | `anatomy.<part>.states` | same |
| `composition.slots.<name>` | anatomy part with `slot: { name, accepts, min, max, required }` | `accepts` converted from names to `ds.*` ids |
| `composition.children` (text) | anatomy part with `content: { prop: "children" }` | — |
| `bindings.code` | `bindings.code.anchors: { importPath, export }` | — |
| `bindings.figma` | `bindings.figma` | — |
| `behaviour.*` (collection, range, dismisses, form) | — | not exported; ds-contracts declares behaviour out of scope (its "events" cover toggles only) |

**Honest limits of the switch.** Figma receives structure, variants, properties, token bindings and
nesting. It does **not** receive intent, anti-patterns, keyboard behaviour or flow logic — Figma
cannot hold them. Those stay in our contracts, which remain the source of truth.

### 6.5 Tokens across the switch

| | Our source | ds-contracts dialect |
|---|---|---|
| Format | DTCG **2025.10** (colour objects, `{value, unit}` dimensions) — required by Terrazzo | Legacy DTCG: hex strings (`"#2563EB"`), unit strings (`"16px"`) |
| Files | Tiered: primitives → semantic, with modes | `primitives.tokens.json`, `semantic.tokens.json`, `modes/semantic.light.tokens.json`, `modes/semantic.dark.tokens.json` |
| Rule | Components bind to semantic tokens only | Same rule |

`contracts:export` down-converts tokens mechanically (object colour → hex, `{value, unit}` → string)
and splits modes into the four files above. Its own integrity rules are checked too: every alias
resolves, and light and dark define identical token sets.

### 6.6 Version pinning and upgrades

- Pinned to the **latest published** releases: `@ds-contracts/schema@16.0.0`, `@ds-contracts/cli@0.4.0`.
- The repository is already on schema 17 (release candidate). It moves four Figma-only fields under
  `bindings.figma`. When 17 is published: run `ds-contracts migrate .ai/ds-contracts --check`, update
  the one exporter file, bump the pin.
- **Phase 2 verification task:** confirm the exporter's output validates against 16.0.0 exactly, and
  that `figma bundle` is available in CLI 0.4.0. If `figma bundle` is only in 0.5.0-rc, the Figma
  phase pins that release candidate instead.

---

## 7. Tokens

| Step | What happens |
|---|---|
| Source | `packages/tokens/tokens/` — the owner's existing tokens, DTCG 2025.10, two tiers (definitions → usage, from ds-base-ui), light/dark modes |
| Check | Every file parses; every reference resolves; light and dark define the same set; no component-level token points at a primitive |
| Build (Terrazzo) | `tokens.css` — CSS variables `--ds-<path>` (prefix from `ds.config.json`), references kept as `var()` |
| Tailwind theme | Generated `@theme` block so Tailwind classes resolve to our variables, and shadcn's theme variables (`--primary`, `--background`, …) generated as **aliases** of our semantic tokens. No hand-written theme file |
| Auditor | Flags arbitrary Tailwind values (`bg-[#389fba]`, `p-[13px]`), raw colours anywhere, and primitives used directly in components — with the token that should replace each |
| Switch | Legacy-dialect export for ds-contracts (§6.5) |

If the owner's tokens are in the older hex-string dialect, Phase 1 converts them once to 2025.10
(mechanical) and reports every change.

---

## 8. Repository layout

```
.
├── ds.config.json                    # identity + the ds-contracts switch
├── packages/
│   ├── tokens/                       # DTCG source → Terrazzo → CSS + Tailwind theme
│   ├── ui/                           # React components (shadcn Base UI edition, owned code)
│   │   └── src/components/<Name>/    # <Name>.tsx · <Name>.stories.tsx · <Name>.test.tsx
│   ├── blocks/                       # Pattern Blocks (React)
│   └── prototyper/                   # prototype spec schema · catalog · code emitter
├── prototypes/<name>/                # GENERATED handoff apps (one runnable React app each)
├── contracts/
│   ├── schema/                       # component · block · pattern · flow · journey schemas
│   ├── prop-canon.json               # hand-kept axes + value glossary
│   ├── conformance/                  # keyboard/behaviour cases as data (W3C ARIA patterns)
│   ├── components/<Name>/<Name>.contract.json
│   └── blocks/ · patterns/ · flows/ · journeys/
├── experience/business-rules.json    # named rules that flow guards reference
├── scripts/                          # index · audit · validate · graph · export (TypeScript only)
├── apps/storybook/                   # the owner's review surface
├── .ai/                              # GENERATED — maps, graph, reports, ds-contracts export
├── .claude/{CLAUDE.md, rules/, skills/, settings.json}
├── agents/                           # Agent SDK coordinator + subagents; Managed Agents config
└── docs/{PLAN.md, ADR/, research/}
```

One language (TypeScript), one package manager (pnpm). No Python, no Nx.

---

## 9. Phases

Legend: ✅ done · ☐ to do · **👁 what the owner reviews**

### Part A — Foundation

**Phase 0 · Workspace**
- ☐ pnpm workspace, TypeScript strict, Vitest, Playwright, Prettier, ESLint, CI workflow
- ☐ `ds.config.json` with the switch (off)
- ☐ `pnpm verify` chain (weave) and `ds doctor` (Astryx idea) — both green on an empty repo
- ☐ SessionStart hook: prints a plain-language health summary (ds-base-ui idea)
- 👁 `ds doctor` output in plain English

**Phase 1 · Tokens**
- ✅ Tokens exist (owner's)
- ☐ Import into `packages/tokens/tokens/`; check and, if needed, convert to 2025.10
- ☐ Terrazzo build → CSS variables + Tailwind theme + shadcn aliases
- ☐ Token auditor
- 👁 Storybook "Tokens" page: every colour, space, radius, type style, light and dark

**Phase 2 · Contracts and the switch** *(early on purpose — everything after builds on it)*
- ☐ Five schemas: component, block, pattern, flow, journey
- ☐ `prop-canon.json` + generated prop map with `--check`
- ☐ `contracts:export` + `--check` against `@ds-contracts/schema@16.0.0` (§6.2), in CI
- ☐ Verification task from §6.6
- 👁 A one-page "contract explained" doc per field, in plain language

### Part B — Components

**Phase 3 · Seed components** (shadcn Base UI edition)
- ☐ Button, Input, Field, Select, Checkbox, Dialog, Card, Badge, Table (TanStack), Tabs
- ☐ For each: owned code restyled to our tokens · contract · conformance tests · Storybook story
- ☐ Gap demo: one component shadcn lacks (Number field or Autocomplete) built from Base UI in shadcn style
- ☐ Each passes the structural loop **and** the ds-contracts export check
- 👁 Storybook: every component, every variant, light/dark, keyboard demo

**Phase 4 · Structural tooling**
- ☐ Indexer → `.ai/index.json`, component usage, token usage (determinism test: run twice, no diff)
- ☐ `ds manifest --json` — everything an agent can use, in one file
- ☐ Paint report (tokens declared vs tokens used) — a report first, a gate once the baseline is clean (weave rule)
- 👁 A "system health" page: coverage, violations, suggested fixes

### Part C — Experience layers

**Phase 5 · Pattern Blocks** — ValidationField, AmountSummary, FilterBar, AppShell (from shadcn's sidebar block)
**Phase 6 · Patterns** — ReviewAndSubmit, ConfirmConsequentialAction, SearchAndSelect, DataTableWithFilters
**Phase 7 · Flows** — Payment (Completed / Pending / Recoverable failure / Validation conflict / Rejected), AddRecipient; XState machines with named guards = business rules
**Phase 8 · Journey** — FirstTransfer (AddRecipient → Payment, resume point, state carried across)
- 👁 for 5–8: each one in Storybook; flows shown as clickable diagrams and as screens

**Phase 9 · Knowledge graph** — `.ai/graph.json`: `uses`, `requires(rule)`, `hands-off-to` edges, from Journey down to tokens

**Phase 10 · Experience validation**
- ☐ Flow: every state reachable; every non-final state can finish; every async step has success, failure and pending exits; recoverable failures keep user input; every guard names a real business rule
- ☐ Pattern: high-consequence actions require ConfirmConsequentialAction
- ☐ Journey: each flow's outputs cover the next flow's inputs
- ☐ Simulation: scripted event sequences replayed through each flow
- 👁 Plain-language experience report

### Part D — Requirement → prototype

**Phase 11 · Catalog and prototype spec**
- ☐ Zod catalog generated from contracts: every component, block and pattern, with allowed props and slots
- ☐ The catalog's generated prompt becomes the prototyper agent's instructions
- ☐ **Prototype spec** (JSON): screens, routes, the components/blocks/patterns on each, the XState flow machine, and the data each screen needs
- ☐ Spec validation: catalog check → structural loop → experience loop. Nothing is emitted from an invalid spec

**Phase 12 · Code emitter** (deterministic: the same spec always produces the same code)
- ☐ Spec → a Vite + React app in `prototypes/<name>/`:
  - pages that import only `@ds/ui`, `@ds/blocks` and our patterns; no raw HTML styling, no arbitrary Tailwind values
  - flows as XState machines in their own files, wired to the screens
  - data through a typed **mock adapter** per screen, clearly marked, so developers swap in the real API in one place
  - a test per flow path (generated from `@xstate/graph`) and a smoke test per screen
- ☐ Agents may refine the emitted code; every refinement re-runs the same checks

**Phase 13 · Developer handoff package**
- ☐ Each prototype must pass: typecheck · lint · tests · token auditor · "imports only from the design system" check
- ☐ `HANDOFF.md` generated per prototype: screens, flows and their states, business rules used, components used (linked to their contracts), mock adapters to replace, known limits
- ☐ Export as a zip or a branch/PR the developers can take
- 👁 **The product:** type a requirement → click through the prototype → hand the same code to developers

### Part E — Agents

**Phase 14 · Rules, skills, CLAUDE.md** — path-scoped rules per layer; skills: scaffold-component, add-from-shadcn, add-from-base-ui, scaffold-block, author-pattern, author-flow, prototype, audit, review-pr
**Phase 15 · Local orchestration (Agent SDK)** — coordinator + subagents; a hook before every edit blocks writes to generated files; a hook after every edit runs the matching validator; CI is the hard gate
**Phase 16 · Autonomous agents (Managed Agents)** — nightly audit, PR review, fix proposals

| Agent | Model | Job |
|---|---|---|
| Coordinator | Opus | Plans, delegates, combines |
| Structural auditor | Haiku | Token, prop, contract and export checks |
| Experience validator | Sonnet | Flow and journey checks, simulation |
| Prototyper | Opus | Requirement → prototype spec → handoff code |
| Healer | Sonnet | Proposes fixes, never applies them |

Notes: Managed Agents is beta and not eligible for zero-data-retention or HIPAA coverage; repo
skills load without review, so `.claude/` is protected by CODEOWNERS; every session has a budget cap.

### Part F — Figma (optional)

**Phase 17 · Flip the switch** — `dsContracts.enabled: true`; bundle → Figma plugin → anchors written
back → `ds-contracts diff` in CI. Needs a Figma account and `FIGMA_TOKEN`.
- 👁 The component library appearing in Figma, generated from the same contracts

### Phase 18 · Proof — the thesis as tests
- ☐ A payment flow using only approved components but with no failure path → **structural passes, experience fails**
- ☐ A journey handoff missing a field → fails
- ☐ A high-consequence action without confirmation → fails
- ☐ A prototype request needing an unapproved component → rejected with the reason
- ☐ A generated prototype passes typecheck, lint, tests and the design-system-only import check, and runs in a clean install
- ☐ Every contract exports to ds-contracts and validates (switch readiness)
- ☐ A nightly autonomous run on a planted problem → report + proposed fix awaiting approval

---

## 10. Rules every phase follows (from weave, adopted)

- **Never hand-edit a generated file.** Generated files carry a do-not-edit banner; CI checks byte-equality.
- **Deterministic output only.** Sorted reads, fixed comparisons, nothing machine-specific.
- **A gap is a finding, not a blank to fill.** "Not decided" is written as such.
- **Never invent** a part, a state, an accessibility claim or a token to fill a field.
- **A new check starts as a report**, and becomes a gate once the baseline is clean.
- **Every rule CLAUDE.md states is enforced by a script in CI** (ds-base-ui).

---

## 11. Done when

- [ ] `pnpm verify` and `ds doctor` are green in CI
- [ ] Every contract validates against its schema **and** exports cleanly to ds-contracts
- [ ] A typed requirement produces a developer-ready prototype (real React source, passing all checks, with `HANDOFF.md`) built only from our system, and an invalid one is rejected with a reason
- [ ] All Phase 18 proof tests behave as described
- [ ] Turning `dsContracts.enabled` on produces a Figma bundle with no contract changes

---

## 12. Open items

| Item | Owner | Default if no answer |
|---|---|---|
| Token files into `packages/tokens/tokens/` | Owner | Phase 1 waits |
| ds-contracts CLI version with `figma bundle` | Agent, Phase 2 | Pin 0.5.0-rc if 0.4.0 lacks it |
| Business rules for the Payment flow | Owner, Phase 7 | Agent drafts, owner edits |
| Figma account and token | Owner, Phase 17 only | Phase 17 deferred |

---

## Attribution

- ds-base-ui — MIT © Christine Vallaure
- ds-contracts-poc / @ds-contracts/* — MIT © Southleft, LLC
- shadcn/ui — MIT © shadcn
- Base UI — MIT © MUI
- weave-ds-template — ideas only (no licence; nothing copied)
- Astryx — ideas only (MIT, Meta)
