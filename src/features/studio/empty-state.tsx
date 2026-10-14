import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { EXAMPLES } from "@/lib/generators";
import type { AspectRatio } from "@/lib/schema";

interface EmptyStateProps {
  /** Loads an example prompt (and its aspect ratio) into the composer. */
  onPickExample: (prompt: string, aspectRatio: AspectRatio) => void;
}

/**
 * EmptyState is the first screen: a one-line promise plus clickable example prompts,
 * so a first-time visitor can get an image without writing anything.
 */
export function EmptyState({ onPickExample }: EmptyStateProps) {
  return (
    <div className="pt-6 sm:pt-14">
      <Empty>
        <EmptyHeader className="max-w-3xl">
          <EmptyTitle size="hero" role="heading" aria-level={1}>
            Type an idea. <span className="text-primary">Get an image.</span>
          </EmptyTitle>
          <EmptyDescription>No sign-up and no credits. Write a prompt below, or start from one of these.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-3xl">
          <ul className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            {EXAMPLES.map((example) => (
              <li key={example.file}>
                <button
                  type="button"
                  onClick={() => onPickExample(example.prompt, example.aspectRatio)}
                  className="group block w-full overflow-hidden rounded-2xl border bg-card text-left transition hover:border-primary/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static demo asset, next/image adds nothing here */}
                  <img src={`/demo/${example.file}`} alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
                  {/* Padding lives on the wrapper: on the clamped element it would let a third line peek through. */}
                  <span className="block p-2.5">
                    <span className="line-clamp-2 text-xs leading-snug text-muted-foreground group-hover:text-foreground">{example.prompt}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </EmptyContent>
      </Empty>
    </div>
  );
}
