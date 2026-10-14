import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIExplainSchema } from "@/lib/validations";
import { explainFormField } from "@/lib/gemini";
import type { FormField } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fieldId, formId } = AIExplainSchema.parse(body);

    const form = await prisma.form.findFirst({
      where: { OR: [{ id: formId }, { slug: formId }] },
      include: { fields: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const field = form.fields.find((f) => f.id === fieldId || f.name === fieldId);

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    const fieldData = {
      ...field,
      options: field.options as any,
      validations: field.validations as any,
    } as FormField;

    const result = await explainFormField(fieldData);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    console.error("[POST /api/ai/explain]", error);
    return NextResponse.json({ error: "Field explanation failed" }, { status: 500 });
  }
}
