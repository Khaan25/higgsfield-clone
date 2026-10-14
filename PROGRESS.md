# PROGRESS

Task: 8x challenge — scoped Higgsfield rebuild. Spec: `plans/prompts/001-higgsfield-rebuild.md` (milestones M0–M10, acceptance 1–13).
Constraints: logs in `.agent-logs/` are public and never edited/deleted; no app code before M0 passes; no secrets in prompts.

| Milestone | Status | Evidence |
|---|---|---|
| M0 Capture gate | done | `565a6ce`: `CAPTURE-TEST.md` has canaries from sessions 329a0438 + 3c7de566; `.gitignore` extended |
| M1 Product exploration | done | 6 docs in `research/`, 28 PNGs, all doc references resolve; `research/evidence/guest-network.txt` |
| M2 Reverse engineering | done | `research/reverse-engineering.md` (CONFIRMED/INFERRED), `research/evidence/rea-summary.json`, REA screenshot 29 |
| M3 Strategy | done | `PRODUCT_STRATEGY.md`: 7 brief-derived questions answered (brief has none numbered), scored table, 1 primary journey, excluded list, 3 cited improvements, provider decision |
| M4 Architecture + scaffold | done | `ARCHITECTURE.md`; Next 16.4 scaffold; typecheck/lint/build pass; `GET /` 200 on dev |
| M5 Primary slice | done (core) | composer + style/aspect/count + generate + honest pending + live/demo results + lightbox + history/search/delete; Playwright smoke desktop+mobile: live gen 4–5s, demo fallback on 429, history survives reload, 0 console errors; `research/screenshots/31-clone-live-generation-desktop.png` |
| BYOK (user request) | done | Gemini key dialog (session-only by default), model picker, browser→Google call, typed key/quota errors; mocked test: bad key banner, success card, 0 server calls, key only in sessionStorage |
| M6 Polish | done | mobile lightbox actions pinned, mobile header/history heading tightened; `research/screenshots/compare-1..5-*.png` (Higgsfield vs Lumen, captions match evidence) |
| M7 QA | todo | |
| M8 Publish | todo | |
| M9 Walkthrough | todo | |
| M10 Final verification | todo | |

Decisions:
- BYOK: browser calls Google directly (CORS verified), key never touches our server; failures show fixable error banner, not demo. Real-key response shape unverified (needs the user's key in the browser).
- API returns provider failures as `200 {error}` (typed) so fallbacks don't log red console errors; only malformed input is a real 400.
- App name: Lumen Studio ("inspired by Higgsfield"). Pollinations anonymous serves only `sana` (flux/turbo return identical bytes; 402 on burst) -> Style presets replace a model picker (`StyleOption` instead of `ModelOption`); generation is sequential server-side; images returned as data URLs.
- `typecheck` = `next typegen && tsc --noEmit` (LayoutProps globals come from typegen).
- Provider: Pollinations legacy keyless endpoint (tested 200 JPEG, 2026-10-14) + labelled Demo fallback. Gemini rejected: no free API tier for image models (pricing + rate-limits pages, 2026-10-14). No {{PROVIDER_KEY}} needed.
- REA run via `npx rea-agents@latest` (no global install) against a separate logged-out Chrome profile on 127.0.0.1:9222; `--allowed-origins` must be repeated per origin (JSON/CSV forms rejected). Took ~15 min, under the 20-min stall limit.
- 2026-10-14: user chose NOT to pay Higgsfield (0 credits). Real generation states marked 'not tested'; guest flow + community shot detail used as evidence.
- Guest 'In progress' is a sign-up teaser with no generation request (`research/evidence/guest-network.txt`) -> core argument for no-login demo/real generation in the clone.
- Using the user's logged-in Chrome profile (Claude in Chrome) instead of the browser pane for Higgsfield.
- Desktop app opens sessions in `.claude/worktrees/*`; hooks still log to the main checkout via `$CLAUDE_PROJECT_DIR`. `.claude/worktrees/` is gitignored.
- `capture.py` keeps the `author` already in an existing log's front matter, so older session files are not retagged.

Blockers: none. (Brief received 2026-10-14; it has no numbered questions/points, so the 7 questions and walkthrough points are derived from its judging criteria and hand-in checklist.)

Next action: M7 — Playwright specs in `e2e/` (desktop 1440x900 + mobile 390x844), demo mode via GENERATION_MODE=demo + mocked Gemini, zero console errors; then full check suite.
