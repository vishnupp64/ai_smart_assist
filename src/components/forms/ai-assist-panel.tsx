"use client";

import { useState, useRef } from "react";
import type { Form, AISuggestion } from "@/types";
import {
  Brain,
  Sparkles,
  Loader2,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAssistPanelProps {
  form: Form;
  currentValues: Record<string, unknown>;
  suggestions: Record<string, AISuggestion>;
  onSuggest: (suggestions: AISuggestion[]) => void;
  onAccept: (fieldName: string, value: unknown) => void;
  onReject: (fieldName: string) => void;
}

type PanelState = "idle" | "loading" | "suggestions" | "followup" | "explanation" | "review";

export function AIAssistPanel({
  form,
  currentValues,
  suggestions,
  onSuggest,
  onAccept,
  onReject,
}: AIAssistPanelProps) {
  const [description, setDescription] = useState("");
  const [state, setState] = useState<PanelState>("idle");
  const [followUpQuestions, setFollowUpQuestions] = useState<Array<{ fieldName: string; question: string; reason: string }>>([]);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasSuggestions = Object.keys(suggestions).length > 0;

  async function handleSuggest() {
    if (!description.trim() || description.trim().length < 10) {
      setError("Please write a bit more so AI can help you better.");
      return;
    }
    setError("");
    setState("loading");

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, formId: form.id }),
      });

      if (!res.ok) throw new Error("AI request failed");

      const data = await res.json();
      onSuggest(data.suggestions || []);

      // If followup needed, fetch questions
      if (data.followUpNeeded) {
        await handleFollowUp();
      } else {
        setState("suggestions");
      }
    } catch {
      setError("Failed to get AI suggestions. Please check your API key.");
      setState("idle");
    }
  }

  async function handleFollowUp() {
    setState("loading");
    try {
      const res = await fetch("/api/ai/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          formId: form.id,
          knownValues: currentValues,
        }),
      });

      if (!res.ok) throw new Error("Follow-up request failed");

      const data = await res.json();
      if (data.questions?.length > 0) {
        setFollowUpQuestions(data.questions);
        setState("followup");
      } else {
        setState("suggestions");
      }
    } catch {
      setState("suggestions");
    }
  }

  async function handleReview() {
    setState("loading");
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: form.id, answers: currentValues }),
      });

      if (!res.ok) throw new Error("Review request failed");

      const data = await res.json();
      setReviewResult(data);
      setState("review");
    } catch {
      setError("Failed to review form. Please try again.");
      setState("idle");
    }
  }

  const pendingSuggestions = Object.entries(suggestions);
  const missingRequired = form.fields.filter((f) => {
    if (!f.required) return false;
    const val = currentValues[f.name];
    return val === undefined || val === "" || val === null;
  });

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border-b border-white/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">
            Gemini
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Describe yourself or your situation and I'll fill the form for you.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Input Section */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="E.g. My name is Sarah Johnson, I'm a software engineer with 5 years experience applying for a senior role. I live in San Francisco, CA..."
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-slate-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500 placeholder:text-slate-400"
          />
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
          <button
            onClick={handleSuggest}
            disabled={state === "loading"}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
              "bg-gradient-to-r from-violet-600 to-purple-600 text-white",
              "hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {state === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Auto-fill with AI
              </>
            )}
          </button>
        </div>

        {/* Review Button */}
        <button
          onClick={handleReview}
          disabled={state === "loading" || Object.keys(currentValues).length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all glass border border-white/10 hover:border-violet-500/30 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          Review My Answers
        </button>

        {/* Suggestions Panel */}
        {hasSuggestions && state !== "loading" && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-violet-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {pendingSuggestions.length} AI suggestion{pendingSuggestions.length !== 1 ? "s" : ""} ready
            </p>
            <div className="space-y-1.5">
              {pendingSuggestions.slice(0, 5).map(([fieldName, sug]) => {
                const field = form.fields.find((f) => f.name === fieldName);
                return (
                  <div
                    key={fieldName}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{field?.label || fieldName}</p>
                      <p className="text-xs text-violet-300 truncate">
                        {Array.isArray(sug.suggestedValue)
                          ? sug.suggestedValue.join(", ")
                          : String(sug.suggestedValue)}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => onAccept(fieldName, sug.suggestedValue)}
                        className="p-1 rounded-md hover:bg-green-500/20 text-green-400 transition-colors"
                        title="Accept"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReject(fieldName)}
                        className="p-1 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {pendingSuggestions.length > 0 && (
              <button
                onClick={() => {
                  pendingSuggestions.forEach(([name, sug]) => {
                    onAccept(name, sug.suggestedValue);
                  });
                }}
                className="w-full text-xs text-violet-400 hover:text-violet-300 flex items-center justify-center gap-1 py-1.5"
              >
                Accept all suggestions
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Follow-up Questions */}
        {state === "followup" && followUpQuestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-yellow-400 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              I need more info
            </p>
            <div className="space-y-2">
              {followUpQuestions.map((q) => (
                <div key={q.fieldName} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-300 font-medium mb-0.5">{q.question}</p>
                  <p className="text-xs text-muted-foreground">{q.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Results */}
        {state === "review" && reviewResult && (
          <div className="space-y-2">
            <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg", {
              "bg-green-500/10 border border-green-500/20": reviewResult.isValid,
              "bg-orange-500/10 border border-orange-500/20": !reviewResult.isValid,
            })}>
              <p className="text-xs font-medium">
                {reviewResult.isValid ? "✅ All good!" : "⚠️ Issues found"}
              </p>
              <span className={cn("text-xs font-bold", {
                "text-green-400": reviewResult.completionPct >= 80,
                "text-yellow-400": reviewResult.completionPct >= 50,
                "text-red-400": reviewResult.completionPct < 50,
              })}>
                {reviewResult.completionPct}%
              </span>
            </div>

            {reviewResult.issues?.length > 0 && (
              <div className="space-y-1.5">
                {reviewResult.issues.map((issue: any, i: number) => {
                  const field = form.fields.find((f) => f.name === issue.fieldName);
                  return (
                    <div key={i} className="px-3 py-2 rounded-lg bg-secondary/50 border border-white/5">
                      <p className="text-xs font-medium">{field?.label || issue.fieldName}</p>
                      <p className="text-xs text-muted-foreground">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-xs text-violet-400 mt-0.5">💡 {issue.suggestion}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground">{reviewResult.summary}</p>
          </div>
        )}

        {/* Missing Required Fields */}
        {missingRequired.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Still needed ({missingRequired.length})
            </p>
            <div className="space-y-1">
              {missingRequired.map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
