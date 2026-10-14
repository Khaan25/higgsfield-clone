"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface MenuOption {
  id: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

/** Single-select popover: closes on outside click, Escape, or selection; arrow keys move focus. */
export function Menu({
  label,
  value,
  options,
  onChange,
  icon,
  heading,
}: {
  label: string;
  value: string;
  options: MenuOption[];
  onChange: (id: string) => void;
  icon?: ReactNode;
  heading: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const moveFocus = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={`${label}: ${current?.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3 text-sm text-fg/90 transition-colors hover:border-muted/40"
      >
        {icon}
        <span className="whitespace-nowrap">{current?.label}</span>
        <ChevronDown className={`size-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div
          id={listId}
          role="menu"
          aria-label={heading}
          onKeyDown={moveFocus}
          className="absolute bottom-full left-0 z-30 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-1.5 shadow-2xl shadow-black/60"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-xs font-medium uppercase tracking-wide text-muted">{heading}</p>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="menuitemradio"
              aria-checked={o.id === value}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left outline-none hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
            >
              {o.icon}
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-fg">{o.label}</span>
                {o.hint && <span className="block text-xs text-muted">{o.hint}</span>}
              </span>
              {o.id === value && <Check className="size-4 text-accent" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
