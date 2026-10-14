import { z } from "zod";

// Form field validation
export const FieldOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const FieldValidationsSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
});

export const FormFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Field name is required").regex(/^[a-z_][a-z0-9_]*$/, "Field name must be lowercase with underscores only"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["TEXT", "EMAIL", "TEL", "NUMBER", "DATE", "TEXTAREA", "SELECT", "CHECKBOX", "RADIO"]),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number().int().default(0),
  options: z.array(FieldOptionSchema).optional(),
  validations: FieldValidationsSchema.optional(),
  defaultValue: z.string().optional(),
});

// Create form schema
export const CreateFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  category: z.string().optional(),
  icon: z.string().optional(),
  fields: z.array(FormFieldSchema).min(1, "At least one field is required"),
});

export type CreateFormInput = z.infer<typeof CreateFormSchema>;

// Update form schema
export const UpdateFormSchema = CreateFormSchema.partial();
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>;

// Submission schema
export const CreateSubmissionSchema = z.object({
  formId: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  completionPct: z.number().min(0).max(100).default(0),
  aiAssisted: z.boolean().default(false),
});

// AI request schemas
export const AISuggestSchema = z.object({
  description: z.string().min(10, "Please provide a more detailed description"),
  formId: z.string().min(1),
});

export const AIFollowUpSchema = z.object({
  description: z.string(),
  formId: z.string(),
  knownValues: z.record(z.string(), z.unknown()),
});

export const AIExplainSchema = z.object({
  fieldId: z.string(),
  formId: z.string(),
});

export const AIReviewSchema = z.object({
  formId: z.string(),
  answers: z.record(z.string(), z.unknown()),
});
