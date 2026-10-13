// Core type definitions for SmartForm AI

export type FieldType =
  | "TEXT"
  | "EMAIL"
  | "TEL"
  | "NUMBER"
  | "DATE"
  | "TEXTAREA"
  | "SELECT"
  | "CHECKBOX"
  | "RADIO";

export type FormStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type Role = "USER" | "ADMIN";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidations {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FormField {
  id: string;
  formId: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  options?: FieldOption[];
  validations?: FieldValidations;
  defaultValue?: string;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  slug: string;
  status: FormStatus;
  category?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  fields: FormField[];
  _count?: {
    submissions: number;
  };
}

export interface Submission {
  id: string;
  formId: string;
  form?: Form;
  userId?: string;
  data: Record<string, unknown>;
  completionPct: number;
  aiAssisted: boolean;
  createdAt: Date;
}

// AI-related types

export interface AISuggestion {
  fieldName: string;
  suggestedValue: string | string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  source: "EXTRACTED" | "INFERRED";
  uncertain?: boolean;
}

export interface AIFieldSuggestions {
  suggestions: AISuggestion[];
  missingRequired: string[];
  followUpNeeded: boolean;
}

export interface AIFollowUpQuestion {
  fieldName: string;
  question: string;
  reason: string;
}

export interface AIFollowUpQuestions {
  questions: AIFollowUpQuestion[];
}

export interface AIFieldExplanation {
  fieldName: string;
  explanation: string;
  examples?: string[];
  tips?: string[];
}

export interface AIValidationIssue {
  fieldName: string;
  type: "MISSING" | "INVALID_FORMAT" | "CONFLICT" | "INCOMPLETE";
  message: string;
  suggestion?: string;
}

export interface AIReviewResult {
  issues: AIValidationIssue[];
  completionPct: number;
  isValid: boolean;
  summary: string;
}

// Form builder types
export interface FormBuilderField extends Omit<FormField, "id" | "formId"> {
  id: string; // Local temp ID
  tempId?: string;
}
