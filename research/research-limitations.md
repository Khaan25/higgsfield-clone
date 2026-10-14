# Research limitations

- **No real generation was observed.** The logged-in account (the user's own Chrome profile) has 0 credits ("All credits used"), and Generate opens a paywall (`screenshots/11-generate-paywall-zero-credits.png`). The user chose not to pay (2026-10-14). As a result, these were not tested on Higgsfield:
  - a real loading state
  - a success result in your own feed
  - provider or moderation errors
  - rate limits
  - a populated Assets history
- **The guest flow is not a real generation.** The guest "In progress" state was observed, but the network log shows no generation request (`evidence/guest-network.txt`). It cannot stand in for the real loading state.
- **The result view comes from the community.** The result detail view was observed on a public community shot (`screenshots/17-shot-detail-result-view.png`), not on our own output. It may differ from the private result view.
- **Mobile was logged-out only.** Mobile was captured logged-out in Playwright (iPhone 13 profile, 390×844), because the user's Chrome window could not be resized. The logged-in mobile view was not tested.
- **Not explored, out of the 2-hour timebox and outside the primary journey:**
  - Video, Audio and Effects generation beyond the landing page (`screenshots/14-video-landing.png`)
  - AI Influencer, Ads Studio, Cinema Studio, Canvas, MCP, API, Contests
- **The cookie banner was dismissed once in Chrome** (the "Dismiss" button, which is not "Accept All"). In Playwright it was left in place.
- **Some design values are estimates.** The design-system values marked "estimated" come from screenshots, not computed styles.
- **This is a point-in-time snapshot.** Higgsfield ships constantly: NEW badges were everywhere, and the model list and prices are as of 2026-10-14.
