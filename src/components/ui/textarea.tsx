import * as React from "react"
import { cn } from "cn"

// Lumen: "ghost" drops the field chrome for textareas that sit inside their own card (the composer).
function Textarea({ className, variant = "default", ...props }: React.ComponentProps<"textarea"> & { variant?: "default" | "ghost" }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        variant === "ghost"
          ? "flex w-full resize-none bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          : "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
