# Handoff prompt for the next agent

Used when the owner asks for an onboarding prompt for a new session. Owner's standard, distilled from real prompts.

## Delivery

- In chat, as one ```text block (wrap in four backticks if it contains code blocks). **Not a file**, unless the owner asks for one.
- Always the full text, never a diff against a previous prompt. At most one line before the block; 1–3 lines after it about what changed since the last version.
- Usually 4–8k characters. Do not retell AGENTS.md or docs: give the path and what to look for there.
- Written in the owner's chat language (Russian); code, commits, PRs stay in English.

## Verify facts first (never from memory)

- `git status`, current branch, last commit, unpushed commits, open PRs/MRs with numbers.
- Write "deployed" / "merged" only after checking; otherwise "not verified".
- If the owner said "push/merge and give me the prompt", do that first and describe the resulting state.

## Structure (in this order)

1. **Role and project:** who the agent is, what the product is in one sentence, absolute repo paths. "Отвечай по-русски, коротко, по делу."
2. **Context:** product, stack, repos and what lives where, production in brief (server, how it deploys).
3. **State on <date>:** branch and commit, what is done, open PRs, what is applied where (migrations, flags), known unfixed issues.
4. **Read first, in order:** AGENTS.md, docs/agents/memory.md, docs/architecture.md, docs/decisions.md, current `docs/tasks/*.md`, plans; for each, what to look for.
5. **Work rules:** commit/push/merge only on the owner's word (same branch and PR if work continues); production is read-only without an explicit "do it"; which repos are read-only; how to run the stack locally; checks before a PR (TDD if adopted).
6. **Known pitfalls:** what broke before and how not to break it again.
7. **Task:** what is next. In "study and wait" mode, no implementation instructions.
8. **Skills** by name, as slash commands (other agents invoke them their own way): everything the owner named in the session plus what the stack and process need (`/superpowers:...`, `/context7`, `/caveman`, ...). Not just one; if unsure add `/find-skills`.
9. **First steps and report:** "study, report what you understood, ask questions, wait for the command."

## Mode of the next agent

- Default: study only. The plan is the second step, when the owner says so.
- If the owner said "plan and implement": study → plan → wait for plan approval → implement with TDD.
- If the agent works in another role or repo (backend, mobile): state its boundaries and what it must return (e.g. a short report for this session).

## Never

- Secrets (tokens, passwords, keys, cookies): say where they live instead.
- Details the owner asked not to mention.
- Claims that were not verified.
