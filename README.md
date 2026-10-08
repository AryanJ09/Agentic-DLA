# Agent-Ready Design System

A design system built so that an AI agent can **read it, follow it and build with it**. You describe what you want in plain language; the agent assembles a working prototype using only this system's tokens, components, patterns and flows, then checks its own work against written rules before you see it.

The prototype **is** the developer handoff: real React source that imports this system, passes typecheck, lint and tests, and can be dropped into a product codebase. No Figma file is handed over.

> **Status: just started.** Only Phase 0 is underway: the workspace and its checks exist; tokens, components and contracts do not yet. Every section below says what is **built** and what is **planned**. Nothing planned is described as working.

|                          |                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **The plan (context)**   | [`docs/PLAN.md`](docs/PLAN.md): what we are building and why, every decision, where each idea comes from                          |
| **The execution (seed)** | [`docs/EXECUTION.md`](docs/EXECUTION.md): the exact tasks, in order, run in a loop until done. Its State block shows where we are |
| **Storybook**            | _planned_ (Phase 1): a browser page per token, component, pattern and flow                                                        |
| **Code**                 | this repository                                                                                                                   |

## Start here

| You want to…                                                 | Go to                                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Understand the idea, no code knowledge needed                | [In plain words](#in-plain-words)                                                 |
| See what is decided and why                                  | [`docs/PLAN.md`](docs/PLAN.md) §2                                                 |
| See what is built and what is next                           | [Roadmap](#roadmap) · the State block in [`docs/EXECUTION.md`](docs/EXECUTION.md) |
| Run the build loop                                           | [Run it](#run-it)                                                                 |
| Understand the contract that makes the system readable to AI | [The contract](#the-contract)                                                     |
| Know how Figma fits in (optionally, later)                   | [The ds-contracts switch](#the-ds-contracts-switch-optional)                      |
| Check the words                                              | [Words you will hear](#words-you-will-hear)                                       |

## In plain words

**Most design systems are written for people.** Components, tokens and docs explain themselves to a designer or developer who can use judgment. An AI agent can follow every token and every component API, produce code that compiles, and still build the wrong experience: a confirmation before a required check, an error that wipes what the user typed, a returning user forced to start over.

**So this system writes down more than looks.** Every layer says what it is for, what it must never be used for, and how it behaves, in a form scripts can check:

| Layer             | What it answers                                                             | Written down as                 |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------- |
| **Tokens**        | What does it look like?                                                     | Design-token JSON               |
| **Component**     | What can this element do?                                                   | A contract per component        |
| **Pattern Block** | What small job does this composition do?                                    | A contract                      |
| **Pattern**       | How is a recurring task solved? (review and submit, confirm a risky action) | A contract                      |
| **Flow**          | How does it behave as state changes? (processing, failure, retry)           | A contract plus a state machine |
| **Journey**       | What must stay coherent over time? (start, leave, return, finish)           | A contract                      |

**Each layer adds its own meaning, and correctness does not pass upward by itself.** A correct button does not make a correct form, and correct forms do not make a correct payment flow. That is why every layer has its own contract and its own checks.

### Who does what

You decide and review; agents write.

| You                                                     | Agents                                           |
| ------------------------------------------------------- | ------------------------------------------------ |
| Describe a component, pattern or flow in plain language | Turn it into a contract, code, tests and a story |
| Look at it in Storybook                                 | Run every check and report in plain language     |
| Approve or reject proposed fixes                        | Propose fixes; never apply them without approval |
| Own the business rules                                  | Encode them as checkable rules                   |

**Opus plans, other models build, a different agent checks, scripts decide pass or fail, and a human approves.** No agent reviews its own work, and a reviewer's opinion never overrides a failing check.

### How a colour gets from a token to the screen

_Illustrative: the real names come from your token files._

1. **Definition token:** `color.moonstone.500` is `#389fba`. It says _what_ the colour is.
2. **Usage token:** `foreground.interactive.primary` → `{color.moonstone.500}`. It says _what it is for_.
3. **Build:** Style Dictionary writes `--ds-foreground-interactive-primary: var(--ds-color-moonstone-500);`
4. **Component:** the primary button says `text-[var(--ds-foreground-interactive-primary)]` through the generated Tailwind theme, never the hex.
5. **Check:** the token auditor fails any hex value or any definition token used directly in a component, and names the usage token that should replace it.

Change the token once and everything that uses it follows. The token JSON is the one source; the CSS and the Tailwind theme are generated from it.

## The stack, tool by tool

| Tool                                        | What it is                                                                         | What it does here                                                                            | Status                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Node 22 + pnpm 10**                       | The engine and package manager                                                     | Runs everything                                                                              | built                                              |
| **TypeScript** 6.0                          | JavaScript that says which values are allowed                                      | Strict mode everywhere. Pinned below 7 because the linter does not support 7 yet             | built                                              |
| **ESLint · Prettier · Vitest · Playwright** | Lint, formatting, unit tests, browser tests                                        | `pnpm verify`                                                                                | built (no tests beyond a workspace smoke test yet) |
| **React** 19                                | Builds interfaces from components                                                  | All components and prototypes                                                                | planned                                            |
| **shadcn, Base UI edition**                 | Ready-made, restylable components. The code is copied into this repo, so we own it | The component starting point                                                                 | planned                                            |
| **Base UI** 1.8                             | Unstyled building blocks that handle keyboard, focus and screen readers            | Under every interactive component. Anything shadcn lacks is built from it, in shadcn's style | planned                                            |
| **Tailwind CSS** v4                         | Styling by utility classes                                                         | Themed only from our tokens; no hand-written theme                                           | planned                                            |
| **Style Dictionary** 5                      | Turns token JSON into code                                                         | CSS variables, the Tailwind theme, shadcn's theme variables                                  | planned                                            |
| **TanStack Table** 9                        | Table logic: sort, filter, page, select                                            | Behind the data table                                                                        | planned                                            |
| **XState** 5 + `@xstate/graph`              | State machines, and tools to walk them                                             | Flows, plus reachability checks and simulation                                               | planned                                            |
| **Storybook** 10                            | A workshop where each piece is shown on its own                                    | Your review screen                                                                           | planned                                            |
| **Claude Agent SDK** · **Managed Agents**   | Run the agents locally · run them hosted, on a schedule                            | The builder / critic roster                                                                  | planned                                            |
| **ds-contracts**                            | A contract format that can generate a Figma library                                | Optional, off by default: [see below](#the-ds-contracts-switch-optional)                     | planned                                            |

Nothing here is paid. Rejected on purpose: Astryx, Ark UI, Radix, Mantine, MCP Apps, XState 6, json-render, Terrazzo. The reasons are in [`docs/PLAN.md`](docs/PLAN.md) §2.

## The contract

One JSON file per component (and per block, pattern, flow and journey). It is what lets an agent use a piece correctly, and what lets scripts check that it did.

_Illustrative, trimmed:_

```jsonc
{
  "id": "ds.button",
  "name": "Button",
  "version": "0.1.0",
  "status": { "level": "experimental", "since": "2026-10-08" },
  "intent": {
    "purpose": "Runs an action when chosen.",
    "behaviour": ["Does nothing while disabled or loading."],
    "notFor": ["Navigation. A control that changes the URL is a link."],
  },
  "axes": {
    "hierarchy": { "values": ["primary", "secondary", "tertiary"], "default": "secondary" },
    "size": { "values": ["s", "m", "l"], "default": "m" },
  },
  "states": {
    "loading": {
      "kind": "authored",
      "control": "consumer",
      "description": "The action is running.",
    },
  },
  "anatomy": {
    "root": { "tokens": { "background-color": "{color.action.{hierarchy}.background}" } },
  },
}
```

- **`intent`** says why it exists and what it must never be used for. Unknowns are written as "not decided", never guessed.
- **`axes`** are variants, each a subset of a shared vocabulary (the prop canon), so `outline` is never `outlined`.
- **`states`** say who controls each state: the platform, the component, or the consumer.
- **`anatomy`** binds every visual property to a token _path_. A script checks that every referenced token exists.

The full field list and where each field comes from is in [`docs/PLAN.md`](docs/PLAN.md) §5. A plain-language guide to every field is planned (task T2.6).

## Two kinds of checks

|              | Structural                                                                                                                      | Experience                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asks**     | Did we build the system correctly?                                                                                              | Does the assembled experience behave correctly?                                                                                                             |
| **Examples** | A hex colour in a component. A prop value not in the vocabulary. A contract that breaks its schema. A token that does not exist | A flow state nobody can reach. An async step with no failure path. A recoverable error that loses the user's input. Flow B needs data Flow A never produces |
| **How**      | Scripts, same result every run                                                                                                  | Scripts that walk the state machines, same result every run                                                                                                 |

A separate, clearly labelled _agent judgment_ section covers questions scripts cannot answer ("does this pattern meet its objective?"). It is advisory; a human decides.

## From requirement to developer handoff

_Planned (Phases 11–13)._

1. You type a requirement.
2. An agent turns it into a **prototype spec**: screens, routes, which components, blocks and patterns each screen uses, the flow's state machine, and the data each screen needs.
3. The spec is checked against a catalog generated from the contracts. Anything outside the system is rejected with the reason.
4. A **deterministic emitter** (same spec, same code) writes a runnable React app in `prototypes/<name>/`.
5. The app must pass typecheck, lint, tests, the token auditor, and an "imports only from the design system" check.
6. A generated `HANDOFF.md` lists the screens, flows, business rules and components used, and exactly what developers must replace (data goes through one marked mock adapter per screen).

## The ds-contracts switch (optional)

[ds-contracts](https://github.com/southleft/ds-contracts-poc) is an MIT-licensed project that turns a framework-neutral contract into a Figma component library. It is **off by default** and developers never need it, because the prototype is the handoff. It serves designers who want a Figma library kept in step with the code.

Everything built is **ds-contracts-compatible from the start**, so turning it on later is one setting, not a rewrite:

```jsonc
// ds.config.json  (built, task T0.2; excerpt)
{ "dsContracts": { "enabled": false, "schema": "16.0.0", "cli": "0.4.0" } }
```

- **While off**, CI still converts every contract to ds-contracts format and validates it with ds-contracts' own validator, so compatibility cannot quietly rot.
- **When on**, it adds only the Figma steps: build a bundle, load it into Figma, write the Figma IDs back, and check code and Figma for drift.
- **What Figma receives:** structure, variants, properties, token bindings. **What it does not:** intent, anti-patterns, keyboard behaviour, flow logic. Those stay in our contracts.

The exact field and token mapping is in [`docs/PLAN.md`](docs/PLAN.md) §6.

## Run it

**What works today** (Node 22 or newer, and pnpm):

```bash
pnpm install
pnpm verify        # format check, lint, typecheck, tests
```

**The build loop.** Open Claude Code on this repo, choose Opus, and run:

```
/loop Follow docs/EXECUTION.md — run exactly one iteration of the Loop Protocol, then stop.
```

Each iteration does one task: Opus writes a brief, Sonnet or Haiku builds it, scripts check it, a different agent reviews it, then it commits and pushes. State lives in [`docs/EXECUTION.md`](docs/EXECUTION.md), so any fresh session resumes where the last stopped. Create an empty file `.ai/STOP` to pause.

**The loop stops for you at:**

1. **G-T:** put your token JSON in `packages/tokens/tokens/` and your Tailwind v4 file in `packages/tokens/reference/`.
2. **G-T2:** only if your Tailwind file and the generated theme differ. Say which is right.
3. **G-B1:** review the first five components (Button, Input, Checkbox, Dialog, Card). Nothing after them is built until you approve.

To approve a gate, say "approve gate G-…" and set `status: RUNNING` in the State block.

**Commands planned** (they do not exist yet): `pnpm doctor`, `pnpm tokens:check`, `pnpm audit:tokens`, `pnpm contracts:validate`, `pnpm contracts:export --check`, `pnpm prop-map --check`, `pnpm --filter storybook dev`.

## What's where

```
docs/
  PLAN.md             context: decisions, architecture, contract, phases     (built)
  EXECUTION.md        seed: the loop protocol, state and tasks               (built)
  ADR/                decision records, index generated                      (planned, T0.6)
package.json          scripts and exact-pinned dev dependencies              (built)
pnpm-workspace.yaml   packages/*  apps/*  prototypes/*                       (built)
scripts/              checks and tooling, TypeScript only                    (workspace test only)
ds.config.json        system identity and the ds-contracts switch            (built, T0.2)
CLAUDE.md             the rules every agent reads first                      (planned, T0.5)
.claude/              subagents (builder, auditor, critic), hooks            (planned, T0.5)
packages/tokens/      token JSON -> Style Dictionary -> CSS + Tailwind theme (planned, Phase 1)
packages/ui/          components (shadcn Base UI edition, owned code)        (planned, Phase 3)
packages/blocks/      pattern blocks                                         (planned, Phase 5)
contracts/            schemas, prop vocabulary, one contract per item        (planned, Phase 2)
experience/           business rules that flow guards refer to               (planned, Phase 7)
apps/storybook/       your review screen                                     (planned, T1.5)
prototypes/           GENERATED handoff apps, one per requirement            (planned, Phase 12)
.ai/                  GENERATED maps, graph, reports. Never edit by hand     (planned)
```

## Rules every task follows

- **Never hand-edit a generated file.** CI checks that regenerating produces identical bytes.
- **Output is deterministic.** Sorted reads, fixed comparisons, nothing machine-specific.
- **A gap is a finding, not a blank to fill.** "Not decided" is written as such.
- **Never invent** a part, state, accessibility claim or token to fill a field.
- **A new check starts as a report** and becomes a gate once the baseline is clean.
- **Every rule written in `CLAUDE.md` is enforced by a script in CI.**
- **Never skip, disable or weaken a test to get green.**

## Roadmap

- [x] Plan and execution seed written ([`docs/PLAN.md`](docs/PLAN.md), [`docs/EXECUTION.md`](docs/EXECUTION.md))
- [x] T0.1: workspace, strict TypeScript, lint, format, tests
- [ ] Phase 0: system identity, `doctor`, CI, agent setup, decision records
- [ ] Phase 1: tokens, Style Dictionary build, token auditor, Storybook
- [ ] Phase 2: contract schemas, prop vocabulary, ds-contracts compatibility gate
- [ ] Phase 3: the first five components, then **stop for your review**
- [ ] Phases 4–10: indexer, pattern blocks, patterns, flows, journey, knowledge graph, experience validation
- [ ] Phases 11–13: prototype spec, code emitter, developer handoff
- [ ] Phases 14–16: rules and skills, local agents, scheduled autonomous agents
- [ ] Phase 17: Figma (optional)
- [ ] Phase 18: proof tests, including a flow that passes every structural check and still fails the experience checks

## Words you will hear

| Word                         | Means                                                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Contract**                 | A JSON file saying what a piece is for, what it must never be used for, and how it behaves                                         |
| **Token**                    | A named design decision (a colour, a space) shared by everything                                                                   |
| **Definition / usage token** | _What_ a value is (a colour from a ramp) / _what it is for_ (the background of a primary action). Components use usage tokens only |
| **Pattern Block**            | A small composition with one job, like a form field with its validation                                                            |
| **Pattern**                  | A recurring task solved once: review and submit, confirm a risky action                                                            |
| **Flow**                     | A pattern's behaviour over time: states, events, transitions, failures and recovery                                                |
| **Journey**                  | Several flows across sessions: start, leave, return, finish                                                                        |
| **State machine**            | A list of states and the allowed moves between them. Scripts can check it                                                          |
| **Prototype spec**           | The JSON description of a prototype, checked before any code is written                                                            |
| **Handoff**                  | The prototype's code and `HANDOFF.md`, given to developers                                                                         |
| **Gate**                     | A point where the loop stops and waits for you                                                                                     |
| **Builder / critic**         | The agent that makes a thing / a different agent that reviews it                                                                   |
| **Storybook**                | A website showing every component on its own, in every state                                                                       |
| **MCP**                      | A plug that lets an AI assistant look things up in another tool                                                                    |

## Not done / not checked

- Almost everything. The list under [Roadmap](#roadmap) is the honest status.
- The contract schema is a design on paper until Phase 2 builds and tests it.
- The ds-contracts mapping is untested. Whether ds-contracts CLI 0.4.0 can build a Figma bundle is an open question, assigned to task T2.5.
- ds-contracts is itself unfinished and its format is still changing; it is pinned and kept behind one adapter file.
- Managed Agents is in beta, is not eligible for zero data retention or HIPAA coverage, and loads repository skills without review. `.claude/` will be protected by CODEOWNERS.
- No colour-contrast or accessibility checks exist yet.

## Credits

- [ds-base-ui](https://github.com/christinevall/ds-base-ui) by Christine Vallaure (MIT): the two-tier token approach, the rules check, the "ground yourself first" protocol, and the wrap-Base-UI rule. This README follows its structure.
- [ds-contracts-poc](https://github.com/southleft/ds-contracts-poc) by Southleft (MIT): the contract structure that makes a Figma library generatable.
- [weave-ds-template](https://github.com/cris-achiardi/weave-ds-template): ideas only (intent fields, state ownership, the prop vocabulary, honesty rules, conformance cases as data). It has no licence, so nothing is copied.
- [shadcn/ui](https://ui.shadcn.com) (MIT) and [Base UI](https://base-ui.com) (MIT).
- Astryx by Meta (MIT): ideas only (a machine-readable manifest, a one-command health check, stable error codes).
