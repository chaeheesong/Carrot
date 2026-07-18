"use client";

import { CATEGORIES, type CategoryValue } from "@/lib/format";

export function CategoryChips({
  active,
  onChange,
}: {
  active: CategoryValue;
  onChange: (value: CategoryValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const selected = c.value === active;
        return (
          <button
            key={c.label}
            onClick={() => onChange(c.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selected
                ? "bg-ink text-white"
                : "border border-gray-200 bg-white text-ink-muted hover:border-gray-300"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
