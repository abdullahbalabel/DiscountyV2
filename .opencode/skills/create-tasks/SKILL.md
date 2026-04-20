---
name: create-tasks
description: Generate individual Task documents from a feature's Plan. Decomposes each phase into actionable, traceable work units with acceptance criteria, subtask checklists, dependencies, and testing requirements. Each task links back to the Constitution, Specification, and Plan. Trigger with "create tasks", "break down the plan", or "generate tasks for [feature]".
---

## What I Do

Generate individual **Task** documents by decomposing a Plan's phases into actionable work units. Each task is traceable back to the Constitution (compliance), Specification (requirements), and Plan (phase). Tasks include acceptance criteria, step checklists, dependencies, and testing requirements.

## When To Use Me

- A Plan exists with populated phases and the next step is creating work items
- The user says "create tasks", "break down the plan", "generate tasks"
- The `bootstrap-feature` skill delegates task creation here

## Prerequisites

All three must exist for the feature:
1. **Constitution** at `Docs/Constitutions/Constitution-{Feature-ID}.md`
2. **Specification** at `Docs/Specifications/Specification-{Feature-ID}.md`
3. **Plan** at `Docs/Plans/Plan-{Feature-ID}.md`

## Inputs Required

1. **Feature ID** -- required
2. **Feature Name** -- required

## Workflow

### Step 1: Read All Parent Documents

Read all three documents and extract:
- Constitution: Constraints each task must respect
- Specification: Requirements (FR-01, FR-02, etc.) each task implements, plus Acceptance Criteria
- Plan: Phases with descriptions and ordering

### Step 2: Read the Template

Read `Docs/Tasks/Task-Template.md` for the exact structure.

### Step 3: Decompose Phases into Tasks

For each phase in the Plan:

1. **Identify requirements** assigned to this phase
2. **Break each requirement into concrete tasks**, typically:
   - Database/schema task (migration, model)
   - Service/logic task (business logic implementation)
   - API/route task (endpoint wiring)
   - UI task (component, page)
   - Test task (unit, integration)
3. **Assign task IDs**: `{Feature-ID}-T01`, `{Feature-ID}-T02`, etc. Sequential across all phases.
4. **Determine dependencies**: which task blocks which. Database tasks typically come before service tasks, etc.
5. **Set priority**: Critical > High > Medium > Low. Derive from requirement priority and dependency position.
6. **Estimate effort** where possible (hours, days, or story points).

### Step 4: Define Acceptance Criteria per Task

For each task:
- Derive specific, testable criteria from the parent requirement
- Map relevant Specification Acceptance Criteria to tasks
- Define testing approach (unit, integration, manual)

### Step 5: Present Task List for Review

Show the user a summary table:

```
| Task ID | Title | Phase | Requirement | Priority | Blocked By | Effort |
```

Ask:
- "Does this breakdown cover everything?"
- "Are the priorities and dependencies correct?"
- "Should any tasks be merged or split?"

Apply feedback.

### Step 6: Generate Task Files

For each confirmed task, fill the template and save:

**File path**: `Docs/Tasks/Task-{Feature-ID}-T{##}.md`
Example: `Docs/Tasks/Task-Feature-001-T01.md`

Fill all sections:
- **Description**: Clear enough for someone unfamiliar with the codebase
- **Parent References**: Link to actual Constitution, Specification, Plan files with specific sections
- **Acceptance Criteria**: Checkboxes derived from Step 4
- **Steps / Subtasks**: Concrete implementation steps as checkboxes
- **Technical Notes**: Implementation hints, code patterns, gotchas
- **Dependencies**: Blocked by / Blocks relationships using task IDs
- **Testing**: Unit, integration, manual test details
- **Related Documents**: Links to actual feature files
- **Status**: "Backlog"
- **Log**: Empty with today's date placeholder

### Step 7: Generate Task Index

Create a summary index file:

**File path**: `Docs/Tasks/Task-Index-{Feature-ID}.md`

Contents:
- Feature name and ID
- Table of all tasks: ID, Title, Phase, Status, Priority, Blocked By
- Dependency graph (text-based showing execution order)
- Quick stats: total tasks, by phase, by priority

## Validation Checklist

- [ ] All task files saved at correct paths following naming convention
- [ ] Task index file created
- [ ] Every Must Have requirement has at least one task
- [ ] Every task has at least one acceptance criterion
- [ ] Every task has at least one subtask step
- [ ] Dependencies are consistent (no circular dependencies)
- [ ] All tasks have Status "Backlog"
- [ ] Parent References link to actual feature files with correct sections
- [ ] Task IDs are sequential with no gaps

## Error Handling

| Situation | Action |
|-----------|--------|
| Plan not found | Suggest `create-plan` skill |
| Plan has no phases | Cannot generate tasks; ask user to add phases |
| Circular dependency detected | Flag the cycle, ask user to resolve |
| Requirement is too vague to decompose | Ask user for clarification |
| User cancels mid-workflow | Save completed task files; note remaining as "not generated" in index |

## What Runs Next

Tasks are ready to be **executed**. Suggest the `execute-task` skill for individual tasks, or `execute-plan` to orchestrate the full plan.
