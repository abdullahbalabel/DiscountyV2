---
name: clarify-docs
description: Interactive Q&A skill that reviews existing feature documents for gaps, ambiguities, and missing details, then asks the user targeted clarifying questions to fill them. After gathering answers, it delegates to the appropriate skill (create-constitution, create-specification, create-plan, create-tasks, create-prompt) to apply the changes. Acts as the quality gatekeeper for document completeness before implementation begins. Trigger with "clarify docs", "review the docs", "what's missing", "refine documents", or "check document quality for [feature]".
---

## What I Do

I am the **document quality gatekeeper**. I read a feature's existing documents, analyze them for gaps, ambiguities, vague language, missing sections, and inconsistencies, then run an interactive Q&A session with the user to resolve every issue. Once I have answers, I delegate to the correct creation/modification skill to update the actual documents.

Think of me as the senior reviewer who reads everything, asks the hard questions, and makes sure the docs are solid before anyone writes code.

## When To Use Me

- Before starting implementation (pre-flight document quality check)
- After bootstrapping a feature (to tighten up the initial drafts)
- When the user says "clarify docs", "review the docs", "what's missing", "refine documents"
- When the user has a vague idea and wants to sharpen it into precise documents
- When a document was created quickly and needs a thorough review
- When `implement-feature` or `execute-plan` hits an ambiguity and needs docs clarified first

## Inputs Required

1. **Feature ID** -- required
2. **Scope** -- optional: "all" (review everything) or a specific document type ("constitution", "specification", "plan", "tasks", "prompts")

---

## PHASE 1: Document Discovery and Reading

### Step 1.1: Find All Feature Documents

Scan for every document related to the feature:

```
Docs/Constitutions/Constitution-{Feature-ID}.md
Docs/Specifications/Specification-{Feature-ID}.md
Docs/Plans/Plan-{Feature-ID}.md
Docs/Tasks/Task-{Feature-ID}-T*.md
Docs/Tasks/Task-Index-{Feature-ID}.md
Docs/Prompts/Prompt-{Feature-ID}-*.md
```

Report what exists and what is missing:

```
## Documents Found for {Feature-ID}:
- [x] Constitution
- [x] Specification
- [ ] Plan           ← MISSING
- [ ] Tasks          ← MISSING
- [ ] Prompts        ← MISSING
```

If critical documents are missing entirely (not just incomplete), note them for later -- the user may need to create them first.

### Step 1.2: Read Every Existing Document

Read each document fully. For every document, build an **issue list** by running the analysis checks in Phase 2.

---

## PHASE 2: Analysis -- What to Look For

Run these checks against each document type. Every issue found becomes a clarifying question for the user.

### 2.1: Constitution Analysis

| Check | What to Look For | Example Issue |
|-------|-----------------|---------------|
| **Empty principles** | Guiding Principles section has fewer than 2 entries | "Only 1 principle listed -- what other core rules govern this feature?" |
| **Vague principles** | Principle uses words like "should", "try to", "ideally" | "Principle says 'should be fast' -- what is the exact performance threshold?" |
| **Missing constraints** | Hard Constraints table is empty or has only 1 entry | "No hard constraints defined -- are there any technical limits, performance targets, or restrictions?" |
| **Constraint without reason** | A constraint row has an empty Reason column | "HC-02 says 'Max 100 items per page' -- what is the reason for this limit?" |
| **Empty boundaries** | Boundaries / Out of Scope section is empty | "What does this feature explicitly NOT do? What adjacent features should we avoid touching?" |
| **No dependencies listed** | Dependencies & Assumptions section is empty | "What does this feature depend on? (auth, database, external APIs, other features)" |
| **No compliance standards** | Compliance section is empty or says N/A | "Are there any compliance requirements? (WCAG accessibility, GDPR, security policies)" |
| **Placeholder text** | Any `[brackets]` or `YYYY-MM-DD` remain | "Unresolved placeholders found -- need actual values" |

### 2.2: Specification Analysis

| Check | What to Look For | Example Issue |
|-------|-----------------|---------------|
| **No overview** | Overview section is empty or single sentence | "The overview is vague -- who exactly uses this feature and what problem does it solve for them?" |
| **Vague requirements** | FR description uses words like "handle", "manage", "support" without specifics | "FR-03 says 'Handle payments' -- what exactly? Create charges? Process refunds? Show invoices?" |
| **Missing priorities** | Any FR has no priority assigned | "FR-05 has no priority -- is it Must Have, Should Have, or Could Have?" |
| **No Must Haves** | Zero requirements marked Must Have | "No Must Have requirements -- which requirements are absolutely essential for launch?" |
| **Incomplete data model** | Entity has no fields, or fields have no types | "Entity 'Discount' has field 'value' -- what type? number? string? What are the constraints?" |
| **Missing relationships** | Data model has entities but no relationships defined | "How do these entities relate? Does a User have many Discounts? Does a Discount belong to a Campaign?" |
| **Vague API endpoints** | Endpoint description says "manage resource" without specifics | "PUT /api/v1/discount/:id -- what fields can be updated? What validation applies?" |
| **No acceptance criteria** | Acceptance Criteria section is empty | "How do we know this feature is done? What are the testable conditions?" |
| **Untestable criteria** | Acceptance criterion uses "should work well" or "should be fast" | "Criterion says 'should perform well' -- what is the specific measurable target?" |
| **Empty business rules** | No business rules defined | "What rules govern this feature? (limits, permissions, validation, error handling)" |
| **Missing UI details** | UI section says "TBD" or lists screens with no user flow | "Screen 'Discount List' is mentioned but no user flow -- what can the user do on this screen?" |
| **NFR without target** | Non-functional requirement has no measurable target | "NFR-01 says 'fast load time' -- what is the target in seconds?" |

### 2.3: Plan Analysis

| Check | What to Look For | Example Issue |
|-------|-----------------|---------------|
| **No objective** | Objective section is empty | "What is the goal of this implementation plan in 1-2 sentences?" |
| **No approach** | Approach/Strategy is empty | "What is the high-level technical approach? What architecture pattern or framework?" |
| **Phases without descriptions** | Phase row has a name but empty description | "Phase 2 is named but has no description -- what work happens in this phase?" |
| **No dates** | All target dates are YYYY-MM-DD | "What are the target dates for each phase? Or at least the final deadline?" |
| **Requirement not covered** | A Must Have FR from the Specification has no corresponding phase | "FR-01 (Must Have) is not assigned to any phase -- when will it be built?" |
| **No risks** | Risks section is empty | "What could go wrong? (technical risks, dependencies, timeline, scope)" |
| **No success criteria** | Success Criteria section is empty | "Beyond passing tests, how do we measure success?" |
| **Missing resources** | Resource Requirements is empty | "What people, tools, and budget are needed?" |

### 2.4: Task Analysis

| Check | What to Look For | Example Issue |
|-------|-----------------|---------------|
| **Vague description** | Task description is fewer than 2 sentences | "Task T03 says 'Implement service' -- which service? What does it do specifically?" |
| **No acceptance criteria** | Task has zero acceptance criteria | "How do we know Task T05 is done? What must be true?" |
| **No subtask steps** | Steps/Subtasks section is empty | "Task T07 has no steps -- what are the concrete implementation steps?" |
| **Missing dependencies** | Task has no Blocked By or Blocks entries when it clearly should | "Task T04 implements the API but Task T02 creates the database -- shouldn't T04 be blocked by T02?" |
| **No testing defined** | Testing section is empty | "How should Task T06 be tested? Unit tests? Integration? Manual?" |
| **Missing parent references** | Task doesn't link to a Specification requirement | "Task T08 doesn't trace to any FR -- which requirement does it implement?" |
| **Orphan task** | Task doesn't belong to any Plan phase | "Task T09 is not assigned to a phase -- where does it fit in the plan?" |

### 2.5: Prompt Analysis

| Check | What to Look For | Example Issue |
|-------|-----------------|---------------|
| **No guardrails** | Guardrails section is empty | "What restrictions should this prompt follow? (output limits, PII handling, content rules)" |
| **No variables** | Input Variables table is empty | "What inputs does this prompt need? What data does it operate on?" |
| **No examples** | Examples section is empty | "Can you provide a sample input and what the expected output should look like?" |
| **Missing output format** | Expected Output Format is empty | "What format should the output be in? (JSON, markdown, code, plain text)" |

### 2.6: Cross-Document Consistency

| Check | What to Look For | Example Issue |
|-------|-----------------|---------------|
| **Spec violates Constitution** | A requirement contradicts a Hard Constraint | "FR-04 requires tracking user behavior but HC-03 says 'No third-party tracking' -- which takes precedence?" |
| **Plan misses requirements** | Must Have requirement not in any phase | "FR-01 is Must Have but no plan phase covers it" |
| **Task traces broken** | Task references a requirement ID that doesn't exist in the Spec | "Task T03 references FR-09 but the Specification only goes up to FR-07" |
| **Business rule conflict** | A business rule contradicts another | "Rule says 'max 50% discount' but another says 'admins can set any discount amount'" |
| **Broken links** | Related Documents table points to template files instead of actual feature files | "Constitution's Related Documents still links to 'Specification-Template.md' instead of 'Specification-Feature-001.md'" |

---

## PHASE 3: Interactive Q&A Session

### Step 3.1: Prioritize Issues

Sort all found issues by severity:

1. **Blockers** -- Missing documents, empty critical sections, contradictions between documents
2. **Gaps** -- Empty optional sections, vague language, missing details
3. **Polish** -- Placeholder text, broken links, formatting issues

### Step 3.2: Present the Issue Summary

Show the user a high-level summary first:

```
## Document Quality Report: {Feature-ID}

### Issues Found: {total}
- Blockers: {N} (must resolve before implementation)
- Gaps: {N} (should resolve for clarity)
- Polish: {N} (nice to fix)

### By Document:
- Constitution: {N} issues
- Specification: {N} issues
- Plan: {N} issues
- Tasks: {N} issues
- Prompts: {N} issues
- Cross-document: {N} issues

Shall I walk through them one by one?
```

### Step 3.3: Ask Questions One by One

For each issue, starting with Blockers:

1. **State the problem clearly:**
   > "In the Specification, FR-03 says 'Handle payments' but doesn't specify what that means."

2. **Explain why it matters:**
   > "Without specifics, the developer won't know whether to implement payment creation, refund processing, or invoice generation."

3. **Ask a targeted question:**
   > "What payment operations does this feature need to support? For example: create charges, process refunds, generate invoices, list payment history?"

4. **Record the user's answer.**

5. **If the answer raises new questions, ask follow-ups immediately:**
   > User: "We need to create charges and process refunds."
   > Follow-up: "For refunds -- full refunds only, or also partial refunds? Should there be a time limit for requesting a refund?"

**Questioning rules:**
- Ask ONE focused question at a time. Do not dump 10 questions at once.
- Group related questions together (all Specification issues, then Plan issues, etc.)
- If the user says "I don't know yet" or "TBD", mark it as unresolved and move on. Do not block the session.
- If the user wants to skip a category, allow it. Note what was skipped.

### Step 3.4: Confirm Understanding

After completing a document's questions, summarize back:

> "Based on your answers, here's what I'll update in the Specification:
> - FR-03: Change to 'User can create one-time charges via Stripe Checkout'
> - FR-04 (new): 'User can request a full refund within 30 days'
> - Business Rule: 'Partial refunds are not supported in v1'
> - Acceptance Criteria: Add 2 new criteria for payment and refund flows
>
> Does this look correct?"

Wait for confirmation before proceeding to updates.

---

## PHASE 4: Delegate Modifications

### Step 4.1: Determine Which Skills to Call

Based on the answers collected, map changes to skills:

| Changes Needed | Skill to Call |
|---------------|---------------|
| Constitution principles, constraints, boundaries | `create-constitution` (in update mode) |
| Specification requirements, data model, API, business rules, acceptance criteria | `create-specification` (in update mode) |
| Plan phases, risks, timeline, resources | `create-plan` (in update mode) |
| Task descriptions, acceptance criteria, steps, dependencies | `create-tasks` (in update mode) |
| Prompt guardrails, variables, examples | `create-prompt` (in update mode) |

### Step 4.2: Apply Changes Document by Document

For each document that needs changes:

1. **Read the current document**
2. **Apply the specific changes** from the Q&A answers -- do not rewrite sections that were fine
3. **Update the Revision History** with a new version entry noting what changed
4. **Update the `Last Updated` date** in the metadata
5. **Bump the version** (e.g., 1.0 → 1.1 for minor clarifications, 2.0 for significant changes)
6. **Save the file**

**Critical rule:** Only modify what the Q&A identified. Do not rewrite content that was already clear and complete.

### Step 4.3: Fix Cross-References

After modifying documents, verify:
- Related Documents tables still have correct paths
- Links to specific sections (anchors) are still valid
- If a requirement ID was added or renumbered, update all documents that reference it

### Step 4.4: Handle Cascading Changes

Some changes cascade across documents:

| Change | Cascade To |
|--------|-----------|
| New Hard Constraint added to Constitution | Check Specification for compliance, update Plan risks |
| New Functional Requirement added to Specification | Add to Plan phase, create new Task(s) |
| Requirement removed from Specification | Remove from Plan phase, mark related Tasks as cancelled |
| Phase added to Plan | May need new Tasks generated |
| Business Rule changed | Update related Prompts guardrails, Task acceptance criteria |

For each cascade:
1. Identify affected documents
2. Explain the cascade to the user
3. Apply the downstream changes
4. Re-verify cross-document consistency

---

## PHASE 5: Final Report

### Step 5.1: Present the Change Summary

```
## Clarification Complete: {Feature-ID}

### Changes Applied:
| Document | Changes | Version |
|----------|---------|---------|
| Constitution | Added HC-04, clarified Principle 2 | 1.0 → 1.1 |
| Specification | Updated FR-03, added FR-08, added 3 acceptance criteria | 1.0 → 1.2 |
| Plan | Added Phase 3a for payment integration | 1.0 → 1.1 |
| Tasks | Created T09, T10; updated T03 description | -- |
| Prompts | No changes | 1.0 |

### Unresolved Items:
- {list any items the user marked as TBD}

### Issues Remaining:
- Blockers: {N} (should be 0)
- Gaps: {N}
- Polish: {N}

### Recommendation:
{If blockers remain: "Resolve the remaining blockers before implementation."}
{If clean: "Documents are implementation-ready. Use `implement-feature` to start building."}
```

### Step 5.2: Offer Next Steps

Based on the state of the documents, suggest:
- If all clean → `implement-feature` or `execute-plan`
- If unresolved TBDs → schedule a follow-up `clarify-docs` session later
- If documents are missing → appropriate `create-*` skill
- If compliance is uncertain → `validate-compliance`

---

## Error Handling

| Situation | Action |
|-----------|--------|
| No documents exist for the feature | Cannot clarify nothing. Suggest `bootstrap-feature` to create them |
| Only Constitution exists | Review what exists. Suggest creating the remaining documents |
| User answers "I don't know" to everything | Mark all as TBD. Suggest the user think about it and return later |
| Cascading change creates a contradiction | Stop. Present the contradiction. Ask user to choose which takes precedence |
| User disagrees with an identified issue | Accept. Not all issues require action -- the user knows their domain |
| Document is too large to review in one session | Offer to scope: review one document at a time |

---

## Questioning Principles

1. **One question at a time.** Never overwhelm with a list of 10 questions.
2. **Start with blockers.** Resolve the critical issues first.
3. **Be specific.** "What payment operations?" not "Can you tell me more about payments?"
4. **Offer options when possible.** "Should this be: (a) percentage only, (b) flat amount only, or (c) both?" is better than "What type of discount?"
5. **Explain why you're asking.** The user should understand why the question matters.
6. **Accept uncertainty.** "TBD" is a valid answer. Don't force decisions.
7. **Follow up immediately.** If an answer opens new questions, ask them now while the context is fresh.
8. **Summarize before acting.** Always confirm your understanding before modifying documents.
