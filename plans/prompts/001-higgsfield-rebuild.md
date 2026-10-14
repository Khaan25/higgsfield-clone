<context>
Assignment: the 8x Engineering challenge. Rebuild a scoped version of Higgsfield AI (https://higgsfield.ai) within a tracked 24-hour window.
Evaluators score three things:
1. Speed of shipping a working product.
2. Product judgment: what to prioritize, improve, and leave out.
3. UX/UI polish.
It is not a pixel-perfect clone. The deliverables are a public repo with `.agent-logs/`, a live public URL, and a walkthrough of 5 minutes or less (the user records it on camera).

Repo: /Users/ziaurrehmankhan/code/experiments/higgsfield-clone (branch `main`, no remote yet).
State checked 2026-10-14:
- Commits: `0b62dab` "Add agent capture hooks (UserPromptSubmit + Stop -> .agent-logs/)" and `57e3262` "Pin project model to Opus 5.5".
- `.claude/settings.json` wires the `UserPromptSubmit` and `Stop` hooks to `python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/capture.py" prompt|response`, with `"model": "claude-opus-5-5"`.
- `.agent-logs/` has 4 session files. Two are headless test sessions (0db4211e on Opus, 44d9c3f6 on Sonnet; the Sonnet one was a deliberate model-label test). There is also the setup session 3b45ddd5, which has uncommitted changes, and a test session fc3f32f2.
- NOT done yet: the user has not sent the two canaries themselves, and `CAPTURE-TEST.md` does not exist. The capture test has therefore not passed.
- `capture.py` hardcodes `AUTHOR = "Khaan25"`.
- `.gitignore` contains only `.DS_Store`.

Official 8x capture rules (from https://8x-internal.com/p/8x-agent-capture-setup; the content is inside a sandboxed iframe's srcdoc, and WebFetch only returns the title):
- Hooks go in `.claude/settings.json`. The prompt event and the end-of-turn event append to the log automatically.
- Log files: `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md`. Each has YAML front matter (session_id, date, author, model, tool, project, total_exchanges, first_prompt_time, last_prompt_time) and `[LOG_ENTRY type=PROMPT|RESPONSE num=N session=<8char>]` entries with `timestamp:` and `model:` lines.
- Capture the verbatim prompt, the final response, the UTC timestamp, and the model. Thinking and tool calls are not captured.
- Canary text: `CAPTURE TEST — 8x assignment, <name>`. It must be sent in one session, then in a second session, and both must land in the logs.
- `CAPTURE-TEST.md` at the repo root lists:
  - tool and model
  - the mechanism and the config file changed
  - the log path(s)
  - both canary entries pasted raw
  - anything that failed
- Logs ship publicly. Do not gitignore them, and do not edit, tidy or delete entries. Commit them interleaved with code.

REA (https://github.com/morluto/rea, MIT) is an MCP server plus CLI for agent reverse engineering. Setup:
- `npx rea-agents setup` (interactive: pick agents, restart the agent), or `npm install --global rea-agents` and then `rea --help`.
- Node >=22.19. Local Node is v22.23.2.
- Websites need a Chrome-family browser. The exact website command is in `docs/browser-observation.md` in that repo, so read it before running anything.
- For websites it outputs page structure, scripts, network observations and screenshots.
- Lawful/authorized-research use only.

Local tooling:
- node 22.23.2, npm 10.9.8, Playwright 1.64.0, jq, python3.
- gh 2.101 logged in as `Khaan25`.
- Vercel CLI 60.1.3 is installed and outdated, so use `npx vercel@latest`.
- The built-in browser pane (`mcp__Claude_Browser__*`) is available for exploring Higgsfield.
</context>

<inputs>
Already decided by the user:
- Project location: ~/code/experiments/higgsfield-clone (already exists, see context).
- Canary/author name: "Zia ur Rehman Khan". Change `AUTHOR` in `.claude/hooks/capture.py` to this value. That changes new entries only. Existing entries stay as written.
- Generation: real generation through a free-tier provider ("Gemini or any tool with a free trial"). The app must still work for evaluators when the key is missing or the quota runs out.
- Publishing: pre-approved. Create the public GitHub repo `Khaan25/higgsfield-clone` and deploy to Vercel without asking.

Ask me for, at the moment each is needed:
- {{CANARY_DONE}}: I send the canary in two separate Code sessions opened in the repo, then tell you. It needs a human because each canary must come from a real user prompt in a session started after the hooks existed.
- {{HIGGSFIELD_LOGIN}}: I complete sign-up or log-in myself in the browser pane. You never type credentials.
- {{PROVIDER_KEY}}: I put the generation API key into `.env.local` and run `npx vercel@latest env add` myself. The key must never be pasted into chat, because every prompt is logged verbatim into public `.agent-logs/`.
- Any Higgsfield action that spends credits or money. Ask once per action and state the expected cost.

Defaults taken:
- Next.js (create-next-app latest) with App Router, TypeScript, Tailwind, npm.
- shadcn/ui only for primitives you actually use. Also Motion and lucide-react.
- Primary journey hypothesis: image generation workspace. Phase 3 confirms or replaces it from research.
- State: React state plus `localStorage` for history. No backend DB and no auth in the clone.
- Single sequential lane (see `<lanes>`).
</inputs>

<direction>
Optimize for one excellent vertical slice that a reviewer can use in 60 seconds without logging in. Breadth and code volume score lower than that. Every visible control does something; a dead button reads as unfinished.

The generation flow must be honest. Real output comes from the provider. When there is no key, the quota is exhausted, or the provider errors, the app switches to a demo mode, labels it visibly as "Demo", and serves pre-generated outputs. The primary journey must never dead-end on evaluation day.

Research exists to inform scope, so timebox it:
- Product exploration: about 2 hours.
- REA and DevTools: about 1 hour.
- If REA setup stalls for more than 20 minutes, record what happened in `research/reverse-engineering.md` and continue with Playwright/DevTools evidence.

Record only what you actually observed. If a flow was blocked (paywall, credits, login), write "not tested" with the reason. Evaluators will compare the claims against the screenshots.

Commit small and often:
- Each commit pairs code or docs with the current `.agent-logs/` changes.
- Use `git add .agent-logs/` every time.
- Keep `PROGRESS.md` at the repo root current: milestone, status, next step, and blockers.

Before every push, scan the logs and the diff for secrets with `git diff --cached | grep -nEi 'api[_-]?key|secret|token|password|AIza|sk-'`, then review any hits. Logs cannot be edited, so if one leaks a key, the fix is to rotate the key: tell me, and do not rewrite history.

Improve on Higgsfield only where research shows friction, and write down the why. Candidate areas: model discovery, generation settings, loading feedback, empty states, history management.
</direction>

<structure>
M0 Capture gate (blocking, no app code before it passes)
  1. Change `AUTHOR` in `.claude/hooks/capture.py` to "Zia ur Rehman Khan".
  2. Ask me for {{CANARY_DONE}}. Wait.
  3. Confirm that both canary entries appear in two different session files in `.agent-logs/`.
  4. Write `CAPTURE-TEST.md` with the five required sections. Paste the canary entries raw. In "what failed", note:
     - the pre-hook session 3e173f7d
     - the Sonnet test session and why it exists
  5. Add `node_modules`, `.next`, `.env*.local`, `test-results`, `playwright-report` and `.vercel` to `.gitignore`. Do not add `.agent-logs`.
  6. Commit.
  Result: a commit containing `CAPTURE-TEST.md` that shows two user canaries.

M1 Product exploration
  - Browser pane against https://higgsfield.ai.
  - Ask me for {{HIGGSFIELD_LOGIN}}.
  - For each workflow record: entry point, screens, controls, success/loading/error states, and screenshots saved to `research/screenshots/<NN>-<slug>.png`.
  - Write:
    - `research/product-overview.md`
    - `research/user-flows.md`
    - `research/feature-inventory.md`, with per-feature goal, entry, workflow, components, interactions, dependencies, complexity, value, and implement yes/no
    - `research/design-system.md`, with colors, type, spacing, radii, and components seen
    - `research/ux-opportunities.md`
    - `research/research-limitations.md`
  - Commit.

M2 Reverse engineering
  - Read REA's README and `docs/browser-observation.md`. Install via the supported path.
  - Observe higgsfield.ai public pages only. Combine with DevTools network/console reads.
  - Write `research/reverse-engineering.md`, tagging each finding CONFIRMED (with evidence: file, screenshot or request) or INFERRED. Cover:
    - routing
    - page structure
    - components
    - state transitions
    - public requests
    - loading/error states
    - frontend stack
  - Commit.

M3 Strategy
  - `PRODUCT_STRATEGY.md`:
    - answer the 7 questions from the brief
    - a scored table: user value, demo impact, effort, risk, dependencies, time to ship
    - ONE primary journey
    - 2–4 supporting features
    - an explicit "Deliberately excluded" list
    - 2–3 UX improvements, each citing a research finding and screenshot
  - Provider decision:
    - Check https://ai.google.dev/gemini-api/docs/pricing today for a free-tier image model and note the date checked.
    - If Gemini image generation has no free tier, evaluate one no-cost alternative and record the choice and its limits. Options: Cloudflare Workers AI free allocation, or Hugging Face Inference free credits.
    - Ask before creating any new account.
  - Commit.

M4 Architecture and scaffold
  - `ARCHITECTURE.md`, kept short:
    - folder map (`src/app`, `src/features/<feature>/`, `src/components/ui`, `src/lib`)
    - typed models (`Generation`, `ModelOption`, `GenerationSettings`)
    - the server route `src/app/api/generate/route.ts`
    - the provider call
    - demo fallback rules
    - state/persistence
  - Scaffold with `npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint --use-npm --yes` into the existing repo. Keep `.claude/`, `.agent-logs/` and the docs.
  - Add scripts: `"typecheck": "tsc --noEmit"`, `"lint": "eslint ."`, `"test:e2e": "playwright test"`.
  - Commit with the app booting at localhost.

M5 Primary slice
  - Build the core journey end to end: prompt composer, model and settings, generate, loading, result, history/gallery.
  - Include validation (empty prompt, max length) and error states (provider error, rate limit, fallback banner).
  - Make it responsive.
  - Run it in the browser pane and exercise it.
  - Commit per sub-slice.

M6 Polish
  - Visual hierarchy, typography, spacing, motion (respect `prefers-reduced-motion`), focus states, empty states.
  - Take side-by-side screenshots versus Higgsfield and save them as `research/screenshots/compare-*.png`.
  - Commit.

M7 QA
  - Playwright specs in `e2e/` at 1440x900 and 390x844. Cover:
    - navigation
    - prompt validation
    - the generate flow in demo mode (deterministic, no network to the provider)
    - result presentation
    - history persistence across reload
    - the error/fallback banner
  - Assert zero console errors.
  - Pass `npm run typecheck && npm run lint && npm run build && npm run test:e2e`.
  - Commit.

M8 Publish
  - Secret scan.
  - `gh repo create Khaan25/higgsfield-clone --public --source . --push`.
  - `npx vercel@latest --prod`. Ask me for {{PROVIDER_KEY}} env setup before or after; the app must work without it.
  - Open the production URL in a fresh incognito Playwright context. Check:
    - every route returns 200
    - the primary flow completes
    - the mobile layout works
  - Write `README.md`: setup, env vars, features, strategy summary, known limitations, links.
  - Commit and push.

M9 `WALKTHROUGH.md`
  - A script of about 650 words or less (4–5 minutes) covering the 8 required points.
  - A demo order with the strongest moment first.
  - Commit and push.

M10 Final verification
  - Run every acceptance check.
  - Print the submission block:
    ```
    Live link: <verified URL>
    Repository: https://github.com/Khaan25/higgsfield-clone
    Walkthrough: <pending — user records>
    ```
</structure>

<lanes>
Single sequential lane in the main session, run from the repo root so the capture hooks log the run. Parallel worktrees would not help:
- The exploration is bound to the single browser pane.
- The research output feeds the scope.
- `package.json` and `src/app/layout.tsx` sit under every slice.
- A greenfield app this size merges worse than it parallelizes.

Allowed parallelism: read-only Explore subagents for doc lookups (REA docs, provider pricing, Next.js APIs). They write nothing. You write their results into the docs.

Main session owns everything. Verify per milestone:
- M0: `ls .agent-logs && grep -c "CAPTURE TEST" CAPTURE-TEST.md`
- M4 onward: `npm run typecheck && npm run lint && npm run build`
- M7 onward: `npm run test:e2e`

STOP and ask if:
- the canary is missing after {{CANARY_DONE}}
- Higgsfield requires payment to reach the core flow
- the provider requires a credit card
- a log contains a secret
</lanes>

<acceptance>
1. `git log --oneline` shows the commit adding `CAPTURE-TEST.md` BEFORE the first commit that adds `package.json`.
2. `CAPTURE-TEST.md` contains two raw `CAPTURE TEST — 8x assignment, Zia ur Rehman Khan` entries from two different session IDs, and each ID matches a file in `.agent-logs/`.
3. `git log --stat -- .agent-logs/` shows log changes in at least 5 distinct commits spread across milestones, and `git log --diff-filter=D -- .agent-logs/` returns nothing (no deletions).
4. The `research/` directory has all 6 named docs plus `reverse-engineering.md`. `research/screenshots/` has 15 or more PNGs, and every screenshot referenced in the docs exists (`grep -o 'screenshots/[^)]*' research/*.md | xargs` existence check).
5. `PRODUCT_STRATEGY.md` names exactly one primary journey and contains a scored prioritization table, an "excluded" section, and 2–3 improvements, each with a cited research file or screenshot.
6. `ARCHITECTURE.md` and `PROGRESS.md` exist, and `PROGRESS.md` reflects the final state.
7. `npm run typecheck`, `npm run lint` and `npm run build` exit 0.
8. `npm run test:e2e` passes on desktop and mobile projects, covering validation, demo generation, result view, history after reload, and the fallback/error banner, with zero console errors asserted.
9. With no provider key set, the deployed app completes the primary flow and shows a visible "Demo" label. With a key set (when I have provided one), at least one real generation is shown in a screenshot under `research/screenshots/`.
10. `gh repo view Khaan25/higgsfield-clone --json visibility` returns `PUBLIC`, and the repo contains `.agent-logs/`, `README.md` and `WALKTHROUGH.md`.
11. Production URL: a fresh unauthenticated Playwright context gets 200 on every app route and completes the primary flow. A screenshot is saved at both viewports.
12. The secret scan of `git log -p` for `AIza|sk-|api[_-]?key=|token=` has no real-secret hits, and `.env*` is untracked.
13. `WALKTHROUGH.md` is 750 words or fewer and covers all 8 required points.

Unresolved, only I can do it: record the camera walkthrough and add its URL to the submission block.
</acceptance>

<gotchas>
- The hooks load at session start. Run this whole prompt in a Claude Code session opened in `~/code/experiments/higgsfield-clone`, otherwise the run is not captured. Check that `.agent-logs/` gains a new file after your first reply.
- The logs are verbatim and public. Keys, passwords and personal data must never appear in any prompt or response. Refer to the key as `GEMINI_API_KEY` (or the chosen provider's variable name), never by its value.
- The 8x page content is inside an iframe srcdoc. If you need to re-read it, extract it via the browser JS tool. WebFetch only returns the title.
- Recent Next.js drops `next lint`, so use `eslint .` directly. Check the generated `package.json` before relying on any script name.
- create-next-app in a non-empty dir may refuse. If it does, scaffold into a temp dir and move the files in, keeping `.claude/`, `.agent-logs/`, `CAPTURE-TEST.md` and `research/`.
- Free image tiers often exclude image models or rate-limit heavily. Server-side: map 429/quota errors to the demo fallback with a clear banner, instead of a raw error.
- Keep the provider key server-only: call the provider from `src/app/api/generate/route.ts` and never use the `NEXT_PUBLIC_` prefix.
- Make demo outputs real images committed under `public/demo/`, keyed deterministically by prompt hash plus aspect ratio, so the Playwright tests are stable.
- Higgsfield is a commercial site. Use only public pages and your own logged-in account, and do not reuse its brand assets or logo in the clone. Name the clone distinctly in the UI and say "inspired by".
- The model is pinned to `claude-opus-5-5` in project settings. Leave it.
</gotchas>

<limits>
Pre-approved:
- git commits
- creating the public repo `Khaan25/higgsfield-clone` and pushing to it
- Vercel production deploys
- npm dependencies for the stated stack plus `@playwright/test`, the chosen provider SDK, and `rea-agents`

Ask first:
- any new dependency outside that list
- spending Higgsfield credits or money
- creating accounts with new providers
- anything requiring a credit card

Never do these. They are irreversible and would break the 8x rules:
- force-push
- history rewrites
- deleting or editing existing `.agent-logs/` entries

Run limit: the 24-hour window. Stop polish when M7 is green and M8–M10 still remain. Shipping beats polishing.
</limits>

<start>
First confirm that this session is running from the repo root and capturing (check for a new `.agent-logs/` file).
Then show me the milestone plan and do M0 step 1.
Then ask for {{CANARY_DONE}}.
</start>
