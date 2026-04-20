---
name: execute-prompt
description: Execute a Prompt document by reading its full definition, substituting input variables with actual values, running the prompt, and validating the output against guardrails and expected format. Trigger with "execute prompt [name]", "run prompt [name]", or "use the [name] prompt".
---

## What I Do

Execute a **Prompt** document by reading its complete definition (context, role, variables, guardrails), collecting actual input values from the user, running the prompt, and validating that the output matches the expected format and respects all guardrails.

## When To Use Me

- A prompt document exists and needs to be run with actual inputs
- The user says "execute prompt [name]", "run the prompt", "use the [name] prompt"
- A task references a prompt that needs to be executed during implementation

## Prerequisites

The prompt file must exist at `Docs/Prompts/Prompt-{Feature-ID}-{ShortName}.md`.

## Inputs Required

1. **Prompt file path** or identifiable name -- required
2. **Input values** for the prompt's variables -- required (will ask if not provided)

## Workflow

### Step 1: Read the Prompt Document

Read the prompt file and extract:
- Context (background information)
- Role / Persona (how to behave)
- Prompt Body (the actual instructions)
- Input Variables (what values are needed)
- Expected Output Format (what the output should look like)
- Examples (reference input/output pairs)
- Guardrails (restrictions to enforce)

### Step 2: Collect Input Values

For each variable in the Input Variables table:
- Check if the user already provided it
- If not, ask: "What is the value for `{{variable_name}}`? ({description}, e.g., {example})"
- Validate the type matches (string, number, etc.)

### Step 3: Validate Inputs

Before execution:
- Verify all required variables have values
- Check value types match expectations
- Verify no input violates a guardrail (e.g., PII in a field that shouldn't have it)

### Step 4: Assemble and Execute

1. Adopt the Role / Persona defined in the prompt
2. Inject the Context as background knowledge
3. Substitute all `{{variable}}` placeholders with actual values
4. Execute the assembled Prompt Body
5. Format the output according to the Expected Output Format

### Step 5: Validate Output

Check the output against:
- **Expected Output Format**: Does the structure match?
- **Guardrails**: Does the output respect all restrictions?
- **Examples**: Is the output quality consistent with the example output?

If validation fails:
- Identify what went wrong
- Re-execute with adjusted approach
- If it still fails after 2 attempts, flag to the user

### Step 6: Present Output

Show the user:
1. The generated output
2. A brief validation summary (format: pass/fail, guardrails: pass/fail)
3. Ask: "Does this output meet your expectations? Should I adjust anything?"

### Step 7: Save Output (Optional)

If the user wants to keep the output:
- Save to a location the user specifies
- Or append to the relevant task's Technical Notes section

## Validation Checklist

- [ ] All input variables have values
- [ ] Input types are correct
- [ ] Output matches expected format
- [ ] Output respects all guardrails
- [ ] User has reviewed and accepted the output

## Error Handling

| Situation | Action |
|-----------|--------|
| Prompt file not found | Ask user for correct path; suggest `create-prompt` skill if none exists |
| Missing variable value | Ask user to provide it |
| Output violates guardrail | Identify the violation, re-execute with stricter adherence |
| Output format doesn't match | Restructure the output; if impossible, explain why |
| User rejects output | Ask what to change, re-execute with adjustments |
