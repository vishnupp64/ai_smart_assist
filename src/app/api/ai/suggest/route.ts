import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AISuggestSchema } from "@/lib/validations";
import { suggestFieldValues } from "@/lib/gemini";
import type { FormField } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, formId } = AISuggestSchema.parse(body);

    // Get form with fields
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

    const result = await suggestFieldValues(description, fields);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    console.error("[POST /api/ai/suggest]", error);
    return NextResponse.json({ error: "AI suggestion failed" }, { status: 500 });
  }
}
