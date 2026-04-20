---
name: create-prompt
description: Create a new Prompt document for a feature. Reads the Constitution (for guardrails) and Specification (for context and business rules), then produces a structured, reusable AI prompt with role definition, variables, expected output format, examples, and guardrails. Trigger with "create a prompt", "new prompt", or "write an AI prompt for [purpose]".
---

## What I Do

Create a **Prompt** document -- a structured, reusable AI prompt for development, content generation, or user-facing interactions. The prompt includes a role/persona, input variables, expected output format, examples, and guardrails derived from the Constitution.

## When To Use Me

- A task requires an AI prompt and none exists
- The user says "create a prompt", "new prompt", "write a prompt for [purpose]"
- The `bootstrap-feature` skill delegates prompt creation here

## Prerequisites

Recommended (not strictly required):
1. **Constitution** at `Docs/Constitutions/Constitution-{Feature-ID}.md` (provides guardrails)
2. **Specification** at `Docs/Specifications/Specification-{Feature-ID}.md` (provides context)

If neither exists, warn the user that guardrails and context will be limited.

## Inputs Required

1. **Feature ID** -- required
2. **Prompt Name** (short descriptive name) -- required
3. **Purpose** (what the prompt accomplishes) -- required
4. **Target Agent/Model** -- optional (e.g., Claude, GPT-4, Custom Agent)

## Workflow

### Step 1: Read Parent Documents

If available, read Constitution and Specification to extract:
- Constitution Hard Constraints → become Guardrails
- Constitution Guiding Principles → inform the Role definition
- Specification Data Model → informs Input Variables
- Specification Business Rules → inform the Prompt Body

### Step 2: Read the Template

Read `Docs/Prompts/Prompt-Template.md` for the exact structure.

### Step 3: Gather Prompt Requirements

Ask the user:

> "What should this prompt accomplish?" (confirm purpose)

> "What role or persona should the AI adopt?" (e.g., senior developer, content writer, data analyst)

> "What inputs will be provided? List the variable names, types, and what they represent."

> "What output format do you expect? (JSON, markdown, code, plain text, etc.)"

> "Can you provide an example input and the expected output?"

> "Any additional edge cases or restrictions beyond the Constitution's constraints?"

### Step 4: Draft the Prompt

Fill the template:

- **Context**: Summarize relevant feature details from Constitution and Specification
- **Role / Persona**: Define based on user input; include rules from Constitution Principles
- **Prompt Body**: Clear, specific instructions. Reference input variables with `{{variable}}` syntax
- **Input Variables**: Table with Variable, Type, Description, Example
- **Expected Output Format**: Show the structure with an example
- **Examples**: At least 1 input/output pair
- **Guardrails**: Map Constitution Hard Constraints + Specification Business Rules to prompt-specific restrictions
- **Related Documents**: Link to actual feature files
- **Metadata**: Version 1.0, dates, target agent

### Step 5: Test the Prompt (Optional)

If the user agrees, run the prompt with example inputs to verify:
- Output matches expected format
- Guardrails are respected
- Variables substitute correctly

### Step 6: Review with User

Present the draft (and test results if available). Ask:
- "Does the prompt produce the right kind of output?"
- "Are the guardrails sufficient?"
- "Should variables be added or removed?"

### Step 7: Save

Write to:
```
Docs/Prompts/Prompt-{Feature-ID}-{ShortName}.md
```

Example: `Docs/Prompts/Prompt-Feature-001-GenerateDiscountCode.md`

## Validation Checklist

- [ ] File saved at correct path
- [ ] All 9 sections from the template are present
- [ ] Guardrails align with Constitution Hard Constraints
- [ ] At least 1 input variable defined
- [ ] At least 1 example input/output pair
- [ ] Expected output format is explicitly defined
- [ ] Related Documents link to actual feature files
- [ ] Revision History has initial entry

## Error Handling

| Situation | Action |
|-----------|--------|
| Constitution not found | Warn; proceed with user-provided guardrails only |
| Specification not found | Warn; proceed with user-provided context only |
| No variables defined | Confirm with user this is intentional (static prompt) |
| Test output violates guardrails | Revise prompt body with stricter instructions |
| User cancels | Save as `Prompt-{Feature-ID}-{ShortName}-DRAFT.md` |
