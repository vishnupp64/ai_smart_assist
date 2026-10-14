"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DynamicFormRenderer } from "./dynamic-form-renderer";
import { AIAssistPanel } from "./ai-assist-panel";
import { CompletionBar } from "./completion-bar";
import { SubmitConfirmDialog } from "./submit-confirm-dialog";
import { calculateCompletion } from "@/lib/utils";
import type { Form, AISuggestion } from "@/types";
import {
  Brain,
  ChevronLeft,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface FormPageClientProps {
  form: Form;
}

export function FormPageClient({ form }: FormPageClientProps) {
  const router = useRouter();
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion>>({});
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [aiAssisted, setAiAssisted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const completion = calculateCompletion(form.fields, formValues);

  const handleAISuggest = useCallback(
    (suggestions: AISuggestion[]) => {
      const suggestMap: Record<string, AISuggestion> = {};
      suggestions.forEach((s) => {
        suggestMap[s.fieldName] = s;
      });
      setAiSuggestions(suggestMap);
      setAiAssisted(true);
    },
    []
  );

  const handleAcceptSuggestion = useCallback((fieldName: string, value: unknown) => {
    setAcceptedSuggestions((prev) => new Set([...prev, fieldName]));
    setRejectedSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(fieldName);
      return next;
    });
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleRejectSuggestion = useCallback((fieldName: string) => {
    setRejectedSuggestions((prev) => new Set([...prev, fieldName]));
    setAcceptedSuggestions((prev) => {
      const next = new Set(prev);
      next.delete(fieldName);
      return next;
    });
    setAiSuggestions((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const handleFormChange = useCallback((values: Record<string, unknown>) => {
    setFormValues(values);
  }, []);

  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          data,
          completionPct: completion,
          aiAssisted,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");

      router.push(`/forms/${form.slug}/success`);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [form.id, form.slug, completion, aiAssisted, router]);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">All Forms</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold">SmartForm AI</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </div>

          {/* Completion Bar */}
          <CompletionBar
            completion={completion}
            fields={form.fields}
            values={formValues}
          />

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: AI Assist Panel */}
            <div className="xl:col-span-1 order-2 xl:order-1">
              <div className="sticky top-24">
                <AIAssistPanel
                  form={form}
                  currentValues={formValues}
                  onSuggest={handleAISuggest}
                  suggestions={aiSuggestions}
                  onAccept={handleAcceptSuggestion}
                  onReject={handleRejectSuggestion}
                />
              </div>
            </div>

            {/* Right: Form */}
            <div className="xl:col-span-2 order-1 xl:order-2">
              <DynamicFormRenderer
                form={form}
                aiSuggestions={aiSuggestions}
                acceptedSuggestions={acceptedSuggestions}
                rejectedSuggestions={rejectedSuggestions}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRejectSuggestion={handleRejectSuggestion}
                onChange={handleFormChange}
                onSubmit={(data) => {
                  setFormValues(data);
                  setShowConfirmDialog(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirm Dialog */}
      <SubmitConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        form={form}
        values={formValues}
        completion={completion}
        isSubmitting={isSubmitting}
        onConfirm={() => handleSubmit(formValues)}
      />
    </div>
  );
}
