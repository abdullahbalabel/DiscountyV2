---
name: validate-compliance
description: Validate that feature documents comply with each other. Checks Specifications against Constitutions, Plans against both, Tasks against all parents, and Prompts against guardrails. Produces a compliance report with pass/fail per check and actionable remediation steps. Trigger with "validate compliance", "check compliance", or "audit [feature] documents".
---

## What I Do

Validate that all documents in a feature's document set comply with each other. The Constitution is the authority -- everything must align with it. I produce a compliance report with pass/fail results and actionable remediation steps for any violations.

## When To Use Me

- After creating or updating any feature document
- Before executing a plan (pre-flight check)
- The user says "validate compliance", "check compliance", "audit documents"
- As part of the `execute-plan` skill's final verification

## Document Hierarchy (Compliance Direction)

```
Constitution (the law)
    ↓ governs
Specification (must comply with Constitution)
    ↓ informs
Plan (must comply with Constitution, must deliver Specification)
    ↓ decomposes into
Tasks (must comply with Constitution, must implement Specification requirements, must belong to Plan phases)
    ↓ may use
Prompts (must respect Constitution guardrails, must align with Specification business rules)
```

## Inputs Required

1. **Feature ID** -- required
2. **Scope** -- optional: "full" (all documents) or specific document type to validate

## Workflow

### Step 1: Discover Documents

Look for all feature documents:
- `Docs/Constitutions/Constitution-{Feature-ID}.md`
- `Docs/Specifications/Specification-{Feature-ID}.md`
- `Docs/Plans/Plan-{Feature-ID}.md`
- `Docs/Tasks/Task-{Feature-ID}-T*.md`
- `Docs/Tasks/Task-Index-{Feature-ID}.md`
- `Docs/Prompts/Prompt-{Feature-ID}-*.md`

Report which documents exist and which are missing.

### Step 2: Read the Constitution

Read the Constitution and extract the validation criteria:
- Guiding Principles (GP-1, GP-2, etc.)
- Hard Constraints (HC-01, HC-02, etc.)
- Boundaries / Out of Scope
- Dependencies & Assumptions
- Compliance Standards

This is the reference against which everything is checked.

### Step 3: Validate Specification vs Constitution

For the Specification, check:

| Check | What to Verify |
|-------|---------------|
| **Requirements within scope** | No functional requirement falls outside Constitution Boundaries |
| **NFRs meet constraints** | Each Non-Functional Requirement satisfies the relevant Hard Constraint |
| **Business rules align** | Each Business Rule aligns with a Guiding Principle |
| **Data model respects constraints** | Data model doesn't violate any Hard Constraint (e.g., no PII storage if forbidden) |
| **Compliance standards met** | Specification addresses all Constitution Compliance Standards |

### Step 4: Validate Plan vs Constitution + Specification

For the Plan, check:

| Check | What to Verify |
|-------|---------------|
| **Full coverage** | Every Must Have requirement is assigned to at least one phase |
| **Dependency order** | Phase order respects Constitution Dependencies |
| **Success criteria linked** | Plan Success Criteria map to Specification Acceptance Criteria |
| **Risks address constraints** | High-impact Constitution Constraints have corresponding risks |

### Step 5: Validate Tasks vs All Parents

For each Task, check:

| Check | What to Verify |
|-------|---------------|
| **Traceability** | Every task links to a Specification requirement (FR-XX) |
| **Phase assignment** | Every task belongs to a Plan phase |
| **Acceptance criteria** | Task acceptance criteria derive from Specification acceptance criteria |
| **Dependency consistency** | No circular dependencies; blocked-by tasks exist |
| **Coverage completeness** | Every Must Have requirement has at least one task |

### Step 6: Validate Prompts vs Constitution + Specification

For each Prompt, check:

| Check | What to Verify |
|-------|---------------|
| **Guardrails present** | Prompt guardrails exist for each relevant Constitution Hard Constraint |
| **Business rules respected** | Prompt body doesn't contradict Specification Business Rules |
| **Context accuracy** | Prompt context aligns with current Specification details |

### Step 7: Cross-Reference Links

Verify all Related Documents tables:
- Links point to existing files (not broken)
- Links point to the correct feature's files (not template files)
- Section anchors are valid

### Step 8: Generate Compliance Report

Produce a report with:

```
# Compliance Report: {Feature-ID} - {Feature Name}
Date: {today}

## Summary
- Total checks: X
- Passed: Y
- Failed: Z
- Warnings: W

## Results by Document

### Specification
| Check | Status | Details |
|-------|--------|---------|
| Requirements in scope | PASS/FAIL | ... |
| ... | ... | ... |

### Plan
...

### Tasks
...

### Prompts
...

## Violations (Action Required)
1. [FAIL] {document}: {check} -- {what's wrong} → {how to fix}
2. ...

## Warnings
1. [WARN] {document}: {check} -- {concern} → {suggestion}
2. ...
```

### Step 9: Present and Advise

Present the report to the user. For each violation:
- Explain what's wrong
- Reference the specific constraint/requirement IDs
- Suggest a concrete fix

## Validation Checklist

- [ ] All existing documents were read and checked
- [ ] Missing documents are flagged
- [ ] Every check has a clear PASS/FAIL/WARN status
- [ ] Every failure has a concrete remediation step
- [ ] Cross-reference links are validated
- [ ] Report is presented to the user

## Error Handling

| Situation | Action |
|-----------|--------|
| Constitution missing | Cannot validate. This is a critical error -- everything depends on it |
| Only Constitution exists | Report that other documents are missing; no compliance checks possible |
| Document has unpopulated sections | Flag as WARNING; suggest completing the section |
| Ambiguous compliance | Flag as WARNING with explanation; ask user to clarify |
