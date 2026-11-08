# LEDGER-LOG

*What happened, session by session. **Append-only, newest first** — never edit an entry; write a new one that corrects it. Marked `merge=union` in `.gitattributes`, so entries written on two machines the same day both survive. State lives in `LEDGER.md`; this file is history.*

**Entry format.**

```
### YYYY-MM-DD · C-KEY · <short title>
[session](<conversation link>)

- **Wrote:** files created or changed, with paths.
- **Rows:** ledger rows touched and their new state.
- **Decisions:** taken or opened (and added to §3).
- **Answers acted on:** ANSWERS.md entries, by heading.
- **Prompts:** written / updated / verified / superseded.
- **Next:** the one thing the next session on this thread should do.
```

---

### 2026-11-08 · C-SETUP · Design brief, decisions, C-ARCH commissioned
[session](https://claude.ai/code/session_01WGDGhYqkmSvqNPDEVbbK8L)

- **Wrote:** `docs/DESIGN-BRIEF.md` (new); `PROJECT-STATE.md` §1–§5, §7; `LEDGER.md` §1, §1b, §2, §3; `TODO.md`; `Continuation_Prompts/C-ARCH_schema-and-architecture.md` (new).
- **Rows:** A-1 `done`; A-2..A-6 `specified` [cp]; backlog B-1..B-6 added.
- **Decisions:** taken — recipe as DAG; DAG as standalone versioned spec with validator; spec revisions expected (versioned + migrations); links first; phone > iPad > laptop. Opened — platform (PWA vs RN), spec language.
- **Answers acted on:** none.
- **Prompts:** C-ARCH written; cold-read 2026-11-08: 9 gaps, fixed.
- **Next:** Vilhelm commits; open C-ARCH with `start C-ARCH in <project root>`.

### 2026-11-08 · C-SETUP · Project scaffolded

- **Wrote:** `PROJECT-INSTRUCTIONS.md`, `PROJECT-STATE.md`, `LEDGER.md`, `LEDGER-LOG.md`, `ANSWERS.md`, `TODO.md`, `WORK-PLAN.md`, `Continuation_Prompts/_TEMPLATE.md`, `.gitattributes`, `.gitignore`.
- **Next:** paste the block in `PROJECT-INSTRUCTIONS.md` into the Claude project's Instructions field; commit; fill `PROJECT-STATE.md`.
