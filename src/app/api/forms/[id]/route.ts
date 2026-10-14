import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdateFormSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/forms/[id] - Get form by ID or slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const form = await prisma.form.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        fields: { orderBy: { order: "asc" } },
        _count: { select: { submissions: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("[GET /api/forms/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch form" }, { status: 500 });
  }
}

// PATCH /api/forms/[id] - Update form
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateFormSchema.parse(body);

    // Get current form
    const current = await prisma.form.findUnique({
      where: { id },
      include: { fields: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const slug = validated.slug ? validated.slug : current.slug;

    // Update form and replace fields
    const form = await prisma.$transaction(async (tx) => {
      if (validated.fields) {
        // Delete existing fields and recreate
        await tx.formField.deleteMany({ where: { formId: id } });
      }

      return tx.form.update({
        where: { id },
        data: {
          ...(validated.title !== undefined && { title: validated.title }),
          ...(validated.description !== undefined && { description: validated.description }),
          ...(validated.slug !== undefined && { slug }),
          ...(validated.status !== undefined && {
            status: validated.status,
            publishedAt: validated.status === "PUBLISHED" && !current.publishedAt ? new Date() : current.publishedAt,
          }),
          ...(validated.category !== undefined && { category: validated.category }),
          ...(validated.icon !== undefined && { icon: validated.icon }),
          ...(validated.fields && {
            fields: {
              create: validated.fields.map((field) => ({
                name: field.name,
                label: field.label,
                type: field.type,
                placeholder: field.placeholder,
                helpText: field.helpText,
                required: field.required,
                order: field.order,
                options: field.options ? field.options : undefined,
                validations: field.validations ? field.validations : undefined,
                defaultValue: field.defaultValue,
              })),
            },
          }),
        },
        include: {
          fields: { orderBy: { order: "asc" } },
        },
      });
    });

    return NextResponse.json(form);
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid form data", details: error.errors }, { status: 400 });
    }
    console.error("[PATCH /api/forms/[id]]", error);
    return NextResponse.json({ error: "Failed to update form" }, { status: 500 });
  }
}

// DELETE /api/forms/[id] - Archive or delete form
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.form.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    return NextResponse.json({ message: "Form archived successfully" });
  } catch (error) {
    console.error("[DELETE /api/forms/[id]]", error);
    return NextResponse.json({ error: "Failed to archive form" }, { status: 500 });
  }
}
