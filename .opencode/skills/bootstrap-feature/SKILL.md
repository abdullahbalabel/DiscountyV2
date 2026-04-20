---
name: bootstrap-feature
description: Bootstrap a complete document set for a new feature. Orchestrates the creation of all documents in the correct order -- Constitution, Specification, Plan, Tasks, and optionally Prompts -- by delegating to the individual creation skills. Produces a fully linked, cross-referenced document set ready for execution. Trigger with "bootstrap feature", "new feature", "set up [feature]", or "create all docs for [feature]".
---

## What I Do

Bootstrap the **complete document set** for a new feature by orchestrating all creation skills in the correct order. I produce a fully linked, cross-referenced set of documents (Constitution, Specification, Plan, Tasks, and optionally Prompts) ready for plan execution.

## When To Use Me

- Starting a brand new feature from scratch
- The user says "bootstrap feature", "new feature", "set up feature", "create all docs"
- The user wants the full document pipeline created in one flow

## Document Creation Order

Documents must be created in this order due to dependencies:

```
1. Constitution     (no dependencies -- created first)
2. Specification    (depends on Constitution)
3. Plan             (depends on Constitution + Specification)
4. Tasks            (depends on Constitution + Specification + Plan)
5. Prompts          (optional, depends on Constitution + Specification)
```

## Inputs Required

1. **Feature ID** (e.g., `Feature-001`) -- required
2. **Feature Name** -- required
3. **Feature description** -- required (brief summary of what it does)
4. **Create Prompts?** -- optional (default: ask user)

## Workflow

### Step 1: Confirm Feature Details

Ask the user:
> "What is the Feature ID? (e.g., Feature-001)"
> "What is the feature name?"
> "Briefly describe what this feature does."

Verify no documents already exist for this Feature ID. If they do, ask: continue (overwrite), use a new ID, or abort.

### Step 2: Create Constitution

Load the `create-constitution` skill and execute it with:
- Feature ID
- Feature Name
- Description

Wait for completion. Verify the file exists at `Docs/Constitutions/Constitution-{Feature-ID}.md`.

### Step 3: Create Specification

Load the `create-specification` skill and execute it with:
- Feature ID
- Feature Name
- Constitution path

Wait for completion. Verify the file exists at `Docs/Specifications/Specification-{Feature-ID}.md`.

### Step 4: Create Plan

Load the `create-plan` skill and execute it with:
- Feature ID
- Feature Name
- Constitution path
- Specification path

Wait for completion. Verify the file exists at `Docs/Plans/Plan-{Feature-ID}.md`.

### Step 5: Create Tasks

Load the `create-tasks` skill and execute it with:
- Feature ID
- Feature Name
- Constitution path
- Specification path
- Plan path

Wait for completion. Verify task files and index exist in `Docs/Tasks/`.

### Step 6: Create Prompts (Optional)

Ask the user:
> "Do you need any AI prompts for this feature? (e.g., for code generation, content creation, data processing)"

If yes, load the `create-prompt` skill for each prompt needed.

### Step 7: Run Compliance Validation

Load the `validate-compliance` skill and run a full audit of all created documents.

Address any violations before finalizing.

### Step 8: Present Summary

Show the user a complete summary:

```
## Feature Bootstrap Complete: {Feature-ID} - {Feature Name}

### Documents Created:
- Constitution: Docs/Constitutions/Constitution-{Feature-ID}.md
- Specification: Docs/Specifications/Specification-{Feature-ID}.md
- Plan: Docs/Plans/Plan-{Feature-ID}.md
- Tasks: {N} task files + index in Docs/Tasks/
- Prompts: {N} prompt files in Docs/Prompts/ (if created)

### Quick Stats:
- Guiding Principles: {N}
- Hard Constraints: {N}
- Functional Requirements: {N} (Must: {N}, Should: {N}, Could: {N})
- Plan Phases: {N}
- Total Tasks: {N}
- Compliance: PASS / {N} warnings

### Ready for Execution
Use the `execute-plan` skill to start implementing this feature.
```

## Validation Checklist

- [ ] Constitution file exists and is valid
- [ ] Specification file exists, complies with Constitution
- [ ] Plan file exists, covers all Must Have requirements
- [ ] Task files exist with proper dependencies and traceability
- [ ] Task Index exists with correct task list
- [ ] Prompts created if requested
- [ ] Compliance validation passed (zero FAIL, warnings acceptable)
- [ ] All Related Documents tables cross-reference correctly
- [ ] All documents use the correct Feature ID consistently

## Error Handling

| Situation | Action |
|-----------|--------|
| Feature ID already in use | Ask: overwrite, new ID, or abort |
| Any creation skill fails | Stop. Report which step failed and why. Offer to retry or abort |
| Compliance validation fails | Show violations. Fix before finalizing. Re-run validation |
| User wants to skip a document | Warn about downstream impacts. Allow skip but note it |
| User cancels mid-flow | Save all completed documents. Note which steps remain |

## What Runs Next

The feature is fully documented and ready. Suggest `execute-plan` to start implementation.
