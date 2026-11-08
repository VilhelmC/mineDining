# Continuation prompt — TEMPLATE

*The house format for a continuation prompt. Copy this file, do not edit it. Governed by `PROJECT-INSTRUCTIONS.md` THREAD DISCIPLINE.*

---

## The failure this is built against

A prompt is a photograph of a moment. It is written at hand-off — when its author knows most about the work and least about what will happen to it. Then the thread does the work, and every sentence that described *the work not yet done* quietly becomes false. The next session pastes the prompt, believes it, and spends an hour finding out.

Checking that the read-first list still resolves does not catch this: the paths usually still exist. What changes is the **claims** ("there is no X yet"). So each prompt names **the one sentence that would tell you it has expired.**

---

## The name line — the very first line of the pasted text

```
NAME THIS CONVERSATION: <C-KEY> · <short scope>
```

Conversation titles are generated from the opening message, and no session can rename itself — so this is the only moment the name can be set. Result: **one key in three places** — conversation title, prompt filename (`C-KEY_scope.md`), `LEDGER.md` §1 row. Key first, because a sidebar truncates from the right. Add it to every prompt you open; it asserts nothing, so it never goes stale.

## The status block — straight after the name line

```
PROMPT STATUS. Written <date> · thread <C-KEY> · purpose: COMMISSION | CONTINUE | CLOSE
UPDATED <date> · <C-KEY> · <session link> — <one clause: what changed>
  (one line per edit, newest first)
Last verified <date> by <C-KEY>.
FALSIFIER: "<one sentence TRUE today and FALSE if this prompt has expired>".
Check it first. If it is false, STOP and rewrite this prompt before doing the work.
```

**A good falsifier** is one checkable sentence, checkable in ten seconds from the file tree or one command, false the moment the premise stops holding.

| Weak | Strong | Why |
|---|---|---|
| "The analysis is in progress." | "`analysis/` holds 3 notebooks and no `results.md`." | When `results.md` exists, the commission is done |
| "See the draft." | "`paper_v4.md` is the newest draft and has no review file." | A review appearing changes the task |
| "Several open questions remain." | "`paper_v4_questions.md` Q1–Q3 have no answers under them." | Answers are the event the thread waits for |

**Numbers appear once** — in the falsifier. Everything else refers to it. Prefer counts that do not move with the calendar.

**Purpose matters as much as date.** A COMMISSION prompt expires when the work is done; a CONTINUE prompt runs long; a CLOSE prompt records a finished thread and what remains.

---

## The house format, after the status block

1. **What this conversation owns** — thread key, ledger rows, folders. Paths relative to the project root.
2. **WHAT EXISTS** — the state of the work *now*. This section goes stale first; the falsifier usually points at it.
3. **READ FIRST, in order** — each item with a clause saying *why*, so the list can be pruned.
4. **INBOX** — anything other threads handed over, written out well enough to act on, not merely referenced.
5. **Decisions this inherits** — with "do not relitigate" where meant.
6. **Open tasks, in order** — with the reason for the order where not obvious.
7. **Constraints** — the ones a hurried session drops, quoted verbatim.
8. **Where this touches other threads** — contacts go in the ledger row, not worked by both.
9. **FIRST MOVE** — one concrete action. Where possible, the first move *is* the falsifier check.
10. **LEDGER**, **PROMPT** and **GIT** — the standing end-of-session lines.

Then, outside the pasted block: **Why this shape** (what changed since the last version and what was deliberately kept — stops the next rewrite relitigating it), and a **Revisions** table, newest first.

---

## The rules that keep it true

**1 · Close the loop in the same session.** A session that finishes the work a prompt commissioned updates or supersedes it **before finishing**. Superseding: a new prompt named for its thread, a banner copy of the old in `OBSOLETE/`, both §1b rows updated, and a line in the hand-back asking the owner to delete the original.

**2 · Stamp it when you start it.** Whoever starts a thread checks the falsifier and writes today's date into the prompt's **Last verified** cell in `LEDGER.md` §1b.

**3 · Every edit is stamped and swept.** Any session that edits a prompt: (a) adds an UPDATED line; (b) re-reads the **whole** prompt and rewrites in place every claim the edit made false — never a "DONE" note below a sentence that still says the opposite; (c) re-measures the falsifier; (d) adds a Revisions row; (e) updates the §1b row.

**4 · Read it cold before handing it over.** A new prompt, a superseding prompt, or an edit to READ FIRST, OPEN TASKS, FIRST MOVE, decisions or falsifier is tested by a fresh agent that has not seen the conversation: it reads the block and the READ FIRST files and says what it would do and where it would have to guess. Every gap is fixed in the prompt or the document it belongs in; the result goes into the Revisions row and the §1b cell "Sufficient to start cold?". The session that starts from the prompt is the next cold reader and fixes what it had to guess.

---

## Skeleton — copy from here

````markdown
# Continuation prompt — <scope>

*Start a new conversation with `start <C-KEY> in <project root>` — the thread reads this file — or paste the block below as its opening message. Self-contained. Written <date> by <C-KEY>. Ledger rows <ids>.*

---

## Paste this

```
NAME THIS CONVERSATION: <C-KEY> · <short scope>

PROMPT STATUS. Written <date> · thread <C-KEY> · purpose: COMMISSION
Last verified <date> by <C-KEY>.
FALSIFIER: "<...>". If false, STOP and rewrite.

OWNS: <rows, folders>.

WHAT EXISTS (paths relative to the project root):
  - ...

READ FIRST, in order:
  1. PROJECT-STATE.md — orientation.
  2. LEDGER.md rows <ids> — current state.
  3. <doc> — <why>.

INBOX: ...

DECISIONS INHERITED (do not relitigate): ...

OPEN TASKS, in order:
  1. ...

CONSTRAINTS: ...

TOUCHES: <other threads> — note contacts in the ledger row.

FIRST MOVE: check the falsifier, then <one action>.

LEDGER. Before finishing: entry at the TOP of LEDGER-LOG.md; rows <ids>; §1b.
PROMPT. Every edit to this prompt is stamped and swept (_TEMPLATE.md rule 3).
GIT. Owner commits at the end of every session; never `git stash`.
```

---

## Why this shape

<...>

## Revisions

| Date | Thread | Session | What changed |
|---|---|---|---|
| <date> | <C-KEY> | [session](<link>) | Written. |
````
