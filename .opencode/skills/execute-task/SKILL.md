---
name: execute-task
description: Execute a single Task document by reading its instructions, implementing the code changes, running tests, and updating task status. Reads the task's parent documents (Constitution, Specification, Plan) for context. Tracks progress through subtask checklists and logs. Trigger with "execute task [ID]", "work on task [ID]", or "implement [task]".
---

## What I Do

Execute a single **Task** document by reading its full context (parent Constitution, Specification, Plan), implementing the required code changes step by step, running tests, and updating the task's status and progress log.

## When To Use Me

- A task document exists and needs to be implemented
- The user says "execute task [ID]", "work on [task]", "implement [task]"
- The `execute-plan` skill delegates individual task execution here

## Prerequisites

The task file must exist at `Docs/Tasks/Task-{Feature-ID}-T{##}.md`.

## Inputs Required

1. **Task file path** or **Task ID** (e.g., `Feature-001-T03`) -- required
2. Any additional context the user wants to provide

## Workflow

### Step 1: Read the Task Document

Read the task file and extract:
- Description (what needs to be done)
- Parent References (Constitution, Specification, Plan, related requirements)
- Acceptance Criteria (what defines "done")
- Steps / Subtasks (the implementation checklist)
- Technical Notes (hints, patterns, gotchas)
- Dependencies (verify blocked-by tasks are done)
- Testing requirements

### Step 2: Check Dependencies

Read the task's "Blocked by" field. For each blocking task:
- Check its status in its task file or the Task Index
- If any blocker is NOT "Done", **stop** and inform the user which tasks must complete first

### Step 3: Read Parent Documents for Context

Read the referenced documents to understand:
- **Constitution**: Constraints to respect during implementation
- **Specification**: The requirement being implemented (FR-XX), data model, API design, business rules
- **Plan**: The phase context and any architectural decisions

This gives you full context for the implementation.

### Step 4: Update Task Status

Edit the task file: change `Status: Backlog` to `Status: In Progress`.
Add a log entry: `| {today's date} | Started implementation |`

### Step 5: Execute Subtasks

Work through the Steps / Subtasks checklist one by one:

For each subtask:
1. **Understand** what the subtask requires (reference Specification details)
2. **Implement** the code change
3. **Verify** the change works (run relevant tests, check compilation)
4. **Mark the subtask as done** in the task file: change `- [ ]` to `- [x]`
5. **Log progress**: Add a dated note in the Log section

Follow these rules during implementation:
- Respect all Constitution Hard Constraints
- Match the Specification's data model, API signatures, and business rules exactly
- Follow any patterns mentioned in Technical Notes
- Write clean, documented code

### Step 6: Run Tests

Execute the tests defined in the Testing section:
- **Unit Tests**: Run and verify pass
- **Integration Tests**: Run if applicable
- **Manual Testing**: Follow the manual steps and verify

If tests fail, fix the implementation and re-run.

### Step 7: Verify Acceptance Criteria

Go through each acceptance criterion in the task:
- Verify it is met
- Mark as done: `- [ ]` to `- [x]`
- If any criterion cannot be met, flag it to the user

### Step 8: Finalize

1. Update task status to `Status: In Review` (or `Done` if no review needed)
2. Add final log entry: `| {today's date} | Implementation complete. All tests passing. |`
3. If this task "Blocks" other tasks, inform the user those are now unblocked

## Validation Checklist

- [ ] All subtask steps are marked as done `[x]`
- [ ] All acceptance criteria are marked as done `[x]`
- [ ] All specified tests pass
- [ ] No Constitution Hard Constraints were violated
- [ ] Implementation matches Specification requirements
- [ ] Task status updated to "In Review" or "Done"
- [ ] Progress log has dated entries for start and completion

## Error Handling

| Situation | Action |
|-----------|--------|
| Task file not found | Ask user for the correct path or task ID |
| Blocking task not done | Stop. List the blocking tasks and their statuses |
| Test failures | Debug and fix. Log the issue and resolution |
| Acceptance criterion cannot be met | Flag to user with explanation. Do not mark as done |
| Implementation violates Constitution | Stop. Flag the violation. Ask user how to proceed |
| Ambiguous requirement | Ask user for clarification before proceeding |

## Progress Tracking

Throughout execution, keep the user informed:
- Announce which subtask you're working on
- Report test results
- Flag any issues immediately
- Use the TodoWrite tool to track progress visibly
