---
name: execute-plan
description: Orchestrate the execution of an entire Plan by processing tasks in dependency order across all phases. Reads the Plan and Task Index, respects dependencies, delegates each task to the execute-task skill, tracks overall progress, and updates phase statuses. Trigger with "execute plan", "run the plan for [feature]", or "implement [feature]".
---

## What I Do

Orchestrate the full execution of a feature **Plan** by processing all tasks in dependency order. I read the Plan's phases, use the Task Index to determine execution order, delegate each task to the `execute-task` skill, track progress, and update phase statuses as milestones are reached.

## When To Use Me

- All documents exist (Constitution, Specification, Plan, Tasks) and it's time to build
- The user says "execute the plan", "implement the feature", "run the plan"
- The user wants to work through all tasks systematically

## Prerequisites

All must exist:
1. **Constitution** at `Docs/Constitutions/Constitution-{Feature-ID}.md`
2. **Specification** at `Docs/Specifications/Specification-{Feature-ID}.md`
3. **Plan** at `Docs/Plans/Plan-{Feature-ID}.md`
4. **Task files** at `Docs/Tasks/Task-{Feature-ID}-T*.md`
5. **Task Index** at `Docs/Tasks/Task-Index-{Feature-ID}.md`

If tasks don't exist, suggest the `create-tasks` skill first.

## Inputs Required

1. **Feature ID** -- required
2. **Resume from task** -- optional (to continue from a specific task if resuming)

## Workflow

### Step 1: Read the Plan and Task Index

Read:
- Plan: Get phase list, their statuses, and success criteria
- Task Index: Get the full task list with dependencies and current statuses

Build an **execution queue**: tasks ordered by dependency (tasks with no blockers first, then tasks whose blockers are done, etc.).

### Step 2: Identify Starting Point

Check task statuses:
- If all tasks are "Backlog" → start from the beginning
- If some tasks are "Done" → resume from the first non-done task
- If a specific resume point was given → start there

Skip any tasks already marked "Done".

### Step 3: Present Execution Plan to User

Show the user:
```
Feature: {Feature-ID} - {Feature Name}
Total tasks: X
Completed: Y
Remaining: Z

Execution order:
1. {Task-ID} - {Title} [Phase X] -- {Status}
2. {Task-ID} - {Title} [Phase X] -- {Status}
...
```

Ask: "Ready to start? Or would you like to adjust the order or skip any tasks?"

### Step 4: Execute Tasks in Order

For each task in the execution queue:

1. **Announce**: "Starting task {Task-ID}: {Title} (Phase {X}, {N} of {Total})"
2. **Load the execute-task skill** and execute it with the current task
3. **After completion**: Verify the task is marked Done
4. **Update the Task Index**: Mark task status as Done
5. **Check phase completion**: If all tasks in a phase are Done, update the Plan's phase status to "Complete"
6. **Report progress**: "{N}/{Total} tasks complete. Phase {X}: {status}"

Between tasks, ask the user:
> "Task {ID} complete. Continue to the next task ({next-ID}: {next-title})?"

This gives the user a chance to pause, review, or adjust.

### Step 5: Handle Phase Transitions

When all tasks in a phase are complete:
1. Update the Plan: change phase Status from "In Progress" to "Complete"
2. Announce: "Phase {X} complete! Moving to Phase {Y}."
3. If the next phase has different resource needs or considerations, flag them

### Step 6: Final Verification

After all tasks are complete:
1. Read the Plan's Success Criteria
2. Verify each criterion is met
3. Read the Specification's Acceptance Criteria
4. Verify each criterion is met
5. Run the `validate-compliance` skill to check Constitution compliance

### Step 7: Finalize

1. Update the Plan status to "Complete" (or "In Review" if manual review is needed)
2. Update all phase statuses
3. Present a completion summary:
   - Total tasks completed
   - Tasks by phase
   - Any issues encountered
   - Success criteria results
   - Constitution compliance status

## Validation Checklist

- [ ] All tasks marked as "Done" in their files and the Task Index
- [ ] All Plan phases marked as "Complete"
- [ ] Plan Success Criteria verified
- [ ] Specification Acceptance Criteria verified
- [ ] Constitution compliance validated
- [ ] Plan status updated to "Complete" or "In Review"

## Error Handling

| Situation | Action |
|-----------|--------|
| Missing task files | Suggest `create-tasks` skill |
| Task execution fails | Log the failure. Ask user: retry, skip, or stop |
| Circular dependency in task order | Flag. Ask user to resolve in task files |
| User wants to pause | Save progress. Note the next task to resume from |
| Success criteria not met | List failing criteria. Ask user how to proceed |

## Progress Tracking

Use the TodoWrite tool to maintain a visible progress list:
- One item per task in the current phase
- Mark items as they complete
- Update the list when entering a new phase
