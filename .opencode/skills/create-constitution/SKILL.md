---
name: create-constitution
description: Create a new Constitution document for a feature. Gathers principles, hard constraints, boundaries, dependencies, and compliance standards from the user, then produces the governing document that all other feature documents must comply with. Trigger with "create a constitution", "new constitution", or "define rules for [feature]".
---

## What I Do

Create a **Constitution** document -- the governing "law" for a feature. The constitution defines the core principles, hard constraints, boundaries, and compliance standards. Every other document (Specification, Plan, Tasks, Prompts) must comply with it.

## When To Use Me

- A new feature is being planned and needs governing rules defined first
- The user says "create a constitution", "new constitution", "define the rules for [feature]"
- The `bootstrap-feature` skill delegates constitution creation here
- No constitution exists for a given feature ID

## Inputs Required

Before starting, confirm these with the user:
1. **Feature ID** (e.g., `Feature-001`) -- required
2. **Feature Name** (human-readable) -- required
3. **Brief description** of what the feature does -- required
4. Optionally: known principles, constraints, or compliance requirements

## Workflow

### Step 1: Read the Template

Read the constitution template:
```
Docs/Constitutions/Constitution-Template.md
```

This is the structure you must follow exactly. Do not add or remove sections.

### Step 2: Gather Requirements

Ask the user targeted questions to fill each section. Do NOT skip any section.

**Guiding Principles** -- Ask:
> "What are the core principles that must never be violated for this feature? (e.g., user privacy, data integrity, performance thresholds, reversibility)"

Require at least 1 principle. Suggest common ones if the user is unsure.

**Hard Constraints** -- Ask:
> "What are the hard technical or business constraints? For each, provide the constraint and the reason."

Format as a table with columns: ID, Constraint, Reason. Use IDs like HC-01, HC-02.
Require at least 1 constraint.

**Boundaries / Out of Scope** -- Ask:
> "What does this feature explicitly NOT do? What adjacent concerns belong to other features?"

**Dependencies & Assumptions** -- Ask:
> "What does this feature depend on? (e.g., auth module, specific database, third-party API) What assumptions are we making?"

**Compliance & Standards** -- Ask:
> "Are there any compliance standards to follow? (WCAG, GDPR, security policies, coding standards)"

### Step 3: Draft the Document

Fill the template with gathered information:
- Replace `[Feature-XXX]` with the actual feature ID
- Replace `[Feature Name]` with the actual name
- Set `Version: 1.0`
- Set `Created` and `Last Updated` to today's date
- Set `Author` to the user's name or "Agent" if not specified
- Populate every section with the gathered requirements
- Build the **Related Documents** table with correct relative paths pointing to the feature's own documents (not templates)

### Step 4: Review with User

Present the complete draft. Ask:
- "Does this accurately capture all the governing rules?"
- "Are any principles or constraints missing?"
- "Should any boundaries be adjusted?"

Apply any feedback before saving.

### Step 5: Save

Write the final file to:
```
Docs/Constitutions/Constitution-{Feature-ID}.md
```

Example: `Docs/Constitutions/Constitution-Feature-001.md`

## Validation Checklist

Before considering this skill complete, verify:
- [ ] File saved at correct path with correct naming
- [ ] All 7 sections from the template are present and populated
- [ ] At least 1 Guiding Principle exists
- [ ] At least 1 Hard Constraint exists with ID, Constraint, and Reason
- [ ] No unresolved placeholder brackets `[...]` remain
- [ ] Related Documents table has correct relative paths
- [ ] Revision History has an initial entry with today's date

## Error Handling

| Situation | Action |
|-----------|--------|
| Template not found | Tell user to verify `Docs/Constitutions/Constitution-Template.md` exists |
| User gives no principles | Suggest common principles based on feature description; confirm |
| Constitution already exists | Ask: overwrite, create new version, or abort |
| User cancels mid-workflow | Save as `Constitution-{Feature-ID}-DRAFT.md` |

## What Runs Next

After creating a Constitution, the typical next step is creating a **Specification**. Suggest the `create-specification` skill to the user.
