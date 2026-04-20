---
name: create-plan
description: Create a new Plan document for a feature. Reads both the Constitution and Specification, then designs a phased implementation plan with milestones, resource requirements, risks, and success criteria. Trigger with "create a plan", "new plan", or "plan the implementation for [feature]".
---

## What I Do

Create a **Plan** document that outlines how and when a feature will be built. It breaks the Specification's requirements into ordered phases with milestones, identifies risks, and defines success criteria. The plan must comply with the Constitution's constraints.

## When To Use Me

- A Constitution and Specification exist, and the next step is planning
- The user says "create a plan", "plan this feature", "implementation plan"
- The `bootstrap-feature` skill delegates plan creation here

## Prerequisites

Both must exist for the feature:
1. **Constitution** at `Docs/Constitutions/Constitution-{Feature-ID}.md`
2. **Specification** at `Docs/Specifications/Specification-{Feature-ID}.md`

If either is missing, suggest the appropriate creation skill.

## Inputs Required

1. **Feature ID** -- required
2. **Feature Name** -- required
3. **Timeline or deadline** -- optional (agent will ask if not provided)

## Workflow

### Step 1: Read Parent Documents

Read both files and extract:
- From Constitution: Hard Constraints (affect what's feasible), Dependencies (affect ordering), Assumptions
- From Specification: Functional Requirements with priorities, Data Model complexity, API Endpoints count, Non-Functional Requirements (affect testing phases)

### Step 2: Read the Template

Read `Docs/Plans/Plan-Template.md` for the exact structure.

### Step 3: Design Phases

Analyze the specification's requirements and propose a phased breakdown:

1. **Group requirements** into logical phases. Common pattern:
   - Phase 1: Database schema and migrations
   - Phase 2: Core business logic / service layer
   - Phase 3: API endpoints
   - Phase 4: UI implementation
   - Phase 5: Testing and QA
   - Phase 6: Deployment and monitoring

2. **Order by dependency**: database before API before UI. Constitution dependencies affect ordering too.

3. **Prioritize**: Assign Must Have requirements to earlier phases. Should/Could Have to later phases.

4. **Estimate timing** based on user input or reasonable defaults.

### Step 4: Identify Risks

Analyze all documents to identify at least 2 risks:
- Technical risks (third-party APIs, data migration, performance targets from NFRs)
- Process risks (scope creep, resource gaps)
- Compliance risks (from Constitution's compliance standards)
- For each: assign Likelihood (Low/Medium/High), Impact (Low/Medium/High), and a Mitigation strategy

### Step 5: Gather User Input

Ask the user:
> "Here are the proposed phases: [present table]. Does this order and grouping look correct?"

> "What resources are available? People, tools, budget?"

> "What is the target timeline?" (if not already provided)

> "Beyond passing acceptance criteria, what does success look like?"

### Step 6: Draft the Document

Fill the template:
- Objective: 1-2 sentences on what this plan achieves
- Approach/Strategy: High-level architectural decisions
- Phases & Milestones: Table with Phase, Description, Target Date, Status (all "Not Started")
- Resource Requirements: People, Tools, Budget
- Risks & Mitigations: Table with at least 2 entries
- Success Criteria: Checkboxes linked to Specification's Acceptance Criteria
- Related Documents: Link to actual Constitution and Specification files
- Set metadata: Version 1.0, dates, Status: Draft

### Step 7: Review with User

Present the draft. Ask:
- "Are the phases realistic given the resources?"
- "Are any risks missing?"
- "Do the milestones align with your timeline?"

### Step 8: Save

Write to:
```
Docs/Plans/Plan-{Feature-ID}.md
```

## Validation Checklist

- [ ] File saved at correct path
- [ ] All 8 sections from the template are present
- [ ] Every Must Have requirement is covered by at least one phase
- [ ] Phase order respects dependency chains
- [ ] At least 2 risks with mitigations
- [ ] Success Criteria reference Specification's Acceptance Criteria
- [ ] Related Documents link to actual feature files
- [ ] Revision History has initial entry

## Error Handling

| Situation | Action |
|-----------|--------|
| Constitution not found | Suggest `create-constitution` skill |
| Specification not found | Suggest `create-specification` skill |
| Requirements exceed timeline | Flag concern, suggest extending or reducing scope |
| User cancels | Save as `Plan-{Feature-ID}-DRAFT.md` |

## What Runs Next

After creating a Plan, the typical next step is creating **Tasks**. Suggest the `create-tasks` skill.
