import { X } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StatusNotice } from "./use-studio";

interface StatusBannerProps {
  /** Why the last request did not produce live images, and what the visitor can do about it. */
  notice: StatusNotice;

  /** Retries with `notice.retrySettings`. */
  onRetry: () => void;

  /** Opens the key dialog; only offered for Gemini key errors. */
  onUpdateKey: () => void;

  /** Hides the banner. */
  onDismiss: () => void;
}

/**
 * StatusBanner explains a failed live request instead of failing silently.
 * Demo notices say the images below are samples and offer a live retry; error notices
 * (bad or quota-less Gemini key) offer to fix the key or fall back to the free model.
 */
export function StatusBanner({ notice, onRetry, onUpdateKey, onDismiss }: StatusBannerProps) {
  const isDemo = notice.tone === "demo";
  return (
    <Alert variant={isDemo ? "default" : "destructive"} role="status" data-testid={isDemo ? "fallback-banner" : "error-banner"}>
      <AlertTitle>
        <span className="flex items-center gap-2">
          {isDemo && <Badge>Demo</Badge>}
          {notice.title}.
        </span>
      </AlertTitle>
      <AlertDescription>{notice.detail}</AlertDescription>
      <AlertAction>
        <Button size="icon-sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss notice">
          <X />
        </Button>
      </AlertAction>
      <div className="mt-2 flex flex-wrap gap-2">
        {!isDemo && (
          <Button size="sm" variant="outline" onClick={onUpdateKey}>
            Update key
          </Button>
        )}
        <Button size="sm" variant={isDemo ? "default" : "outline"} onClick={onRetry}>
          {isDemo ? "Retry live" : "Use free model instead"}
        </Button>
      </div>
    </Alert>
  );
}
