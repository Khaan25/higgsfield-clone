# CAPTURE-TEST

## 1. Tool and model
- Tool: Claude Code 2.1.296, used from the Claude desktop app (Code tab); headless tests used the `claude -p` CLI.
- Model: Claude Opus 5.5 (`claude-opus-5-5`), which both plans and executes. Pinned in `.claude/settings.json` (`"model": "claude-opus-5-5"`).
- Automatic mechanism: yes. Claude Code hooks: `UserPromptSubmit` (fires on every prompt) and `Stop` (fires at end of every turn).

## 2. Mechanism and config file
- Config file changed: `.claude/settings.json` (project-level, committed).
  - `UserPromptSubmit` → `python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/capture.py" prompt`
  - `Stop` → `python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/capture.py" response`
- Script: `.claude/hooks/capture.py`.
  - The prompt hook buffers the verbatim prompt with its UTC timestamp.
  - The Stop hook takes the final reply from the hook input's `last_assistant_message`. It reads the model that answered from the session transcript, because no hook input carries a model name. It then appends the PROMPT and RESPONSE entries and rewrites the front matter (`total_exchanges`, `last_prompt_time`, `model`).
  - Thinking and tool calls are not captured.
- Before writing the script, I checked the real hook inputs by dumping stdin from a throwaway headless session:
  - `SessionStart` has no `model`.
  - `UserPromptSubmit` has `prompt`.
  - `Stop` has `last_assistant_message`.

## 3. Log path(s)
- Canary 1: `.agent-logs/2026-10-14_10-47-32_329a0438-a9f3-415b-8783-1dbb6137a320.md`
- Canary 2: `.agent-logs/2026-10-14_10-47-34_3c7de566-2414-4bb0-8d08-741f823144ac.md`
- Both canary sessions were started by the desktop app inside git worktrees (`.claude/worktrees/capture-test-8x-assignment-*`). The logs still landed in the main checkout's `.agent-logs/`, because the hook path resolves via `$CLAUDE_PROJECT_DIR`.

## 4. Canary entries (raw)

### Session `329a0438`

```text
[LOG_ENTRY type=PROMPT num=1 session=329a0438]
timestamp: 2026-10-14T10:47:32.729Z
model: claude-opus-5-5

<system-reminder>
You are operating in a git worktree.
Worktree path: /Users/ziaurrehmankhan/code/experiments/higgsfield-clone/.claude/worktrees/capture-test-8x-assignment-312f70
Worktree name: capture-test-8x-assignment-312f70
</system-reminder>


CAPTURE TEST — 8x assignment, Zia ur Rehman Khan.


[LOG_ENTRY type=RESPONSE num=1 session=329a0438]
timestamp: 2026-10-14T10:47:43.654Z
model: claude-opus-5-5

Got your capture test, Zia: "8x assignment".

I couldn't confirm the hooks logged this session. This worktree's `.agent-logs/` has 4 files, and the newest is from another session (`fc3f32f2`, the "reply OK" test at 10:29). Nothing from this session is there yet.

The hooks may write to the main checkout's `.agent-logs/` instead of the worktree's. The Stop hook also won't have run, because this reply isn't finished yet. Want me to look in the main repo's log folder?
```

### Session `3c7de566`

```text
[LOG_ENTRY type=PROMPT num=1 session=3c7de566]
timestamp: 2026-10-14T10:47:34.195Z
model: claude-opus-5-5

<system-reminder>
You are operating in a git worktree.
Worktree path: /Users/ziaurrehmankhan/code/experiments/higgsfield-clone/.claude/worktrees/capture-test-8x-assignment-dfa17e
Worktree name: capture-test-8x-assignment-dfa17e
</system-reminder>


CAPTURE TEST — 8x assignment, Zia ur Rehman Khan.


[LOG_ENTRY type=RESPONSE num=1 session=3c7de566]
timestamp: 2026-10-14T10:47:43.027Z
model: claude-opus-5-5

I got your canary. This session is one of the two new Code sessions the M0 capture gate is waiting on.

When this turn ends, the Stop hook should write an entry for this session to `.agent-logs/`, marked with "CAPTURE TEST — 8x assignment" and author "Zia ur Rehman Khan". I didn't change anything else here.

Once the second canary session is done, go back to the main M0 session. It will find both entries, write `CAPTURE-TEST.md`, update `.gitignore` and commit.
```

## 5. What did not work / caveats
- **Pre-hook session `3e173f7d`:** a canary was sent at 10:03 UTC, before any hook existed, so it was never captured. There is no log file for it.
- **The setup session's first prompt is missing.** In setup session `3b45ddd5`, the first prompt (the pasted setup instructions) predates the hook install, so it is not logged. The hooks loaded mid-session without a restart. The first logged entry is therefore a RESPONSE with `num=0`, which has no matching prompt.
- **Sonnet session `44d9c3f6`:** a deliberate headless test run with `--model sonnet`. It checks that the `model:` field reflects the model that actually answered, so a mid-build switch would be visible. It is kept rather than deleted, per the no-deletion rule. Afterwards the project model was pinned to Opus, and test session `fc3f32f2` confirms new sessions log `claude-opus-5-5`.
- **App-injected text in the prompts.** The desktop app prepends a `<system-reminder>` (worktree notice) to the prompt text it passes to the hook, so it appears in the canary prompts above. It is logged verbatim rather than stripped.
- **Author change.** The author was changed from `Khaan25` to `Zia ur Rehman Khan` before the canaries were sent. Earlier session files keep their original author; no entries were edited.
- **Agent self-check is not authoritative.** The canary session `329a0438` reported that it could not find its own log. That reply was written before its own Stop hook ran, and it looked in the worktree's `.agent-logs/` instead of the main checkout's. The entry is present, as shown above.
