import { Code2, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/Khaan25/higgsfield-clone";

interface StudioHeaderProps {
  /** Whether a Gemini key is saved; changes the key button's label and shows a status dot. */
  hasApiKey: boolean;

  /** Opens the bring-your-own-key dialog. */
  onOpenKeyDialog: () => void;
}

/** StudioHeader shows the brand, the bring-your-own-key entry point and a link to the source. */
export function StudioHeader({ hasApiKey, onOpenKeyDialog }: StudioHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden>
            <Sparkles className="size-4" />
          </span>
          Lumen
        </Link>
        <span className="hidden text-xs text-muted-foreground sm:inline">AI image studio · inspired by Higgsfield</span>
        <Button variant="outline" className="ml-auto" onClick={onOpenKeyDialog}>
          <KeyRound data-icon="inline-start" />
          <span className="sm:hidden">{hasApiKey ? "Key" : "Add key"}</span>
          <span className="hidden sm:inline">{hasApiKey ? "Gemini key" : "Use your Gemini key"}</span>
          {hasApiKey && <span className="size-1.5 rounded-full bg-success" aria-label="(saved)" />}
        </Button>
        <Button variant="ghost" asChild>
          <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Source code on GitHub">
            <Code2 data-icon="inline-start" />
            <span className="hidden sm:inline">Source</span>
          </a>
        </Button>
      </div>
    </header>
  );
}
