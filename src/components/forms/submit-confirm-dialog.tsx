"use client";

import type { Form } from "@/types";
import { CheckCircle2, Loader2, AlertTriangle, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form;
  values: Record<string, unknown>;
  completion: number;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  form,
  values,
  completion,
  isSubmitting,
  onConfirm,
}: SubmitConfirmDialogProps) {
  if (!open) return null;

  const filledFields = form.fields.filter((f) => {
    const val = values[f.name];
    return val !== undefined && val !== "" && val !== null;
  });

  const emptyRequired = form.fields.filter((f) => {
    if (!f.required) return false;
    const val = values[f.name];
    return val === undefined || val === "" || val === null;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isSubmitting && onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50 border border-white/10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Confirm Submission</h2>
            <p className="text-sm text-muted-foreground">{form.title}</p>
          </div>
        </div>

        {/* Completion Status */}
        <div className={cn("flex items-center gap-3 p-3 rounded-xl mb-4", {
          "bg-green-500/10 border border-green-500/20": emptyRequired.length === 0,
          "bg-yellow-500/10 border border-yellow-500/20": emptyRequired.length > 0,
        })}>
          {emptyRequired.length === 0 ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-300">All required fields completed</p>
                <p className="text-xs text-muted-foreground">{filledFields.length} of {form.fields.length} fields filled</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-300">
                  {emptyRequired.length} required field{emptyRequired.length > 1 ? "s" : ""} missing
                </p>
                <p className="text-xs text-muted-foreground">
                  {emptyRequired.map((f) => f.label).join(", ")}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Summary of data */}
        <div className="space-y-2 mb-5 max-h-48 overflow-y-auto pr-1">
          {form.fields
            .filter((f) => values[f.name] !== undefined && values[f.name] !== "")
            .map((f) => (
              <div
                key={f.id}
                className="flex items-start justify-between text-sm py-1.5 border-b border-white/5 last:border-0"
              >
                <span className="text-muted-foreground">{f.label}</span>
                <span className="text-right text-foreground font-medium text-xs ml-3 max-w-[50%] truncate">
                  {Array.isArray(values[f.name])
                    ? (values[f.name] as string[]).join(", ")
                    : String(values[f.name])}
                </span>
              </div>
            ))}
        </div>

        {/* Warning */}
        <p className="text-xs text-muted-foreground mb-5">
          By submitting, you confirm that all information provided is accurate.
          This action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => !isSubmitting && onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl glass border border-white/10 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Back to Edit
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting || emptyRequired.length > 0}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
              "bg-gradient-to-r from-violet-600 to-purple-600 text-white",
              "hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
