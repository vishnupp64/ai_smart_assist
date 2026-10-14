import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIReviewSchema } from "@/lib/validations";
import { reviewFormAnswers } from "@/lib/gemini";
import type { FormField } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formId, answers } = AIReviewSchema.parse(body);

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

    const result = await reviewFormAnswers(fields, answers);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    console.error("[POST /api/ai/review]", error);
    return NextResponse.json({ error: "Form review failed" }, { status: 500 });
  }
}
