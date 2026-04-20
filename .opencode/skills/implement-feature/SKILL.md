---
name: implement-feature
description: Master implementation guide that drives the full coding lifecycle for a feature. Reads all feature documents (Constitution, Specification, Plan, Tasks), analyzes the tech stack, scaffolds the project structure, enforces architecture patterns, manages implementation order with quality gates between phases, runs tests, validates compliance, and handles deployment. Unlike execute-task (single task) or execute-plan (task orchestration), this skill owns the HOW of building -- architecture, coding standards, integration, and delivery. Trigger with "implement feature", "start building", "guide implementation", or "code [feature]".
---

## What I Do

I am the **master implementation guide**. I own the full coding lifecycle from project scaffolding to deployment. While `execute-plan` orchestrates WHICH tasks to run and `execute-task` runs a single task, I guide HOW to build -- architecture decisions, coding standards, project structure, integration strategy, quality gates, and delivery.

Think of it this way:
- **Plan** = what to build and in what order
- **Tasks** = individual work items
- **This skill** = how to build it properly as a real software project

## When To Use Me

- All feature documents exist and it's time to actually write code
- The user says "implement feature", "start building", "guide the implementation", "code this feature"
- After `bootstrap-feature` and before (or instead of) `execute-plan`
- When the user needs architectural guidance, not just task-by-task execution

## Prerequisites

All must exist for the feature:
1. **Constitution** at `Docs/Constitutions/Constitution-{Feature-ID}.md`
2. **Specification** at `Docs/Specifications/Specification-{Feature-ID}.md`
3. **Plan** at `Docs/Plans/Plan-{Feature-ID}.md`
4. **Tasks** at `Docs/Tasks/Task-{Feature-ID}-T*.md`
5. **Task Index** at `Docs/Tasks/Task-Index-{Feature-ID}.md`

If any are missing, suggest the appropriate creation skill before proceeding.

## Inputs Required

1. **Feature ID** -- required
2. **Project root path** -- required (where source code lives)
3. **Tech stack** -- optional (agent will detect from project files if not provided)

---

## PHASE 0: Discovery and Analysis

> Before writing a single line of code, understand the full picture.

### Step 0.1: Read All Feature Documents

Read every document for the feature and build a mental model:

| Document | Extract |
|----------|---------|
| Constitution | Hard Constraints (HC-01...), Guiding Principles, Dependencies, Compliance Standards |
| Specification | Functional Requirements (FR-01...), Data Model (entities, fields, relationships), API Endpoints, Business Rules, Acceptance Criteria |
| Plan | Phases with ordering, Approach/Strategy, Risks, Success Criteria |
| Task Index | Full task list with dependencies and execution order |

### Step 0.2: Analyze the Existing Codebase

Scan the project to understand:
- **Language and framework** (e.g., Next.js, Express, Flutter, etc.)
- **Package manager** (npm, pnpm, yarn, bun, pip, cargo, etc.)
- **Existing directory structure** (where source files, tests, configs live)
- **Existing patterns** (how routes are defined, how services are structured, how data access works)
- **Database setup** (Supabase, Prisma, raw SQL, etc.)
- **Test framework** (Jest, Vitest, pytest, etc.)
- **CI/CD** (GitHub Actions, Vercel, etc.)
- **Linter/formatter** (ESLint, Prettier, Biome, etc.)

### Step 0.3: Detect Conflicts Early

Cross-check what the Specification requires against what the codebase supports:
- Does the data model require new tables or changes to existing ones?
- Do API endpoints follow the project's existing routing pattern?
- Are there dependency conflicts (e.g., Specification needs a library the project doesn't use)?
- Do Constitution constraints conflict with existing project patterns?

Flag any conflicts to the user before proceeding.

### Step 0.4: Present the Implementation Brief

Present a concise brief to the user:

```
## Implementation Brief: {Feature-ID} - {Feature Name}

### Tech Stack Detected
- Framework: {detected}
- Database: {detected}
- Test Framework: {detected}
- Package Manager: {detected}

### Scope
- Entities to create/modify: {list}
- API endpoints: {count} ({methods})
- UI screens: {count}
- Estimated tasks: {count across phases}

### Architecture Approach
- {1-2 sentences on how this feature fits into the existing codebase}

### Potential Conflicts
- {list any conflicts found, or "None detected"}

### Ready to proceed?
```

Wait for user confirmation before continuing.

---

## PHASE 1: Project Scaffolding

> Set up the file structure, dependencies, and configuration before writing feature code.

### Step 1.1: Create Directory Structure

Based on the Specification's scope and the project's existing conventions, create any new directories needed:
- Model/entity directories
- Service/business logic directories
- Route/controller directories
- Component/page directories (for UI)
- Test directories mirroring source structure

**Rule**: Follow existing project conventions exactly. If the project uses `src/services/`, put new services there. Do not invent new patterns.

### Step 1.2: Install Dependencies

If the Specification or Plan mentions tools/libraries not yet in the project:
1. List what needs to be installed
2. Show the user the install commands
3. Wait for confirmation
4. Run the install commands

### Step 1.3: Environment Configuration

If the feature requires new environment variables, API keys, or config:
1. List what's needed
2. Add to `.env.example` or equivalent (never commit secrets)
3. Remind the user to set actual values

### Step 1.4: Database Migrations (if needed)

If the Specification's Data Model requires schema changes:
1. Read the Data Model section carefully -- entities, fields, types, relationships
2. Create migration files following the project's migration conventions
3. Include: tables, columns, indexes, foreign keys, RLS policies (if Supabase)
4. Run the migration in development
5. Verify the schema matches the Specification

**Constitution check**: Verify the schema respects Hard Constraints (e.g., data retention, PII handling, performance indexes).

### Quality Gate: Scaffolding Complete

Before moving on, verify:
- [ ] Directory structure is set up
- [ ] Dependencies installed and lockfile updated
- [ ] Environment variables documented
- [ ] Database migrations applied and verified
- [ ] No linter or type errors introduced

---

## PHASE 2: Core Implementation

> Build the feature layer by layer: data access → business logic → API → UI.

### Step 2.1: Data Access Layer

For each entity in the Specification's Data Model:
1. Create model/type definitions matching the Specification exactly
2. Implement CRUD operations (or the subset the Specification requires)
3. Add data validation matching Business Rules
4. Write unit tests for data access functions

**Coding standards**:
- Type everything. No `any` types. No implicit types.
- Handle all error cases. Return meaningful error messages.
- Follow the project's existing data access patterns.

### Step 2.2: Business Logic / Service Layer

For each Functional Requirement:
1. Implement the business logic in a service function
2. Enforce every Business Rule from the Specification
3. Respect every Hard Constraint from the Constitution
4. Handle edge cases explicitly (what happens with bad input? null values? race conditions?)
5. Write unit tests covering happy path AND edge cases

**Coding standards**:
- One service function per logical operation
- Pure functions where possible (input → output, no hidden side effects)
- Validate inputs at the boundary, trust them internally
- Log important operations (creation, deletion, permission checks)

### Step 2.3: API Layer

For each endpoint in the Specification's API Endpoints table:
1. Create the route following the project's routing conventions
2. Wire it to the service layer
3. Add authentication/authorization as specified (Auth Required column)
4. Add input validation (request body, query params, path params)
5. Return correct HTTP status codes and response formats
6. Write integration tests for each endpoint

**Coding standards**:
- Consistent error response format across all endpoints
- Never expose internal errors to the client
- Validate request data before passing to service layer
- Follow REST conventions (or whatever pattern the project uses)

### Step 2.4: UI Layer (if applicable)

For each screen in the Specification's UI/UX Requirements:
1. Create the component/page following the project's UI conventions
2. Implement the user flow as specified
3. Connect to the API layer
4. Handle loading, error, and empty states
5. Apply the Specification's Non-Functional Requirements (performance, accessibility)
6. Write component tests

**Coding standards**:
- Responsive design unless Specification says otherwise
- Accessible by default (semantic HTML, ARIA labels, keyboard navigation)
- Handle all states: loading, error, empty, success
- Follow existing component patterns in the project

### Quality Gate: Core Implementation Complete

Before moving on, verify:
- [ ] All Functional Requirements have corresponding code
- [ ] All Business Rules are enforced
- [ ] All API endpoints return correct responses
- [ ] All UI screens match the Specification's user flow
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No linter or type errors
- [ ] Code follows project conventions

---

## PHASE 3: Integration and Testing

> Connect everything, run comprehensive tests, verify acceptance criteria.

### Step 3.1: End-to-End Integration

1. Test the full flow: UI → API → Service → Database → Response → UI
2. Verify data flows correctly through all layers
3. Test with realistic data (not just trivial examples)
4. Verify error handling works end-to-end

### Step 3.2: Acceptance Criteria Verification

Go through EVERY acceptance criterion from the Specification:

For each criterion:
1. Execute the test scenario described
2. Verify the expected outcome
3. Record PASS or FAIL
4. If FAIL: fix the implementation and re-test

**All acceptance criteria must pass before proceeding.**

### Step 3.3: Constitution Compliance Check

Verify against every Constitution Hard Constraint:

| Constraint | How to Verify |
|------------|--------------|
| Performance thresholds | Run performance tests / measure response times |
| Security requirements | Check auth, input validation, data exposure |
| Accessibility standards | Run accessibility audit (axe, lighthouse) |
| Data handling rules | Verify PII handling, retention, encryption |
| Third-party restrictions | Verify no unauthorized external calls |

### Step 3.4: Non-Functional Requirements Verification

Test each NFR from the Specification:
- Page load time targets
- Availability expectations
- Browser/device compatibility
- Concurrent user handling

### Quality Gate: Testing Complete

Before moving on, verify:
- [ ] All acceptance criteria pass
- [ ] All Constitution Hard Constraints verified
- [ ] All Non-Functional Requirements met
- [ ] No regressions in existing functionality
- [ ] Test coverage meets project standards

---

## PHASE 4: Code Review and Polish

> Clean up, document, and prepare for delivery.

### Step 4.1: Code Review Checklist

Review all code changes against this checklist:

**Correctness**
- [ ] All requirements implemented as specified
- [ ] Edge cases handled
- [ ] Error messages are user-friendly and actionable

**Quality**
- [ ] No dead code, commented-out code, or TODOs left behind
- [ ] No hardcoded values that should be configurable
- [ ] No secrets or credentials in code
- [ ] Console.log / debug statements removed
- [ ] Type safety (no type assertions unless justified)

**Performance**
- [ ] No N+1 queries
- [ ] Database queries are indexed appropriately
- [ ] No unnecessary re-renders (if frontend)
- [ ] Large lists are paginated or virtualized

**Security**
- [ ] All inputs validated and sanitized
- [ ] Authentication checked on protected routes
- [ ] Authorization checked (users can only access their own data)
- [ ] No SQL injection, XSS, or CSRF vulnerabilities
- [ ] Rate limiting on sensitive endpoints

**Maintainability**
- [ ] Code is self-documenting (clear names, small functions)
- [ ] Complex logic has comments explaining WHY (not what)
- [ ] Tests are readable and test behavior (not implementation)

### Step 4.2: Documentation Updates

1. Update any README or developer docs affected by the feature
2. Add inline documentation for public APIs
3. Update environment variable documentation if new vars were added
4. If the feature adds CLI commands, update usage docs

### Step 4.3: Update Task and Plan Status

1. Mark all completed tasks as "Done" in their task files
2. Update the Task Index statuses
3. Mark completed Plan phases as "Complete"
4. Add log entries to each task with completion notes

---

## PHASE 5: Deployment

> Ship it safely.

### Step 5.1: Pre-Deployment Checklist

- [ ] All tests pass in CI
- [ ] No linter or type errors
- [ ] Database migrations are reversible (or have a rollback plan)
- [ ] Environment variables are set in the deployment environment
- [ ] Feature flags are in place (if using gradual rollout)
- [ ] Monitoring/alerting is configured for new endpoints

### Step 5.2: Deploy

Follow the project's deployment conventions:
1. If CI/CD exists, push and let the pipeline handle it
2. If manual, follow the project's documented deployment steps
3. Run post-deployment smoke tests

### Step 5.3: Post-Deployment Verification

1. Verify the feature works in production/staging
2. Check monitoring for errors
3. Run the acceptance criteria against the deployed version
4. Verify performance meets NFR targets in the real environment

### Step 5.4: Finalize

1. Update Plan status to "Complete"
2. Run the `validate-compliance` skill for a final audit
3. Present completion summary to the user

---

## Implementation Principles

These apply throughout ALL phases:

1. **Constitution is law.** If you're about to write code that violates a Hard Constraint, STOP and flag it.
2. **Specification is truth.** If the Specification says field X is required, it is required. Don't guess.
3. **Match the codebase.** Follow existing patterns. Don't introduce new conventions without discussing with the user.
4. **Fail loud, fail early.** Validate inputs at boundaries. Throw meaningful errors. Never swallow exceptions silently.
5. **Test as you go.** Don't save all testing for the end. Write tests alongside implementation.
6. **Ship incrementally.** Each phase should produce working code. Don't build everything at once and hope it works.
7. **Ask when uncertain.** If a requirement is ambiguous, ask the user. Don't assume.

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Feature documents missing | List what's missing. Suggest the appropriate creation skill |
| Tech stack not recognized | Ask user to describe the tech stack and project conventions |
| Specification is ambiguous | Stop. Ask user to clarify before implementing |
| Test failures during implementation | Fix immediately. Do not proceed with failing tests |
| Constitution violation detected | Stop. Flag the specific constraint. Ask user how to proceed |
| Dependency conflict | Present the conflict. Ask user to choose: update dependency, find alternative, or adjust specification |
| Deployment failure | Roll back. Diagnose. Fix. Re-deploy |
| User wants to skip a phase | Warn about risks. Allow skip but document what was skipped |

---

## Progress Tracking

Use the TodoWrite tool throughout to give the user visibility:

```
Phase 0: Discovery       [completed]
Phase 1: Scaffolding     [completed]
Phase 2: Core            [in_progress]
  - Data access layer    [completed]
  - Business logic       [in_progress]
  - API layer            [pending]
  - UI layer             [pending]
Phase 3: Testing         [pending]
Phase 4: Review          [pending]
Phase 5: Deployment      [pending]
```

Update after every meaningful step. The user should always know where you are.

---

## Related Skills

| Skill | Relationship |
|-------|-------------|
| `bootstrap-feature` | Creates the documents this skill reads |
| `execute-plan` | Alternative: orchestrates tasks only, no architecture guidance |
| `execute-task` | This skill may delegate individual tasks here |
| `validate-compliance` | Called during Phase 3 and Phase 5 for compliance checks |
| `create-tasks` | If tasks don't exist, create them before this skill runs |
