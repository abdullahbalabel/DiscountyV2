# Discounty Document-Driven Development Kit

## Installation & Usage Guide

---

## Table of Contents

1. [What Is This Kit](#what-is-this-kit)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
   - [Option A: Copy Into Existing Project](#option-a-copy-into-existing-project)
   - [Option B: Start a New Project](#option-b-start-a-new-project)
   - [Option C: Install Globally](#option-c-install-globally)
4. [Verify Installation](#verify-installation)
5. [Quick Start](#quick-start)
6. [The Boss Agent](#the-boss-agent)
7. [Skills Reference](#skills-reference)
8. [Document Templates Reference](#document-templates-reference)
9. [Workflows](#workflows)
   - [Workflow 1: New Feature From Scratch](#workflow-1-new-feature-from-scratch)
   - [Workflow 2: Refine Existing Documents](#workflow-2-refine-existing-documents)
   - [Workflow 3: Implement a Planned Feature](#workflow-3-implement-a-planned-feature)
   - [Workflow 4: Single Task Execution](#workflow-4-single-task-execution)
   - [Workflow 5: Compliance Audit](#workflow-5-compliance-audit)
10. [Use Cases With Examples](#use-cases-with-examples)
    - [Case 1: Building a Discount Code Feature](#case-1-building-a-discount-code-feature)
    - [Case 2: Adding Payment Integration](#case-2-adding-payment-integration)
    - [Case 3: Refactoring an Existing Feature](#case-3-refactoring-an-existing-feature)
    - [Case 4: Onboarding a New Developer](#case-4-onboarding-a-new-developer)
    - [Case 5: Auditing Before Release](#case-5-auditing-before-release)
11. [Document Hierarchy](#document-hierarchy)
12. [Tips and Best Practices](#tips-and-best-practices)
13. [Troubleshooting](#troubleshooting)
14. [File Structure Reference](#file-structure-reference)

---

## What Is This Kit

A **document-driven development system** for OpenCode CLI. It provides:

- **1 primary agent** (`boss`) -- orchestrates everything, enforces quality, saves tokens
- **12 skills** -- automated workflows for creating, refining, validating, and executing feature documents
- **6 document templates** -- Constitution, Specification, Plan, Tasks, Prompts, Skills

The idea: every feature starts as structured documents (rules, requirements, plan, tasks). The agent and skills help you create those documents, validate them against each other, and then implement the code -- all guided by the documents so nothing is guessed or hallucinated.

```
Idea → Constitution → Specification → Plan → Tasks → Code → Deployment
         (rules)      (what to build)  (how)  (work)  (implement)
```

---

## Prerequisites

- **OpenCode CLI** installed and configured ([opencode.ai/docs](https://opencode.ai/docs))
- **An LLM provider** configured (API key set up via `/connect` in OpenCode)
- **A project directory** where you want to use this kit

Verify OpenCode is installed:

```bash
opencode --version
```

---

## Installation

### Option A: Copy Into Existing Project

Copy the two directories into your project root:

```
your-project/
├── .opencode/          ← copy this
│   ├── agents/
│   │   └── boss.md
│   └── skills/
│       ├── bootstrap-feature/SKILL.md
│       ├── clarify-docs/SKILL.md
│       ├── create-constitution/SKILL.md
│       ├── create-plan/SKILL.md
│       ├── create-prompt/SKILL.md
│       ├── create-specification/SKILL.md
│       ├── create-tasks/SKILL.md
│       ├── execute-plan/SKILL.md
│       ├── execute-prompt/SKILL.md
│       ├── execute-task/SKILL.md
│       ├── implement-feature/SKILL.md
│       └── validate-compliance/SKILL.md
└── Docs/               ← copy this
    ├── Agent/
    ├── Constitutions/
    │   └── Constitution-Template.md
    ├── Plans/
    │   └── Plan-Template.md
    ├── Prompts/
    │   └── Prompt-Template.md
    ├── Skills/
    │   └── Skill-Template.md
    ├── Specifications/
    │   └── Specification-Template.md
    └── Tasks/
        └── Task-Template.md
```

**On Windows (PowerShell):**

```powershell
# From the kit directory, copy to your project
Copy-Item -Recurse ".opencode" "C:\path\to\your-project\.opencode"
Copy-Item -Recurse "Docs" "C:\path\to\your-project\Docs"
```

**On macOS/Linux:**

```bash
# From the kit directory, copy to your project
cp -r .opencode /path/to/your-project/.opencode
cp -r Docs /path/to/your-project/Docs
```

### Option B: Start a New Project

```bash
mkdir my-project
cd my-project
git init

# Copy the kit directories here (same as Option A)
# Then initialize OpenCode
opencode
/init
```

### Option C: Install Globally

To make the skills available across ALL projects, copy the skills to the global config:

```bash
# macOS/Linux
cp -r .opencode/skills/* ~/.config/opencode/skills/
cp -r .opencode/agents/* ~/.config/opencode/agents/

# Windows (PowerShell)
Copy-Item -Recurse ".opencode\skills\*" "$env:USERPROFILE\.config\opencode\skills\"
Copy-Item -Recurse ".opencode\agents\*" "$env:USERPROFILE\.config\opencode\agents\"
```

> **Note:** Global install makes skills available everywhere, but the `Docs/` templates are still per-project. Copy the `Docs/` folder into each project that needs it.

---

## Verify Installation

1. Open your project in OpenCode:

```bash
cd your-project
opencode
```

2. Press **Tab** to cycle through agents. You should see **boss** as an available primary agent.

3. Type a message to test skill discovery:

```
What skills are available?
```

The agent should list all 12 skills. If it doesn't, check [Troubleshooting](#troubleshooting).

---

## Quick Start

The fastest way to use this kit:

```
1. Open your project in OpenCode
2. Switch to the Boss agent (Tab key)
3. Type: "bootstrap feature Feature-001 - User Authentication"
4. Follow the guided Q&A for each document
5. When done, type: "implement feature Feature-001"
```

That's it. Boss handles the rest -- creates all documents, asks you the right questions, validates compliance, and guides the implementation.

---

## The Boss Agent

Boss is the primary agent you interact with. Switch to it with **Tab**.

### What Makes It Different

| Trait | How It Works |
|-------|-------------|
| **Token-efficient** | Terse communication. Drops filler words. Fragments OK. Never repeats what you said. Batches tool calls in parallel. |
| **Zero-hallucination** | Never invents file paths, APIs, or requirements. Always reads before writing. Quotes sources with `file:line`. Says "I don't know" instead of guessing. |
| **Architecture-aware** | Reads existing code patterns before writing. Enforces type safety, error handling, auth checks. Stops and reports violations. |
| **Skill orchestrator** | Automatically picks the right skill based on your request. Verifies prerequisites before loading. Verifies outputs after completion. |

### How to Talk to Boss

Boss responds best to direct, specific requests:

```
✅ Good:
"bootstrap feature Feature-002 - Discount Codes"
"clarify the specification for Feature-001"
"implement Feature-003"
"validate compliance for Feature-001"
"execute task Feature-001-T03"

❌ Less effective:
"help me with the project"
"can you do something with discounts"
"make it work"
```

### When Boss Uses Full English

Boss automatically switches to clear, complete English for:
- Destructive operations (delete, overwrite)
- Security warnings
- Complex multi-step instructions where fragments could be misread
- When you ask "explain" or "why"

---

## Skills Reference

### Creation Skills

| Skill | Trigger Phrases | What It Creates | Prerequisites |
|-------|----------------|-----------------|---------------|
| `bootstrap-feature` | "bootstrap feature", "new feature", "set up feature" | All documents for a feature in order | None |
| `create-constitution` | "create constitution", "define rules for [feature]" | `Docs/Constitutions/Constitution-{ID}.md` | Feature ID confirmed |
| `create-specification` | "create spec", "define requirements" | `Docs/Specifications/Specification-{ID}.md` | Constitution exists |
| `create-plan` | "create plan", "plan implementation" | `Docs/Plans/Plan-{ID}.md` | Constitution + Spec exist |
| `create-tasks` | "create tasks", "break down the plan" | `Docs/Tasks/Task-{ID}-T*.md` + Index | Constitution + Spec + Plan exist |
| `create-prompt` | "create prompt", "write AI prompt" | `Docs/Prompts/Prompt-{ID}-{Name}.md` | Constitution + Spec recommended |

### Quality Skills

| Skill | Trigger Phrases | What It Does | Prerequisites |
|-------|----------------|-------------|---------------|
| `clarify-docs` | "clarify docs", "what's missing", "review docs", "refine" | Finds gaps/ambiguities, asks Q&A, delegates fixes | At least 1 document exists |
| `validate-compliance` | "validate", "check compliance", "audit" | Checks all docs against each other, produces report | At least Constitution exists |

### Execution Skills

| Skill | Trigger Phrases | What It Does | Prerequisites |
|-------|----------------|-------------|---------------|
| `implement-feature` | "implement", "start building", "code this" | Full coding lifecycle (scaffold → code → test → deploy) | All documents + tasks exist |
| `execute-plan` | "execute plan", "run the plan" | Orchestrates tasks in dependency order | All documents + tasks exist |
| `execute-task` | "execute task [ID]", "work on task [ID]" | Implements a single task | Task file exists |
| `execute-prompt` | "run prompt", "execute prompt" | Runs a prompt with actual inputs | Prompt file exists |

---

## Document Templates Reference

| Template | Location | Purpose |
|----------|----------|---------|
| Constitution | `Docs/Constitutions/Constitution-Template.md` | Governing rules, principles, hard constraints, boundaries |
| Specification | `Docs/Specifications/Specification-Template.md` | Requirements, data model, API endpoints, acceptance criteria |
| Plan | `Docs/Plans/Plan-Template.md` | Phases, milestones, risks, resources, success criteria |
| Task | `Docs/Tasks/Task-Template.md` | Individual work units with steps, dependencies, testing |
| Prompt | `Docs/Prompts/Prompt-Template.md` | Reusable AI prompts with variables, guardrails, examples |
| Skill | `Docs/Skills/Skill-Template.md` | Workflow definitions for new skills |

---

## Workflows

### Workflow 1: New Feature From Scratch

**When:** Starting a completely new feature.

```
You: "bootstrap feature Feature-001 - Discount Codes"
```

Boss will guide you through creating each document in order:

```
Step 1: Constitution     → asks about principles, constraints, boundaries
Step 2: Specification    → asks about requirements, data model, APIs, acceptance criteria
Step 3: Plan             → proposes phases, asks about timeline, resources, risks
Step 4: Tasks            → breaks plan into tasks, shows dependency tree
Step 5: Prompts          → asks if you need AI prompts (optional)
Step 6: Validation       → runs compliance check across all documents
```

**Time:** 15-30 minutes depending on feature complexity.

**Output:** Complete document set ready for implementation.

---

### Workflow 2: Refine Existing Documents

**When:** Documents exist but have gaps, vague language, or inconsistencies.

```
You: "clarify docs for Feature-001"
```

Boss loads `clarify-docs` and:

```
Step 1: Reads all documents for Feature-001
Step 2: Analyzes for gaps (40+ checks per document type)
Step 3: Reports: "Found 8 issues: 2 blockers, 4 gaps, 2 polish"
Step 4: Asks ONE clarifying question at a time, starting with blockers
Step 5: After all answers, modifies the affected documents
Step 6: Handles cascading changes (new requirement → new task)
Step 7: Reports what changed
```

**Example Q&A:**

```
Boss: "Specification FR-03 says 'Handle payments' -- what payment operations?
       (a) Create charges  (b) Process refunds  (c) Generate invoices  (d) All of these"
You:  "a and b"
Boss: "For refunds -- full only, or also partial?"
You:  "Full only in v1"
Boss: "Updated FR-03, added FR-04 for refunds, added business rule: 
       'Partial refunds not supported in v1'. Spec version 1.0 → 1.1."
```

---

### Workflow 3: Implement a Planned Feature

**When:** All documents exist and it's time to write code.

```
You: "implement Feature-001"
```

Boss loads `implement-feature` and runs through 5 phases:

```
Phase 0: Discovery    → reads all docs, scans codebase, detects tech stack, flags conflicts
Phase 1: Scaffolding  → creates directories, installs deps, runs migrations
Phase 2: Core         → data access → business logic → API → UI (layer by layer)
Phase 3: Testing      → integration tests, acceptance criteria verification, compliance check
Phase 4: Review       → code review checklist (security, performance, types, dead code)
Phase 5: Deployment   → pre-deploy checks, deploy, post-deploy verification
```

Each phase has a **quality gate** that must pass before proceeding.

---

### Workflow 4: Single Task Execution

**When:** You want to work on one specific task.

```
You: "execute task Feature-001-T03"
```

Boss loads `execute-task` and:

```
Step 1: Reads the task file
Step 2: Checks dependencies (are blocking tasks done?)
Step 3: Reads parent documents for context
Step 4: Updates task status to "In Progress"
Step 5: Works through subtask checklist one by one
Step 6: Runs tests
Step 7: Verifies acceptance criteria
Step 8: Updates status to "Done"
```

---

### Workflow 5: Compliance Audit

**When:** Before implementation, after changes, or before release.

```
You: "validate compliance for Feature-001"
```

Boss loads `validate-compliance` and:

```
Step 1: Finds all documents for Feature-001
Step 2: Reads the Constitution (the authority)
Step 3: Checks Specification vs Constitution
Step 4: Checks Plan vs Constitution + Specification
Step 5: Checks Tasks vs all parents
Step 6: Checks Prompts vs Constitution + Specification
Step 7: Verifies cross-reference links
Step 8: Produces a report: X passed, Y failed, Z warnings
```

**Example output:**

```
Compliance Report: Feature-001

Summary: 24 checks, 22 passed, 1 failed, 1 warning

FAIL: Task T04 references FR-09 but Specification only goes to FR-07
  → Fix: Update task parent reference to correct FR ID

WARN: Plan Phase 3 has no target date
  → Suggestion: Add target date or mark as "flexible"
```

---

## Use Cases With Examples

### Case 1: Building a Discount Code Feature

**Scenario:** You're building a discount code system for an e-commerce platform.

```
You: "bootstrap feature Feature-001 - Discount Codes"
```

**Constitution Q&A:**

```
Boss: "What principles govern this feature?"
You:  "Users must never get double-discounted. All discount operations must be logged. 
       Expired codes must fail gracefully."

Boss: "Hard constraints?"
You:  "Max discount 50%. Codes must be unique. Max 1 code per transaction."

Boss: "Out of scope?"
You:  "Loyalty programs, referral codes, bulk discount pricing."
```

**Specification Q&A:**

```
Boss: "Functional requirements?"
You:  "Create codes (Must Have), apply at checkout (Must Have), 
       view usage analytics (Should Have), schedule activation dates (Could Have)"

Boss: "Data model?"
You:  "DiscountCode entity: id, code (unique string), type (percentage/flat), 
       value, max_uses, current_uses, expires_at, created_by, created_at"

Boss: "API endpoints?"
You:  "CRUD for codes, plus POST /api/v1/discount/apply for checkout"
```

**Result:** 5 documents created, 8 tasks generated, compliance validated.

```
You: "implement Feature-001"
```

Boss scaffolds the database, implements the service layer, wires the API, writes tests -- all guided by the documents.

---

### Case 2: Adding Payment Integration

**Scenario:** Existing project needs Stripe payment processing.

```
You: "bootstrap feature Feature-002 - Stripe Payments"
```

**Key Constitution decisions:**

```
Boss: "Hard constraints?"
You:  "No credit card data stored locally (PCI compliance). 
       All amounts in minor units (cents). Must use Stripe Checkout, not custom forms."
```

**Key Specification decisions:**

```
Boss: "API endpoints?"
You:  "POST /api/v1/checkout/session (create checkout), 
       POST /api/v1/webhooks/stripe (handle events),
       GET /api/v1/payments (list user payments)"

Boss: "Business rules?"
You:  "Minimum charge $1. Refunds within 30 days only. 
       Webhook signature must be verified on every event."
```

**After documents are created:**

```
You: "clarify docs for Feature-002"
```

Boss finds:
- "Specification doesn't define what happens if webhook signature fails"
- "No acceptance criterion for refund flow"
- "Plan has no phase for Stripe webhook testing"

Fixes all three through Q&A, then:

```
You: "implement Feature-002"
```

---

### Case 3: Refactoring an Existing Feature

**Scenario:** The auth module needs refactoring. Create documents for the existing feature first.

```
You: "create constitution for Feature-003 - Authentication Refactor"
```

```
Boss: "Principles?"
You:  "Zero downtime during migration. Backward compatibility with existing sessions. 
       No user-facing changes."

Boss: "Constraints?"
You:  "Must keep existing API signatures. Session tokens valid for 7 days. 
       Must support both old and new auth during transition."
```

Then create the specification describing the target state, plan the migration phases, and execute:

```
You: "create specification for Feature-003"
You: "create plan for Feature-003"
You: "create tasks for Feature-003"
You: "implement Feature-003"
```

---

### Case 4: Onboarding a New Developer

**Scenario:** New team member needs to understand a feature.

The documents serve as living documentation:

```
New Dev: "What are the rules for the Discount Codes feature?"
Boss:    Reads Docs/Constitutions/Constitution-Feature-001.md
         → lists principles, constraints, boundaries

New Dev: "What exactly needs to be built?"
Boss:    Reads Docs/Specifications/Specification-Feature-001.md
         → lists requirements, data model, API, acceptance criteria

New Dev: "What's the plan and where are we?"
Boss:    Reads Docs/Plans/Plan-Feature-001.md
         → shows phases, current status, risks

New Dev: "What tasks can I pick up?"
Boss:    Reads Docs/Tasks/Task-Index-Feature-001.md
         → shows tasks with status "Backlog", suggests unblocked ones
```

---

### Case 5: Auditing Before Release

**Scenario:** Feature is implemented, need to verify everything is complete.

```
You: "validate compliance for Feature-001"
```

Boss produces a full report checking:
- All Must Have requirements have been implemented
- All acceptance criteria pass
- No Constitution constraints are violated
- All tasks are marked Done
- All cross-references are valid

```
You: "are all tasks done for Feature-001?"
```

Boss reads the Task Index and reports:

```
Feature-001 Tasks: 8 total
Done: 7
In Progress: 1 (Feature-001-T06: Write integration tests)
Blocked: 0
```

---

## Document Hierarchy

Understanding how documents relate is key to using this kit effectively:

```
┌─────────────────────────────────────────────────────────────┐
│                     CONSTITUTION                            │
│              (the law -- everything must comply)             │
│                                                             │
│  Guiding Principles    Hard Constraints    Boundaries       │
└──────────────────────────┬──────────────────────────────────┘
                           │ governs
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SPECIFICATION                            │
│            (what to build -- single source of truth)        │
│                                                             │
│  Requirements    Data Model    API    Business Rules        │
└──────────────────────────┬──────────────────────────────────┘
                           │ informs
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        PLAN                                 │
│              (how and when to build it)                      │
│                                                             │
│  Phases    Milestones    Risks    Resources                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ decomposes into
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       TASKS                                 │
│                 (individual work units)                      │
│                                                             │
│  Steps    Acceptance Criteria    Dependencies    Testing    │
└──────────────────────────┬──────────────────────────────────┘
                           │ may use
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      PROMPTS                                │
│                (reusable AI prompts)                         │
│                                                             │
│  Context    Variables    Guardrails    Examples              │
└─────────────────────────────────────────────────────────────┘
```

**Key rule:** Each document must comply with all documents above it.

---

## Tips and Best Practices

### Do

- **Start with `bootstrap-feature`** for new features -- it creates everything in the right order
- **Run `clarify-docs` after bootstrapping** -- first drafts always have gaps
- **Run `validate-compliance` before implementing** -- catch issues before they become code bugs
- **Use specific feature IDs** -- `Feature-001`, `Feature-002`, etc. Keep them consistent
- **Keep constitutions tight** -- 3-5 principles, 3-5 constraints. Not a novel.
- **Write testable acceptance criteria** -- "Given X, when Y, then Z" format
- **Commit documents to git** -- they are part of the codebase

### Don't

- **Don't skip the Constitution** -- it prevents scope creep and bad decisions downstream
- **Don't write vague requirements** -- "Handle payments" means nothing. Be specific.
- **Don't modify templates** -- the templates in `Docs/*/Template.md` are references. Create new files for actual features.
- **Don't implement without tasks** -- tasks make progress trackable and prevent missed requirements
- **Don't ignore compliance failures** -- a FAIL means something is wrong. Fix it before proceeding.
- **Don't fight Boss** -- if it stops and flags an issue, the issue is real. Don't force it to continue.

### Token Savings Tips

- Boss already communicates tersely. If you want even more savings, say "caveman mode" to activate the `caveman` skill (if installed globally).
- Use specific requests instead of vague ones -- specific = fewer clarifying rounds = fewer tokens.
- Use feature IDs in requests so Boss doesn't have to search for context.
- For large features, work one phase at a time instead of "implement everything".

---

## Troubleshooting

### Boss agent not appearing

**Symptom:** Tab cycling doesn't show Boss.

**Fix:**
1. Verify file exists at `.opencode/agents/boss.md`
2. Verify the file starts with valid YAML frontmatter (`---`)
3. Check `description` field is present in frontmatter
4. Restart OpenCode

### Skills not loading

**Symptom:** Agent says no skills available, or can't find a specific skill.

**Fix:**
1. Verify `SKILL.md` (all caps) exists in each skill folder
2. Verify each `SKILL.md` has `name` and `description` in frontmatter
3. Verify folder name matches the `name` field exactly (lowercase, hyphen-separated)
4. Check permissions in `opencode.json` -- skills might be set to `deny`

```
# Quick check -- should list 12 SKILL.md files
find .opencode/skills -name "SKILL.md" | wc -l

# Windows PowerShell equivalent
(Get-ChildItem -Recurse ".opencode\skills" -Filter "SKILL.md").Count
```

### Documents not found by skills

**Symptom:** Skill says "Constitution not found" but the file exists.

**Fix:**
1. Check filename matches expected pattern: `Constitution-Feature-001.md` not `constitution-feature-001.md`
2. Check the file is in the correct folder: `Docs/Constitutions/`, not `Docs/`
3. Check Feature ID is consistent across all documents

### Compliance validation finds too many issues

**Symptom:** Validation reports many failures on a freshly bootstrapped feature.

**Fix:** This is normal for first drafts. Run `clarify-docs` to fix them through guided Q&A. The typical flow is:

```
bootstrap-feature → clarify-docs → validate-compliance → implement-feature
```

---

## File Structure Reference

```
your-project/
│
├── .opencode/
│   ├── agents/
│   │   └── boss.md                              # Primary agent (the boss)
│   │
│   └── skills/
│       ├── bootstrap-feature/SKILL.md            # Create all docs for a feature
│       ├── clarify-docs/SKILL.md                 # Q&A to refine documents
│       ├── create-constitution/SKILL.md          # Create governing rules
│       ├── create-specification/SKILL.md         # Create requirements
│       ├── create-plan/SKILL.md                  # Create implementation plan
│       ├── create-tasks/SKILL.md                 # Create work units
│       ├── create-prompt/SKILL.md                # Create AI prompts
│       ├── execute-plan/SKILL.md                 # Orchestrate task execution
│       ├── execute-task/SKILL.md                 # Execute single task
│       ├── execute-prompt/SKILL.md               # Run a prompt
│       ├── implement-feature/SKILL.md            # Full coding lifecycle
│       └── validate-compliance/SKILL.md          # Audit document compliance
│
├── Docs/
│   ├── Agent/                                    # (reserved for future use)
│   ├── Constitutions/
│   │   └── Constitution-Template.md              # Template (do not modify)
│   ├── Plans/
│   │   └── Plan-Template.md                      # Template (do not modify)
│   ├── Prompts/
│   │   └── Prompt-Template.md                    # Template (do not modify)
│   ├── Skills/
│   │   └── Skill-Template.md                     # Template (do not modify)
│   ├── Specifications/
│   │   └── Specification-Template.md             # Template (do not modify)
│   └── Tasks/
│       └── Task-Template.md                      # Template (do not modify)
│
└── GUIDE.md                                      # This file
```

**After creating documents for Feature-001, the Docs folder would look like:**

```
Docs/
├── Constitutions/
│   ├── Constitution-Template.md
│   └── Constitution-Feature-001.md               # ← created by skill
├── Plans/
│   ├── Plan-Template.md
│   └── Plan-Feature-001.md                       # ← created by skill
├── Prompts/
│   ├── Prompt-Template.md
│   └── Prompt-Feature-001-GenerateCode.md        # ← created by skill (optional)
├── Specifications/
│   ├── Specification-Template.md
│   └── Specification-Feature-001.md              # ← created by skill
└── Tasks/
    ├── Task-Template.md
    ├── Task-Index-Feature-001.md                  # ← created by skill
    ├── Task-Feature-001-T01.md                    # ← created by skill
    ├── Task-Feature-001-T02.md                    # ← created by skill
    ├── Task-Feature-001-T03.md                    # ← created by skill
    └── ...
```
