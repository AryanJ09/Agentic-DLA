# EXECUTION — the seed

> **Two files run this project.**
> [`docs/PLAN.md`](./PLAN.md) is the **context**: what we are building and why. Read it; do not change
> its decisions.
> **This file** is the **seed**: the exact tasks, in order, and the protocol for running them in a loop
> until everything is done. The loop keeps its state _in this file_, so any fresh session can pick up
> where the last one stopped.

---

## How to run it

**Inside Claude Code** (choose Opus as the model, open this repository):

```
/loop Follow docs/EXECUTION.md — run exactly one iteration of the Loop Protocol, then stop.
```

**Headless, from a terminal** (same thing, unattended):

```bash
while grep -q '^status: RUNNING' docs/EXECUTION.md && [ ! -f .ai/STOP ]; do
  claude -p --model opus "Follow docs/EXECUTION.md — run exactly one iteration of the Loop Protocol, then stop."
done
```

The headless loop needs the permission allow-list that task T0.5 adds. Until T0.5 is done, run the
loop inside Claude Code, where you can approve prompts.

**To pause at any time:** create an empty file `.ai/STOP`. Delete it to resume.

**To approve a gate:** tell Claude "approve gate G-…" (or change that gate's `Status:` line to
`approved` yourself), then set `status: RUNNING` in the State block below and restart the loop.

---

## State

```
status: RUNNING        # RUNNING · GATE · BLOCKED · DONE — the loop only continues on RUNNING
current: T0.3          # the task the next iteration should pick up
gate: none             # the open gate, if status is GATE
last_completed: T0.2
updated: 2026-10-08
```

---

## Settings

| Setting                                                      | Value                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Batch 1 components (owner may edit before T3.1 starts)       | **Button, Input, Checkbox, Dialog, Card**                                      |
| Coordinator (runs the loop, writes briefs, settles disputes) | Opus — `claude-opus-5-5`                                                       |
| Builder subagent                                             | Sonnet — `claude-sonnet-5-5`                                                   |
| Auditor subagent                                             | Haiku — `claude-haiku-5-5`                                                     |
| Critic subagent (judgment reviews)                           | Opus — `claude-opus-5-5`, a separate agent from the coordinator                |
| Attempts allowed per task before BLOCKED                     | 3                                                                              |
| Branch                                                       | the branch currently checked out; one commit per task; push after every commit |

---

## Loop Protocol — one iteration

Do these steps in order. **One task per iteration.**

1. **Check you may run.** If `.ai/STOP` exists, or `status` is not `RUNNING`, report the status in
   one plain sentence and stop.
2. **Ground yourself.** Read `docs/PLAN.md` sections relevant to the task, this file, and (once
   they exist) `CLAUDE.md` and the output of `pnpm -s doctor --summary`. Do not read everything —
   load only what the task touches.
3. **Pick the task.** The first task whose `Status:` is `todo` (or `in-progress`) and whose `Depends:`
   are all `done`. If it is a **gate**, set `status: GATE`, `gate:` to its ID, print what the owner must
   do in plain language, commit, push, stop.
4. **Write the brief (Coordinator, Opus).** Save `.ai/briefs/<task-id>.md`: goal, files to touch,
   steps, acceptance commands, and anything from PLAN.md the builder must respect. Set the task's
   `Status:` to `in-progress` and increase `Attempts:` by one.
5. **Build (named Builder).** Delegate the brief to the task's builder subagent. The coordinator
   does not write the bulk of the code itself.
6. **Check (scripts first).** Run every command under `Acceptance`. All must exit 0. Paste a
   one-line result for each into the task's `Log:`.
7. **Critique (named Critic, a different agent from the builder).** The critic reads the diff and the
   brief and returns _approve_ or a list of problems. Script failures always win over opinions; the
   critic cannot approve a failing check.
8. **Settle.**
   - Checks pass and critic approves → set `Status: done`, update the State block
     (`last_completed`, `current` = next task). **If the task changed what exists** (a file, a command,
     a component), update `README.md` in the same commit: its status rows, the commands list, "What's
     where" and the Roadmap. Nothing is described as working until its task is done. Then commit `"[<task-id>] <title>"`, push.
   - Otherwise → record the problems in `Log:`, commit the attempt, push. If `Attempts:` has reached
     the limit, set the task `Status: blocked`, set `status: BLOCKED`, write the reason under
     **Blockers**, commit, push, stop.
9. **Finish.** If every task is `done`, set `status: DONE`. Stop. The next iteration starts fresh.

### Never

- Never change a decision in `docs/PLAN.md`. If a task reveals that a decision is wrong, write it
  under **Decisions needed** and stop with `status: GATE`.
- Never skip, disable or weaken a test or a check to get green.
- Never hand-edit a generated file (`.ai/**`, `build/**`, anything with a do-not-edit banner).
- Never mark a task `done` without its acceptance commands passing in this iteration.
- Never pass a gate the owner has not approved.
- Never invent a part, state, accessibility claim or token to fill a field. Write "not decided".
- Never copy files from weave-ds-template (no licence). ds-base-ui (MIT) code may be adapted with
  its notice kept.

### Expanding later phases

Phases 4–18 start as one **expand** task each. Running an expand task means: the Coordinator reads
the phase in `docs/PLAN.md` §9 (and `docs/STRATEGY.md` if the owner has added one), writes concrete
tasks in the same format as below, inserts them after the expand task, and marks the expand task
`done`. The Critic checks that every bullet in the phase is covered by a task with an acceptance
command.

---

## Task format

```
### T<phase>.<n> · <title>
Status: todo | in-progress | done | blocked     Attempts: 0
Depends: <task ids>                              Builder: <agent>   Critic: <agent>
Steps: …
Acceptance: commands that must exit 0
Owner sees: what the owner can open to check it
Log:
```

---

## Phase 0 · Workspace

### T0.1 · Scaffold the workspace

Status: done Attempts: 1
Depends: — Builder: Sonnet Critic: Haiku
Steps: pnpm workspace (`packages/*`, `apps/*`, `prototypes/*`); root `package.json` with scripts
`format`, `format:check`, `lint`, `typecheck`, `test`, `verify`; TypeScript strict base config;
Prettier; ESLint (flat config); Vitest; Playwright config (no tests yet); `.nvmrc` = 22;
`.gitignore` (node_modules, build, dist, storybook-static, `.ai/STOP`). Commit `pnpm-lock.yaml`.
Acceptance: `pnpm install --frozen-lockfile` · `pnpm format:check` · `pnpm lint` · `pnpm typecheck` · `pnpm test`
Owner sees: nothing visual yet.
Log:

- Attempt 1 (Sonnet builder; this session was switched to Sonnet, so Opus did not coordinate). All 5 acceptance commands exit 0.
- TypeScript pinned to 6.0.3, not 7.0.2: typescript-eslint 8.71.1 supports TypeScript below 6.1 only. Revisit when it adds 7.
- Haiku critic, review 1: three valid defects (`@types/node` 24 vs Node 22; `--passWithNoTests` could hide a broken test glob; `typecheck` would skip future packages). All fixed. Its fourth point, "nothing committed", is by design.
- Haiku critic, review 2: APPROVE. Note: `eslint.config.js` is linted but not type-checked (plain JS).

### T0.2 · System identity and the ds-contracts switch

Status: done Attempts: 1
Depends: T0.1 Builder: Sonnet Critic: Haiku
Steps: `ds.config.json` exactly as PLAN.md §6.1 (`enabled: false`). `scripts/lib/config.ts` loads and
validates it with Zod; a test proves a bad config is refused with a clear message.
Acceptance: `pnpm typecheck` · `pnpm test`
Owner sees: `ds.config.json`.
Log:

- Attempt 1. Opus coordinator: brief in `.ai/briefs/T0.2.md`. Sonnet builder: `ds.config.json`, `scripts/lib/config.ts`, 11 tests, `zod` pinned to 4.6.5, README status rows updated. `pnpm verify` exit 0 (re-run by the coordinator).
- Coordinator protocol edits in the same iteration: step 8 now requires README updates when a task changes what exists; the T0.5 hook exempts `.ai/briefs/**`.
- Haiku critic, review 1: REJECT. (1) The EXECUTION.md edits are the coordinator's, not the builder's, so they are out of the builder's scope. (2) Valid bug: `outDir` accepted `.ai/`, `.ai/ ` and similar. Fixed: `outDir` must be lowercase kebab-case folders under `.ai/` and must not be `.ai/briefs` or inside it. 10 more cases tested; 25 tests pass.
- Haiku critic, review 2: APPROVE. It probed 12 more `outDir` values; all were refused or accepted correctly.

### T0.3 · `ds doctor`

Status: todo Attempts: 0
Depends: T0.2 Builder: Sonnet Critic: Opus
Steps: `scripts/doctor.ts`, run as `pnpm doctor`. Checks are registered modules; each returns pass /
report / fail with a **stable error code** (`DS0001`…) and a plain-English sentence plus the fix.
`--summary` prints three lines. `--json` prints machine-readable output. First check: config valid.
Exit 0 unless a check _fails_ (reports never fail the run).
Acceptance: `pnpm doctor` · `pnpm doctor --json` · `pnpm test`
Owner sees: run `pnpm doctor` — plain English health report.
Log:

### T0.4 · `pnpm verify` and CI

Status: todo Attempts: 0
Depends: T0.3 Builder: Sonnet Critic: Haiku
Steps: `verify` = format:check → lint → typecheck → test → doctor. `.github/workflows/ci.yml` runs
`pnpm verify` on every push and pull request, Node 22, pnpm cached.
Acceptance: `pnpm verify`
Owner sees: a green check on GitHub after the push.
Log:

### T0.5 · Agent setup: CLAUDE.md, subagents, hooks

Status: todo Attempts: 0
Depends: T0.4 Builder: Sonnet Critic: Opus
Steps: `CLAUDE.md` — "ground yourself first" (ds-base-ui idea: run `pnpm -s doctor --summary`, read
the task's area only), load context on demand, the honesty rules from PLAN.md §10, pointers to
PLAN.md and this file. `.claude/agents/builder.md` (model: sonnet), `auditor.md` (model: haiku),
`critic.md` (model: opus) with their roles from PLAN.md Part E. `.claude/settings.json`: SessionStart
hook runs `pnpm -s doctor --summary`; a PreToolUse hook refuses edits to `.ai/**` (except `.ai/briefs/**`, where the loop writes briefs) and
`**/build/**`.
`.github/CODEOWNERS` covering `.claude/`, `contracts/schema/`, `ds.config.json`.
Also in `.claude/settings.json`: a permission allow-list for `pnpm *`, `npx shadcn@4.21.4 *`,
`git add`, `git commit`, `git push` and file edits, so the headless loop never waits on a prompt.
Acceptance: `pnpm verify` · `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"`
Owner sees: `CLAUDE.md` in plain language.
Log:

### T0.6 · Decision records

Status: todo Attempts: 0
Depends: T0.5 Builder: Sonnet Critic: Opus
Steps: `docs/ADR/0000-template.md`; `0001-stack.md` recording PLAN.md §2 decisions and why;
`0002-contracts-and-the-ds-contracts-switch.md` recording §5–6; `scripts/adr-index.ts` generates
`docs/ADR/README.md` with `--check` (byte-equality); add `adr-index:check` to `verify`.
Acceptance: `pnpm verify`
Owner sees: `docs/ADR/README.md` — a list of every decision.
Log:

---

## Phase 1 · Tokens

### G-T · GATE — owner adds the tokens

Status: todo
Depends: T0.6
Owner does: put the token JSON files in `packages/tokens/tokens/` and the Tailwind v4 file in
`packages/tokens/reference/`, then say "approve gate G-T".
Skip rule: if both folders already contain files when the loop reaches this gate, mark it `approved`
and continue.

### T1.1 · Token check

Status: todo Attempts: 0
Depends: G-T Builder: Sonnet Critic: Haiku
Steps: `scripts/tokens/check.ts` (`pnpm tokens:check`): parse every file; detect the DTCG spelling
(hex strings or 2025.10 objects); every reference resolves; tiers (definitions → usage) identified;
light and dark define identical sets. Unresolvable references **fail**; tier and naming findings
**report**. Writes `.ai/reports/tokens-check.md`. Registered in `doctor`.
Acceptance: `pnpm tokens:check` · `pnpm test` · `pnpm doctor`
Owner sees: `.ai/reports/tokens-check.md`.
Log:

### T1.2 · Style Dictionary build

Status: todo Attempts: 0
Depends: T1.1 Builder: Sonnet Critic: Opus
Steps: `packages/tokens` builds with style-dictionary 5.6.0 (pinned): `build/tokens.css` (`--<prefix>-*`
variables, references kept as `var()`), `build/tokens.dark.css` (only the values that change),
`build/tailwind-theme.css` (Tailwind v4 `@theme` mapping to our variables), `build/shadcn-theme.css`
(shadcn's variables — `--primary`, `--background`, … — as aliases of our usage tokens), `build/tokens.ts`.
Determinism test: build twice, identical bytes. ds-base-ui's MIT build script may be adapted; keep
its notice.
Acceptance: `pnpm --filter @ds/tokens build` · `pnpm test` · `pnpm verify`
Owner sees: `packages/tokens/build/tokens.css`.
Log:

### T1.3 · Compare with the owner's Tailwind file

Status: todo Attempts: 0
Depends: T1.2 Builder: Haiku Critic: Sonnet
Steps: `pnpm tokens:compare` writes `.ai/reports/tailwind-diff.md`: every value in the owner's file
that is missing, extra or different in the generated theme, in plain language.
If differences exist, set `status: GATE` with gate `G-T2` and ask the owner which side is right.
Acceptance: `pnpm tokens:compare`
Owner sees: `.ai/reports/tailwind-diff.md`.
Log:

### T1.4 · Token auditor

Status: todo Attempts: 0
Depends: T1.2 Builder: Sonnet Critic: Haiku
Steps: `scripts/audit/tokens.ts`: flags arbitrary Tailwind values (`bg-[#…]`, `p-[13px]`), raw colours,
and definition-tier tokens used directly in `packages/ui`, `packages/blocks`, `prototypes/`; each
finding names the token that should replace it. Report mode (does not fail yet). Fixture tests with
planted violations. Registered in `doctor`.
Acceptance: `pnpm audit:tokens` · `pnpm test`
Owner sees: the auditor section of `pnpm doctor`.
Log:

### T1.5 · Storybook with a Tokens page

Status: todo Attempts: 0
Depends: T1.2 Builder: Sonnet Critic: Opus
Steps: `apps/storybook` (Storybook 10.6.1, React + Vite) loading the token CSS; a Tokens page showing
every colour, space, radius, type style and shadow in light and dark, with token names.
Acceptance: `pnpm --filter storybook build`
Owner sees: run `pnpm --filter storybook dev` and open the Tokens page.
Log:

---

## Phase 2 · Contracts and the switch

### T2.1 · Component contract schema

Status: todo Attempts: 0
Depends: T1.2 Builder: Sonnet Critic: Opus
Steps: Zod schema for the component contract exactly as PLAN.md §5; generate
`contracts/schema/component.schema.json` from it (generated file, `--check` gate). Fixture tests:
one valid draft Button contract; invalid fixtures for each required field.
Acceptance: `pnpm contracts:schema --check` · `pnpm test`
Owner sees: `docs/guide/contract.md` (written in T2.6).
Log:

### T2.2 · Block, pattern, flow and journey schemas (first version)

Status: todo Attempts: 0
Depends: T2.1 Builder: Sonnet Critic: Opus
Steps: same method for the four higher layers, fields from PLAN.md §4 and Part C. Flow contracts hold
an XState machine config with named guards only (test: JSON round-trip). Marked `experimental`;
Phases 5–8 may extend them.
Acceptance: `pnpm contracts:schema --check` · `pnpm test`
Owner sees: —
Log:

### T2.3 · Prop canon and prop map

Status: todo Attempts: 0
Depends: T2.1 Builder: Sonnet Critic: Opus
Steps: hand-kept `contracts/prop-canon.json` (axes `size`, `variant`, `hierarchy`, … with canonical
values; value glossary such as `outline`, never `outlined`). `pnpm prop-map` generates
`.ai/maps/prop-map.{json,md}`; `--check` in `verify`.
Acceptance: `pnpm prop-map --check` · `pnpm verify`
Owner sees: `.ai/maps/prop-map.md`.
Log:

### T2.4 · Contract validation and token integrity

Status: todo Attempts: 0
Depends: T2.2, T2.3 Builder: Sonnet Critic: Haiku
Steps: `pnpm contracts:validate`: every contract matches its schema; axes are subsets of the canon;
every token path referenced (after `{axis}` substitution) exists. Registered in `doctor`.
Acceptance: `pnpm contracts:validate` · `pnpm test`
Owner sees: the contracts section of `pnpm doctor`.
Log:

### T2.5 · ds-contracts exporter and compatibility gate

Status: todo Attempts: 0
Depends: T2.4 Builder: Sonnet Critic: Opus
Steps: implement PLAN.md §6.2 and §6.4–6.5 in **one adapter file** `scripts/export/ds-contracts.ts`:
contracts → `.ai/ds-contracts/contracts/`, tokens → `.ai/ds-contracts/tokens/` (legacy dialect, four
files). Pin `@ds-contracts/schema@16.0.0` and validate every export with its validator. `--check`
(byte-equality) in `verify`. Do the §6.6 verification (does CLI 0.4.0 have `figma bundle`?) and record
the answer in `docs/research/0001-ds-contracts-compatibility.md`.
Acceptance: `pnpm contracts:export --check` · `pnpm verify`
Owner sees: `docs/research/0001-ds-contracts-compatibility.md`.
Log:

### T2.6 · "The contract, explained"

Status: todo Attempts: 0
Depends: T2.5 Builder: Sonnet Critic: Opus
Steps: `docs/guide/contract.md` — every field in plain language with one example, written for a
designer. Linked from `CLAUDE.md`.
Acceptance: `pnpm verify`
Owner sees: `docs/guide/contract.md`.
Log:

---

## Phase 3 · Batch 1 components

### T3.0 · shadcn (Base UI edition) set up in `packages/ui`

Status: todo Attempts: 0
Depends: T2.6 Builder: Sonnet Critic: Opus
Steps: initialise shadcn in `packages/ui` with the Base UI base (`@base-ui/react@1.8.0` pinned) and
Tailwind v4 wired **only** to `build/tailwind-theme.css` and `build/shadcn-theme.css`. Storybook loads
`packages/ui`. Add the "imports only from the design system" lint rule for `prototypes/`.
Acceptance: `pnpm --filter @ds/ui build` · `pnpm verify`
Owner sees: —
Log:

### T3.1 – T3.5 · One task per Batch 1 component

Run the steps below once for each component in **Settings → Batch 1**, in that order, as tasks
T3.1 … T3.5. Copy this block per component when starting it, so each has its own Status and Log.

```
### T3.n · <Component>
Status: todo     Attempts: 0
Depends: T3.0 (and T3.<n-1>)     Builder: Sonnet     Critic: Opus (contract) + Haiku (checks)
Steps:
  1. Add it with the shadcn CLI (Base UI base). If shadcn has no such component, build it from
     Base UI in shadcn's style (PLAN.md §2 gap rule).
  2. Restyle to our tokens only — no arbitrary values, no raw colours.
  3. Write contracts/components/<Name>/<Name>.contract.json (PLAN.md §5). Intent and notFor are
     drafted by the builder and reviewed by the Opus critic for honesty; unknowns say "not decided".
  4. Tests: rendering, every variant, every state; keyboard behaviour where it has any.
  5. Storybook story: every variant, light and dark, a keyboard demo where relevant.
Acceptance: pnpm verify · pnpm contracts:validate · pnpm contracts:export --check ·
            pnpm audit:tokens (no findings for this component) · pnpm --filter storybook build
Owner sees: the component's Storybook page.
Log:
```

### G-B1 · GATE — owner validates Batch 1

Status: todo
Depends: T3.1, T3.2, T3.3, T3.4, T3.5
Owner does: review the five components in Storybook and `pnpm doctor`. Then either say
"approve gate G-B1" (optionally adding `docs/STRATEGY.md` with the building strategy), or list what
to change — the Coordinator turns each change into a task inserted before this gate.

---

## Phases 4–18 · Expand after Batch 1

Each is one expand task (see "Expanding later phases"). All depend on **G-B1**, so nothing past the
first five components is built until the owner approves them.

| Task | Expands                                                                                                                              | Depends        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| E4   | Phase 4 · Structural tooling (indexer, `ds manifest --json`, paint report)                                                           | G-B1           |
| E5   | Phase 5 · Pattern Blocks                                                                                                             | E4 tasks done  |
| E6   | Phase 6 · Patterns                                                                                                                   | E5 tasks done  |
| E7   | Phase 7 · Flows                                                                                                                      | E6 tasks done  |
| E8   | Phase 8 · Journey                                                                                                                    | E7 tasks done  |
| E9   | Phase 9 · Knowledge graph                                                                                                            | E8 tasks done  |
| E10  | Phase 10 · Experience validation                                                                                                     | E9 tasks done  |
| E11  | Phase 11 · Catalog and prototype spec                                                                                                | E10 tasks done |
| E12  | Phase 12 · Code emitter                                                                                                              | E11 tasks done |
| E13  | Phase 13 · Developer handoff package                                                                                                 | E12 tasks done |
| E14  | Phase 14 · Rules, skills                                                                                                             | E13 tasks done |
| E15  | Phase 15 · Local orchestration                                                                                                       | E14 tasks done |
| E16  | Phase 16 · Autonomous agents (Managed Agents)                                                                                        | E15 tasks done |
| E17  | Phase 17 · Figma switch — **only if the owner turns `dsContracts.enabled` on**; otherwise mark `done` with "skipped by owner choice" | E16 tasks done |
| E18  | Phase 18 · Proof tests                                                                                                               | E16 tasks done |

Status for each: `todo` until expanded.

---

## Blockers

_None._

## Decisions needed

_None._
