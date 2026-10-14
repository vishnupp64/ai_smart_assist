import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIFollowUpSchema } from "@/lib/validations";
import { generateFollowUpQuestions } from "@/lib/gemini";
import type { FormField } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, formId, knownValues } = AIFollowUpSchema.parse(body);

    const form = await prisma.form.findFirst({
      where: { OR: [{ id: formId }, { slug: formId }] },
      include: { fields: { orderBy: { order: "asc" } } },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const fields = form.fields.map((f) => ({
      ...f,
      options: f.options as any,
      validations: f.validations as any,
    })) as FormField[];

    const result = await generateFollowUpQuestions(description, fields, knownValues);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    console.error("[POST /api/ai/followup]", error);
    return NextResponse.json({ error: "Follow-up generation failed" }, { status: 500 });
  }
}
