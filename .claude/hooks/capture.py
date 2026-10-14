#!/usr/bin/env python3
"""Append prompt/response pairs to .agent-logs/<start>_<session>.md.

Wired in .claude/settings.json:
  UserPromptSubmit -> capture.py prompt    (buffers prompt + its UTC timestamp)
  Stop             -> capture.py response  (writes PROMPT + RESPONSE with the model that answered)

The prompt is buffered rather than written immediately because hook inputs carry no model
name; the model is read from the transcript once the turn has produced an assistant message.
A buffered prompt whose turn never reached Stop (interrupted) is flushed by the next prompt.
"""
import json, os, re, sys, tempfile, time
from datetime import datetime, timezone

AUTHOR, TOOL = "Khaan25", "claude-code"
PENDING_DIR = os.path.join(tempfile.gettempdir(), "agent-capture")


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def last_model(transcript, wait=False):
    # Stop can fire before the transcript is flushed; poll briefly for an assistant entry.
    for _ in range(10 if wait else 1):
        model = None
        try:
            with open(transcript) as f:
                for line in f:
                    try:
                        e = json.loads(line)
                    except ValueError:
                        continue
                    m = e.get("type") == "assistant" and (e.get("message") or {}).get("model")
                    if m and m != "<synthetic>":
                        model = m
        except (OSError, TypeError):
            pass
        if model:
            return model
        if wait:
            time.sleep(0.2)
    return "unknown"


def log_path(logdir, sid, first_ts):
    for name in os.listdir(logdir):
        if name.endswith(f"_{sid}.md"):
            return os.path.join(logdir, name)
    stamp = first_ts[:19].replace("T", "_").replace(":", "-")
    return os.path.join(logdir, f"{stamp}_{sid}.md")


def write_entries(logdir, sid, project, entries):
    """entries: list of (type, ts, model, text). Rewrites the frontmatter, appends the entries."""
    first_ts = entries[0][1]
    path = log_path(logdir, sid, first_ts)
    meta, body = {}, ""
    if os.path.exists(path):
        with open(path) as f:
            content = f.read()
        _, fm, body = content.split("---\n", 2)  # we always write the frontmatter first
        meta = dict(l.split(": ", 1) for l in fm.strip().splitlines())
    else:
        body = (f"\n# Session Log - {first_ts[:10]}\n\n"
                f"Session: `{sid[:8]}` | Project: `{project}` | Author: `{AUTHOR}`\n\n---\n")

    n = int(meta.get("total_exchanges", 0))
    models = [m for m in meta.get("model", "").split(", ") if m]
    for typ, ts, model, text in entries:
        if typ == "PROMPT":
            n += 1
            meta.setdefault("first_prompt_time", ts)
            meta["last_prompt_time"] = ts
        if model not in models and model != "unknown":
            models.append(model)
        body += (f"\n[LOG_ENTRY type={typ} num={n} session={sid[:8]}]\n"
                 f"timestamp: {ts}\nmodel: {model}\n\n{text}\n\n")

    fm = {
        "session_id": sid,
        "date": meta.get("first_prompt_time", first_ts)[:10],
        "author": AUTHOR,
        "model": ", ".join(models) or "unknown",
        "tool": TOOL,
        "project": project,
        "total_exchanges": n,
        "first_prompt_time": meta.get("first_prompt_time", first_ts),
        "last_prompt_time": meta.get("last_prompt_time", first_ts),
    }
    with open(path, "w") as f:
        f.write("---\n" + "".join(f"{k}: {v}\n" for k, v in fm.items()) + "---\n" + body)


def main():
    event = sys.argv[1]
    data = json.load(sys.stdin)
    sid, transcript = data["session_id"], data.get("transcript_path")
    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    logdir = os.path.join(root, ".agent-logs")
    os.makedirs(logdir, exist_ok=True)
    os.makedirs(PENDING_DIR, exist_ok=True)
    pending_file = os.path.join(PENDING_DIR, f"{sid}.json")
    project = os.path.basename(root)

    pending = None
    if os.path.exists(pending_file):
        with open(pending_file) as f:
            pending = json.load(f)
        os.remove(pending_file)

    if event == "prompt":
        if pending:  # previous turn was interrupted before Stop: keep its prompt anyway
            write_entries(logdir, sid, project,
                          [("PROMPT", pending["ts"], last_model(transcript), pending["prompt"])])
        with open(pending_file, "w") as f:
            json.dump({"ts": now(), "prompt": data.get("prompt", "")}, f)
    else:
        ts = now()
        model = last_model(transcript, wait=True)
        text = data.get("last_assistant_message")
        if text is None:
            text = "(no final assistant text in Stop hook input)"
        entries = [("RESPONSE", ts, model, text)]
        if pending:
            entries.insert(0, ("PROMPT", pending["ts"], model, pending["prompt"]))
        write_entries(logdir, sid, project, entries)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # never block the session; surface the failure in the hook log
        print(f"capture.py failed: {e!r}", file=sys.stderr)
