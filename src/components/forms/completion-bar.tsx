"use client";

import { cn } from "@/lib/utils";
import type { FormField } from "@/types";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface CompletionBarProps {
  completion: number;
  fields: FormField[];
  values: Record<string, unknown>;
}

export function CompletionBar({ completion, fields, values }: CompletionBarProps) {
  const requiredFields = fields.filter((f) => f.required);
  const filledRequired = requiredFields.filter((f) => {
    const val = values[f.name];
    return val !== undefined && val !== "" && val !== null && !(Array.isArray(val) && val.length === 0);
  });

  const missing = requiredFields.filter((f) => {
    const val = values[f.name];
    return val === undefined || val === "" || val === null;
  });

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {completion === 100 ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          )}
          <span className="text-sm font-medium">
            Form Completion
          </span>
        </div>
        <span
          className={cn("text-sm font-bold", {
            "text-green-400": completion === 100,
            "text-yellow-400": completion >= 50 && completion < 100,
            "text-red-400": completion < 50,
          })}
        >
          {completion}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out animate-progress",
            {
              "bg-gradient-to-r from-green-500 to-emerald-400": completion === 100,
              "bg-gradient-to-r from-violet-500 to-purple-500": completion >= 50 && completion < 100,
              "bg-gradient-to-r from-red-500 to-orange-500": completion < 50,
            }
          )}
          style={{ width: `${completion}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          {filledRequired.length}/{requiredFields.length} required
        </span>
        <span className="flex items-center gap-1">
          <Circle className="w-3 h-3 text-blue-400" />
          {fields.length} total fields
        </span>
        {missing.length > 0 && (
          <span className="flex items-center gap-1 text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            {missing.length} missing
          </span>
        )}
      </div>

      {/* Missing Fields Checklist */}
      {missing.length > 0 && missing.length <= 6 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-xs text-muted-foreground mb-1.5">Still needed:</p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((f) => (
              <span
                key={f.id}
                className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 font-medium"
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
