# AI Verify 2.0 Plugin — Scoping Document

**Status:** scoped 2026-04-26 · ready to build · single coding session estimate
**Owner:** Folahan
**Strategic context:** Under-leveraged move #1 from the 2026-04-26 NotebookLM strategic synthesis. Lands Decision Intel directly inside an IMDA-adjacent open regulatory framework's official codebase. Highest-leverage free regulatory credential available at pre-seed. Treat as a marketing asset disguised as an engineering task.

---

## Why this matters

Per CLAUDE.md "Regulatory Tailwinds (locked 2026-04-22)":

> AI Verify Foundation (Singapore IMDA, Apache 2.0, aligned with EU + OECD) — 11 internationally-recognised AI governance principles: transparency, explainability, repeatability, safety, security, robustness, fairness, data governance, accountability, human agency & oversight, inclusive growth. Every DPR field maps onto these principles. Canonical mapping page at /regulatory/ai-verify.

A merged plugin in the official `aiverify-foundation/aiverify` stock-plugins directory means:

1. Decision Intel's name is structurally referenced inside the official AI Verify 2.0 codebase
2. Every CISO / GC running AI Verify discovers Decision Intel as a recommended process surface
3. The "aligned with AI Verify" claim becomes "ships AI Verify-published process checklist"
4. Pan-African regulators evaluating IMDA-adjacent frameworks see Decision Intel as a contributor, not a downstream consumer
5. Contributing to an Apache 2.0 framework is a positive-sum move — no IP cost, all credibility upside

Procurement teams reading "ships an official AI Verify Foundation plugin" treat that as third-party validation in a way that "aligned with AI Verify" never quite achieves.

---

## Plugin shape — Process Checklist (path of least resistance)

AI Verify has two plugin categories: technical-test plugins (run algorithmic tests on ML models — Fairness Metrics Toolbox, SHAP, Robustness Toolbox, Partial Dependence Plot, etc.) and process-checklist plugins (structured documentation evidence — `aiverify.stock.process-checklist`). The right Decision Intel plugin is a **process checklist**, not a technical test, because:

- DI doesn't test model fairness / robustness — it audits decision documents
- The 20-bias taxonomy + 17-framework regulatory map IS a process checklist
- Process checklist plugins are markdown / YAML heavy, not Python ML heavy
- Single coding session is realistic for a checklist plugin; weeks for a test plugin

### Plugin name

`aiverify.contrib.decision-quality-audit-checklist`

(stock-plugins use the `aiverify.stock.*` namespace; third-party contributions live under `aiverify.contrib.*` per AI Verify community convention.)

### What the plugin contains

A structured checklist that maps each of AI Verify's 11 governance principles onto the corresponding Decision Intel audit surface, so a procurement reviewer running AI Verify can tick off "decision-quality auditing — covered" with reference to the DI artefact:

| AI Verify Principle | DI Audit Surface | DPR Field |
|---|---|---|
| Transparency | 12-node pipeline manifest published at /how-it-works | meta.pipelineNodes |
| Explainability | Per-flag bias citations + DI-B-001..020 taxonomy IDs | biases[].taxonomyId |
| Repeatability | Input hash + prompt fingerprint per audit | provenance.inputHash + .promptFingerprint |
| Safety | Pre-mortem + Red Team adversarial nodes | preMortemFindings + redTeamObjection |
| Security | AES-256-GCM encryption + hashed DPR | (security posture, not per-audit) |
| Robustness | 3-judge noise measurement (Kahneman variance) | noiseScore |
| Fairness | 20-bias detection across the taxonomy | biases[] |
| Data Governance | GDPR/NDPR anonymiser node + 17-framework regulatory map | regulatoryMapping[] |
| Accountability | Human-decision record + outcome reporting | humanDecision + outcome |
| Human Agency & Oversight | EU AI Act Article 14 alignment per node | regulatoryProvision="EU AI Act Art 14" |
| Inclusive Growth | African-framework coverage (NDPR, CBN, WAEMU, PoPIA, CMA Kenya, more) | regulatoryMapping[] regional bands |

Each row = one checklist item with description, evidence type required, and the AI Verify principle reference number.

---

## Technical requirements (verified 2026-04-26)

- **Repo:** [aiverify-foundation/aiverify](https://github.com/aiverify-foundation/aiverify)
- **Stock plugins directory:** [stock-plugins/](https://github.com/aiverify-foundation/aiverify/tree/main/stock-plugins) — model the new plugin structure on `aiverify.stock.process-checklist`
- **Toolkit version:** AI Verify Toolkit v2.x compatible
- **Test engine:** `aiverify-test-engine==2.0.0a1`
- **Template:** `aiverify-algorithm-template` (cookiecutter) — though for process-checklist plugins the template may not apply directly; mirror an existing checklist plugin instead
- **License:** Apache 2.0 (every contributed plugin auto-licensed under this; check the company is OK with this — should be fine, the underlying DI product remains proprietary, only the checklist artefact is contributed)
- **Languages:** Repo is JavaScript / TypeScript / Python — process checklist plugins are primarily YAML + markdown
- **Developer tools:** [aiverify-foundation/aiverify-developer-tools](https://github.com/aiverify-foundation/aiverify-developer-tools) — read the README before starting
- **Contribution process:** standard GitHub fork → branch → PR → review (no signed CLA last checked, but verify when forking)

---

## Build sequence — single coding session (~3 hours)

1. Fork `aiverify-foundation/aiverify` to your GitHub account
2. Clone locally; navigate to `stock-plugins/aiverify.stock.process-checklist/` and read its directory structure end-to-end
3. Copy the directory pattern to `stock-plugins/aiverify.contrib.decision-quality-audit-checklist/`
4. Build the YAML manifest: 11 checklist items (one per AI Verify principle), each citing the corresponding DI audit surface from the table above
5. Build the markdown documentation file describing the plugin's purpose, what it tests for, and how a procurement reviewer should interpret the results
6. Add a `README.md` in the plugin directory pointing back to decision-intel.com + linking to /regulatory/ai-verify (which already exists per CLAUDE.md)
7. Run any local tests AI Verify ships in the stock-plugins README
8. Commit, push to your fork, open PR against `aiverify-foundation/aiverify:main`
9. PR description: "Process checklist plugin for decision-quality auditing — maps the 11 AI Verify governance principles to a structured documentation surface for organisations using AI-assisted strategic-decision tooling. Apache 2.0."

The PR review may take days to weeks depending on AI Verify Foundation's bandwidth. While waiting, the marketing claim shifts from "aligned with AI Verify" to "actively contributing to AI Verify 2.0 stock plugins" (which is true the moment the PR is open, not when it's merged).

---

## Risks + how to mitigate

| Risk | Mitigation |
|---|---|
| AI Verify Foundation rejects the plugin | The plugin is Apache 2.0, doesn't expose any DI proprietary IP, and adds documented value to the existing process-checklist surface. Rejection unlikely; if it happens, the PR itself remains a public artefact citable in marketing |
| AI Verify principles change before merge | The 11-principle framework is internationally codified (aligned with EU + OECD); changes are unlikely on a 6-month horizon, and the plugin checklist would just need a minor refresh |
| Open-sourcing the regulatory mapping reveals competitive IP | The MAPPING is not the IP — every regulatory framework is publicly published. The IP is the audit pipeline + scoring model + per-org calibration. This plugin contributes the boring procurement-checklist artefact, not the proprietary product surface |
| Apache 2.0 license obligation | Apache 2.0 only attaches to the plugin code, not to Decision Intel itself. Standard for any open-source contribution; legally clean |

---

## What this unlocks once merged

- Marketing copy on `/regulatory/ai-verify`: change "aligned with the 11 internationally-recognised AI governance principles codified by AI Verify" → "contributes the official `aiverify.contrib.decision-quality-audit-checklist` plugin to the AI Verify 2.0 stock plugins directory, alongside the 11-principle mapping" (per CLAUDE.md vocabulary discipline — never claim "fully compliant" or "certified by")
- Pitch deck addition: a single slide showing the plugin merged into the AI Verify codebase, with the principle mapping as evidence
- Pan-African investor conversation lead: "we contribute the open-source process-checklist plugin to the IMDA-adjacent regulatory framework that ASEAN, the AU's Smart Africa initiative, and African data-protection regulators reference"
- Procurement-cycle accelerator: every Fortune 500 buyer running an AI Verify self-assessment discovers Decision Intel as a recommended process surface

---

## First action this week

Fork the repo, read [stock-plugins/aiverify.stock.process-checklist/](https://github.com/aiverify-foundation/aiverify/tree/main/stock-plugins/aiverify.stock.process-checklist) end-to-end, decide whether the YAML/markdown shape matches the proposal above, and either schedule the 3-hour build or escalate any architectural surprises before scheduling.
