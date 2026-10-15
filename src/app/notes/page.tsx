import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Build notes · Lumen Studio",
  description: "What I built, what I deliberately left out, and what comes next.",
};

const REPO = "https://github.com/Khaan25/higgsfield-clone";

/** Things deliberately left out of the 24-hour scope, with the reason for each. */
const NOT_BUILT = [
  {
    title: "Auth and account setup",
    detail:
      "No sign-up flow (Supabase, Convex, Clerk or similar). The brief asks for a live link that works for someone who isn't signed in as me, and Higgsfield's biggest friction is gating the first result behind an account. So the first result comes before any account.",
  },
  {
    title: "Stripe and a credit-based system",
    detail:
      "No payments, credit ledger or paywall. Billing is a product of its own, and it adds nothing to a reviewer's first minute.",
  },
  {
    title: "A paid default model",
    detail:
      "I don't have a paid Gemini key, and Gemini has no free API tier for image models (checked 14 Oct 2026). So the default is a keyless free model, with clearly labelled Demo images when it's busy, and Gemini is bring-your-own-key.",
  },
];

/** What bring-your-own-key does today, so the trade-off is explicit. */
const BYOK_POINTS = [
  "Visitors paste their own Gemini key to unlock Google's Nano Banana models at Google's price, with no credit markup.",
  "The key goes from the visitor's browser straight to Google. It is never sent to Lumen's server.",
  "It is kept for the current tab only, unless \"Remember on this device\" is ticked.",
  "A bad key or missing quota shows Google's own message and a way to fix it, not a dead end.",
];

/** The production work I'd add next if accounts and billing were in scope. */
const NEXT_UP = [
  {
    title: "Google OAuth",
    detail: "One-click sign-in (Supabase Auth or Convex + Auth.js), offered only after the first free result, never before it.",
  },
  {
    title: "Accounts page",
    detail: "Profile, saved keys and usage history, with generations stored server-side so history follows the account across devices.",
  },
  {
    title: "Tier-based system",
    detail: "Free, Pro and Max tiers backed by Stripe subscriptions and a credit ledger, with the price shown before generating, not after.",
  },
  {
    title: "Rate limiting",
    detail: "Per-user and per-IP limits at the API route (for example Upstash Redis with a sliding window), returning Retry-After so the UI can count down.",
  },
  {
    title: "Throttling",
    detail: "A queue with per-tier concurrency, so bursts are smoothed instead of rejected, and paid tiers get priority without starving free users.",
  },
];

/** Where reviewers can see the process, not just the result. */
const PROCESS_LINKS = [
  { label: "Agent logs: every prompt and response, committed as I went", href: `${REPO}/tree/main/.agent-logs` },
  { label: "Research: 38 screenshots of Higgsfield, flows, reverse engineering", href: `${REPO}/tree/main/research` },
  { label: "Product strategy: what I built first and why", href: `${REPO}/blob/main/PRODUCT_STRATEGY.md` },
  { label: "Architecture", href: `${REPO}/blob/main/ARCHITECTURE.md` },
];

/**
 * Build notes for reviewers: the scope decisions behind the 24-hour rebuild, why bring-your-own-key
 * exists, and the production features that would come next. Static, server-rendered.
 */
export default function NotesPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:py-16">
      <div>
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft data-icon="inline-start" /> Back to the studio
          </Link>
        </Button>
      </div>

      <header className="flex flex-col gap-3">
        <Badge variant="secondary">Build notes</Badge>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">What I built, what I left out, and why</h1>
        <p className="text-muted-foreground">
          The requirements were to show how I approach building with AI: speed, thought process, UX and UI. I used Higgsfield first, then picked the
          one loop that matters most to a first-time visitor (type an idea, get an image) and made it work with no account and no dead ends.
        </p>
      </header>

      <Separator />

      <section className="flex flex-col gap-4" aria-labelledby="not-built">
        <h2 id="not-built" className="font-heading text-xl font-semibold">
          Deliberately not built
        </h2>
        <ul className="flex flex-col gap-3">
          {NOT_BUILT.map((item) => (
            <li key={item.title} className="rounded-2xl border bg-card p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="byok">
        <h2 id="byok" className="font-heading text-xl font-semibold">
          So I built bring-your-own-key instead
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {BYOK_POINTS.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="next">
        <h2 id="next" className="font-heading text-xl font-semibold">
          If accounts and billing were in scope, I&apos;d add
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {NEXT_UP.map((item, i) => (
            <li key={item.title} className="rounded-2xl border bg-card p-4">
              <p className="flex items-center gap-2 font-medium">
                <span className="grid size-6 place-items-center rounded-full bg-secondary text-xs tabular-nums" aria-hidden>
                  {i + 1}
                </span>
                {item.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <Separator />

      <section className="flex flex-col gap-3" aria-labelledby="process">
        <h2 id="process" className="font-heading text-xl font-semibold">
          See the process, not just the result
        </h2>
        <ul className="flex flex-col gap-1">
          {PROCESS_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
                {link.label} <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
