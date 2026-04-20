---
name: create-specification
description: Create a new Specification document for a feature. Reads the governing Constitution, gathers functional/non-functional requirements, data models, API endpoints, UI/UX needs, business rules, and acceptance criteria. Validates everything against the Constitution before saving. Trigger with "create a specification", "new spec", or "define requirements for [feature]".
---

## What I Do

Create a **Specification** document -- the single source of truth for what gets built. It defines functional requirements, non-functional requirements, data models, API endpoints, UI/UX, business rules, and acceptance criteria. All content must comply with the feature's Constitution.

## When To Use Me

- A Constitution exists and the next step is defining what to build
- The user says "create a specification", "new spec", "define what to build"
- The `bootstrap-feature` skill delegates specification creation here

## Prerequisites

The feature's **Constitution** must exist first. If it does not, suggest the `create-constitution` skill.

## Inputs Required

1. **Feature ID** (e.g., `Feature-001`) -- required
2. **Feature Name** -- required
3. **Path to the Constitution** -- `Docs/Constitutions/Constitution-{Feature-ID}.md`

## Workflow

### Step 1: Read the Constitution

Read `Docs/Constitutions/Constitution-{Feature-ID}.md` and extract:
- Guiding Principles (business rules must align with these)
- Hard Constraints (non-functional requirements must satisfy these)
- Boundaries (requirements must stay within scope)
- Dependencies & Assumptions (inform the data model and API design)

If the Constitution does not exist, **stop** and tell the user to create it first.

### Step 2: Read the Template

Read `Docs/Specifications/Specification-Template.md` for the exact structure.

### Step 3: Gather Requirements

Ask the user section by section. Reference Constitution constraints as you go.

**Overview** -- Ask:
> "Briefly: what does this feature do, who does it serve, and what problem does it solve?"

**Functional Requirements** -- Ask:
> "List the functional requirements. For each, I need: a description and priority (Must Have / Should Have / Could Have / Won't Have)."

Assign IDs: FR-01, FR-02, etc. Require at least 1 "Must Have".

**Non-Functional Requirements** -- Ask:
> "What are the performance, availability, and compatibility targets?"

Cross-check each against Constitution Hard Constraints. Assign IDs: NFR-01, NFR-02, etc.

**Data Model** -- Ask:
> "What entities/tables are needed? For each entity, what fields, types, and relationships?"

Format using the tree notation from the template.

**API Endpoints** -- Ask:
> "What API endpoints are needed? For each: HTTP method, path, description, auth required?"

Format as a table.

**UI / UX Requirements** -- Ask:
> "What screens or pages are involved? What is the user flow? Any wireframes or mockups?"

**Business Rules** -- Ask:
> "What business rules apply? (e.g., limits, permissions, validation rules)"

Cross-check each rule against Constitution Guiding Principles. Flag any conflicts.

**Acceptance Criteria** -- Ask:
> "What are the testable conditions for this feature being 'done'? Use Given/When/Then format if possible."

Require at least 1 acceptance criterion.

### Step 4: Validate Against Constitution

Before drafting, verify:
- No functional requirement violates a Hard Constraint
- Business rules align with Guiding Principles
- Nothing in the requirements is out of the Constitution's Boundaries
- Dependencies match Constitution's Dependencies & Assumptions

If any violations are found, flag them to the user with the specific constraint ID and ask them to resolve.

### Step 5: Draft the Document

Fill the template:
- Replace all placeholders with actual content
- Set version metadata (Version: 1.0, dates, author, Status: Draft)
- Ensure IDs are sequential (FR-01, FR-02; NFR-01, NFR-02)
- Build the Related Documents table linking to the actual Constitution file (not the template)

### Step 6: Review with User

Present the draft. Ask:
- "Are the requirement priorities correct?"
- "Is the data model complete?"
- "Are the acceptance criteria specific and testable?"

### Step 7: Save

Write to:
```
Docs/Specifications/Specification-{Feature-ID}.md
```

## Validation Checklist

- [ ] File saved at correct path
- [ ] All 10 sections from the template are present
- [ ] At least 1 "Must Have" functional requirement exists
- [ ] At least 1 acceptance criterion exists
- [ ] No requirement violates a Constitution Hard Constraint
- [ ] Business rules align with Constitution Guiding Principles
- [ ] Requirement IDs are sequential and consistent
- [ ] Related Documents links point to actual feature files
- [ ] No unresolved placeholder brackets remain
- [ ] Revision History has initial entry

## Error Handling

| Situation | Action |
|-----------|--------|
| Constitution not found | Stop. Suggest `create-constitution` skill |
| Requirement violates constraint | Flag violation with HC-XX ID. Ask user to revise or update Constitution |
| No Must Have requirements | Warn user; require at least one before saving |
| User cancels | Save as `Specification-{Feature-ID}-DRAFT.md` |

## What Runs Next

After creating a Specification, the typical next step is creating a **Plan**. Suggest the `create-plan` skill.
