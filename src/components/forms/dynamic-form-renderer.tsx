"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import type { Form, FormField, AISuggestion } from "@/types";
import { Sparkles, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { useState } from "react";

interface DynamicFormRendererProps {
  form: Form;
  aiSuggestions: Record<string, AISuggestion>;
  acceptedSuggestions: Set<string>;
  rejectedSuggestions: Set<string>;
  onAcceptSuggestion: (fieldName: string, value: unknown) => void;
  onRejectSuggestion: (fieldName: string) => void;
  onChange: (values: Record<string, unknown>) => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

function buildZodSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case "EMAIL":
        schema = z.string().email("Invalid email address");
        break;
      case "TEL":
        schema = z.string().regex(/^[\d\s\+\-\(\)]{7,20}$/, "Invalid phone number").or(z.literal(""));
        break;
      case "NUMBER":
        schema = z.coerce.number();
        if (field.validations?.min !== undefined) {
          schema = (schema as z.ZodNumber).min(field.validations.min, `Minimum value is ${field.validations.min}`);
        }
        if (field.validations?.max !== undefined) {
          schema = (schema as z.ZodNumber).max(field.validations.max, `Maximum value is ${field.validations.max}`);
        }
        break;
      case "DATE":
        schema = z.string();
        break;
      case "CHECKBOX":
        schema = z.boolean().or(z.string());
        break;
      case "SELECT":
      case "RADIO":
        schema = z.string();
        break;
      default:
        schema = z.string();
        if (field.validations?.minLength) {
          schema = (schema as z.ZodString).min(field.validations.minLength, `Minimum ${field.validations.minLength} characters`);
        }
        if (field.validations?.maxLength) {
          schema = (schema as z.ZodString).max(field.validations.maxLength, `Maximum ${field.validations.maxLength} characters`);
        }
        if (field.validations?.pattern) {
          schema = (schema as z.ZodString).regex(
            new RegExp(field.validations.pattern),
            field.validations.patternMessage || "Invalid format"
          );
        }
    }

    if (!field.required) {
      schema = schema.optional().or(z.literal("")).or(z.literal(null));
    }

    shape[field.name] = schema;
  }

  return z.object(shape);
}

export function DynamicFormRenderer({
  form,
  aiSuggestions,
  acceptedSuggestions,
  rejectedSuggestions,
  onAcceptSuggestion,
  onRejectSuggestion,
  onChange,
  onSubmit,
}: DynamicFormRendererProps) {
  const schema = useMemo(() => buildZodSchema(form.fields), [form.fields]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      form.fields.map((f) => [f.name, f.defaultValue || ""])
    ),
    mode: "onChange",
  });

  // Sync form values to parent
  const watchedValues = watch();
  useEffect(() => {
    onChange(watchedValues as Record<string, unknown>);
  }, [JSON.stringify(watchedValues)]);

  // Apply AI suggestions when accepted
  useEffect(() => {
    for (const fieldName of acceptedSuggestions) {
      const suggestion = aiSuggestions[fieldName];
      if (suggestion) {
        setValue(fieldName as any, suggestion.suggestedValue as any, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [acceptedSuggestions, aiSuggestions]);

  const onFormSubmit = (data: Record<string, unknown>) => {
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit as any)}
      className="space-y-4"
    >
      <div className="glass rounded-2xl p-6 space-y-6">
        {form.fields.map((field) => {
          const suggestion = aiSuggestions[field.name];
          const isAccepted = acceptedSuggestions.has(field.name);
          const isRejected = rejectedSuggestions.has(field.name);
          const hasSuggestion = suggestion && !isRejected;
          const error = errors[field.name];

          return (
            <div key={field.id} className={cn("space-y-2 field-hover p-3 rounded-xl -mx-3", {
              "ai-suggested": hasSuggestion && isAccepted,
            })}>
              {/* Label */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-400">*</span>}
                  {hasSuggestion && (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
                      <Sparkles className="w-3 h-3" />
                      AI suggested
                    </span>
                  )}
                </label>
              </div>

              {/* Field Input */}
              <Controller
                name={field.name as any}
                control={control}
                render={({ field: rhfField }) => (
                  <FieldInput
                    field={field}
                    rhfField={rhfField}
                    hasSuggestion={hasSuggestion}
                    isAccepted={isAccepted}
                  />
                )}
              />

              {/* Help Text */}
              {field.helpText && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  {field.helpText}
                </p>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {String(error.message)}
                </p>
              )}

              {/* AI Suggestion Action Bar */}
              {hasSuggestion && !isAccepted && (
                <div className="flex items-center gap-2 pt-1">
                  <p className="text-xs text-muted-foreground flex-1">
                    AI suggests:{" "}
                    <span className="text-violet-300 font-medium">
                      {Array.isArray(suggestion.suggestedValue)
                        ? suggestion.suggestedValue.join(", ")
                        : String(suggestion.suggestedValue)}
                    </span>
                    <span className={cn("ml-2 px-1 rounded text-xs", {
                      "text-green-400": suggestion.confidence === "HIGH",
                      "text-yellow-400": suggestion.confidence === "MEDIUM",
                      "text-red-400": suggestion.confidence === "LOW",
                    })}>
                      ({suggestion.confidence})
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => onAcceptSuggestion(field.name, suggestion.suggestedValue)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectSuggestion(field.name)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 text-muted-foreground hover:bg-white/10 transition-colors"
                  >
                    <XCircle className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              )}

              {isAccepted && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  AI suggestion accepted
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
      >
        Review & Submit
      </button>
    </form>
  );
}

// Sub-component for individual field rendering
function FieldInput({
  field,
  rhfField,
  hasSuggestion,
  isAccepted,
}: {
  field: FormField;
  rhfField: any;
  hasSuggestion: boolean;
  isAccepted: boolean;
}) {
  const baseClass = cn(
    "w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border text-slate-100 text-sm transition-all",
    "focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500",
    "placeholder:text-slate-400 font-normal",
    {
      "border-white/15": !hasSuggestion || !isAccepted,
      "ai-suggested border-violet-500/70": hasSuggestion && isAccepted,
    }
  );

  switch (field.type) {
    case "TEXTAREA":
      return (
        <textarea
          {...rhfField}
          placeholder={field.placeholder}
          rows={4}
          className={cn(baseClass, "resize-y min-h-[100px]")}
        />
      );

    case "SELECT":
      return (
        <select {...rhfField} className={baseClass}>
          <option value="">Select an option...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "RADIO":
      return (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                value={opt.value}
                checked={rhfField.value === opt.value}
                onChange={() => rhfField.onChange(opt.value)}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      );

    case "CHECKBOX":
      return (
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={!!rhfField.value}
            onChange={(e) => rhfField.onChange(e.target.checked)}
            className="w-4 h-4 accent-violet-500 rounded"
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {field.label}
          </span>
        </label>
      );

    case "NUMBER":
      return (
        <input
          type="number"
          {...rhfField}
          placeholder={field.placeholder}
          min={field.validations?.min}
          max={field.validations?.max}
          className={baseClass}
        />
      );

    case "DATE":
      return (
        <input
          type="date"
          {...rhfField}
          className={baseClass}
        />
      );

    case "EMAIL":
      return (
        <input
          type="email"
          {...rhfField}
          placeholder={field.placeholder}
          className={baseClass}
        />
      );

    case "TEL":
      return (
        <input
          type="tel"
          {...rhfField}
          placeholder={field.placeholder}
          className={baseClass}
        />
      );

    default:
      return (
        <input
          type="text"
          {...rhfField}
          placeholder={field.placeholder}
          className={baseClass}
        />
      );
  }
}
