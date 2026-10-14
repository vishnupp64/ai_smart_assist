import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import type {
  FormField,
  AIFieldSuggestions,
  AIFollowUpQuestions,
  AIFieldExplanation,
  AIReviewResult,
} from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ------------- Zod validation schemas for AI responses -------------

const AISuggestionSchema = z.object({
  fieldName: z.string(),
  suggestedValue: z.union([z.string(), z.array(z.string())]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  source: z.enum(["EXTRACTED", "INFERRED"]),
  uncertain: z.boolean().optional(),
});

const AIFieldSuggestionsSchema = z.object({
  suggestions: z.array(AISuggestionSchema),
  missingRequired: z.array(z.string()),
  followUpNeeded: z.boolean(),
});

const AIFollowUpQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      fieldName: z.string(),
      question: z.string(),
      reason: z.string(),
    })
  ),
});

const AIFieldExplanationSchema = z.object({
  fieldName: z.string(),
  explanation: z.string(),
  examples: z.array(z.string()).optional(),
  tips: z.array(z.string()).optional(),
});

const AIReviewResultSchema = z.object({
  issues: z.array(
    z.object({
      fieldName: z.string(),
      type: z.enum(["MISSING", "INVALID_FORMAT", "CONFLICT", "INCOMPLETE"]),
      message: z.string(),
      suggestion: z.string().optional(),
    })
  ),
  completionPct: z.number().min(0).max(100),
  isValid: z.boolean(),
  summary: z.string(),
});

// ------------- Gemini model helper -------------

function getModel(structured: boolean = false) {
  return genAI.getGenerativeModel({
    model: "gemini-3.7-flash",
    generationConfig: structured
      ? {
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      : {
          temperature: 0.3,
        },
  });
}

function formSchemaToText(fields: FormField[]): string {
  return fields
    .map(
      (f) =>
        `- ${f.name} (${f.label}): type=${f.type}, required=${f.required}${
          f.options
            ? `, options=[${f.options.map((o) => o.value).join(", ")}]`
            : ""
        }${f.validations ? `, validations=${JSON.stringify(f.validations)}` : ""}`
    )
    .join("\n");
}

// ------------- AI Functions -------------

/**
 * Suggest field values based on a natural-language description
 */
export async function suggestFieldValues(
  description: string,
  fields: FormField[]
): Promise<AIFieldSuggestions> {
  const model = getModel(true);
  const schemaText = formSchemaToText(fields);

  const prompt = `
You are an AI form assistant. Based on the user's description, extract and suggest values for form fields.
IMPORTANT: Never fabricate personal details. Use empty string "" for any unknown information.
Only suggest values that can be directly extracted or reasonably inferred from the description.

User Description:
"""
${description}
"""

Form Fields:
${schemaText}

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "fieldName": "field_name",
      "suggestedValue": "value or [] for multi-select",
      "confidence": "HIGH|MEDIUM|LOW",
      "source": "EXTRACTED|INFERRED",
      "uncertain": false
    }
  ],
  "missingRequired": ["field_name_1", "field_name_2"],
  "followUpNeeded": true|false
}

Only include fields where you have a suggestion. List required fields with no data in missingRequired.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return AIFieldSuggestionsSchema.parse(parsed);
  } catch (error) {
    console.warn("[Gemini AI] Suggestion fallback:", (error as Error).message);
    // Return safe fallback
    return {
      suggestions: [],
      missingRequired: fields.filter((f) => f.required).map((f) => f.name),
      followUpNeeded: true,
    };
  }
}

/**
 * Generate follow-up questions for missing or unclear fields
 */
export async function generateFollowUpQuestions(
  description: string,
  fields: FormField[],
  knownValues: Record<string, unknown>
): Promise<AIFollowUpQuestions> {
  const model = getModel(true);
  const schemaText = formSchemaToText(fields);
  const knownText = JSON.stringify(knownValues, null, 2);

  const prompt = `
You are an AI form assistant. The user has provided a description and some form fields are already filled.
Generate concise, friendly follow-up questions for any missing required fields or fields that need clarification.

User Description:
"""
${description}
"""

Form Fields:
${schemaText}

Already Known Values:
${knownText}

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "fieldName": "field_name",
      "question": "friendly question to ask the user",
      "reason": "why this information is needed"
    }
  ]
}

Only ask about fields that are required and not yet filled, or fields with unclear/conflicting values.
Keep questions brief and friendly. Maximum 5 questions.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return AIFollowUpQuestionsSchema.parse(parsed);
  } catch (error) {
    console.warn("[Gemini AI] Follow-up fallback:", (error as Error).message);
    return { questions: [] };
  }
}

/**
 * Explain a form field in simple, plain language
 */
export async function explainFormField(
  field: FormField
): Promise<AIFieldExplanation> {
  const model = getModel(true);

  const prompt = `
You are a helpful form assistant. Explain this form field in simple, plain language that anyone can understand.

Field Definition:
- Name: ${field.name}
- Label: ${field.label}
- Type: ${field.type}
- Required: ${field.required}
${field.helpText ? `- Help Text: ${field.helpText}` : ""}
${field.options ? `- Options: ${field.options.map((o) => o.label).join(", ")}` : ""}
${field.validations ? `- Validations: ${JSON.stringify(field.validations)}` : ""}

Return a JSON object with this exact structure:
{
  "fieldName": "${field.name}",
  "explanation": "clear explanation in 1-2 sentences",
  "examples": ["example1", "example2"],
  "tips": ["helpful tip 1", "helpful tip 2"]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return AIFieldExplanationSchema.parse(parsed);
  } catch (error) {
    console.warn("[Gemini AI] Explanation fallback:", (error as Error).message);
    return {
      fieldName: field.name,
      explanation: field.helpText || `Enter your ${field.label.toLowerCase()}.`,
      examples: [],
      tips: [],
    };
  }
}

/**
 * Review all form answers for completeness, format validity, and conflicts
 */
export async function reviewFormAnswers(
  fields: FormField[],
  answers: Record<string, unknown>
): Promise<AIReviewResult> {
  const model = getModel(true);
  const schemaText = formSchemaToText(fields);
  const answersText = JSON.stringify(answers, null, 2);

  const prompt = `
You are a form validation assistant. Review the provided form answers against the field definitions.
Identify: missing required fields, invalid formats, incomplete answers, and conflicting values.

Form Fields:
${schemaText}

User's Answers:
${answersText}

Return a JSON object with this exact structure:
{
  "issues": [
    {
      "fieldName": "field_name",
      "type": "MISSING|INVALID_FORMAT|CONFLICT|INCOMPLETE",
      "message": "clear description of the issue",
      "suggestion": "optional suggestion to fix it"
    }
  ],
  "completionPct": 75,
  "isValid": false,
  "summary": "brief overall assessment"
}

completionPct should be 0-100 based on how many required fields are filled correctly.
isValid should be true only if all required fields are filled with valid values.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return AIReviewResultSchema.parse(parsed);
  } catch (error) {
    console.warn("[Gemini AI] Review fallback:", (error as Error).message);
    // Calculate basic completion manually
    const requiredFields = fields.filter((f) => f.required);
    const filledRequired = requiredFields.filter(
      (f) => answers[f.name] !== undefined && answers[f.name] !== ""
    );
    const pct =
      requiredFields.length > 0
        ? Math.round((filledRequired.length / requiredFields.length) * 100)
        : 100;

    return {
      issues: [],
      completionPct: pct,
      isValid: pct === 100,
      summary: "Basic verification completed.",
    };
  }
}
