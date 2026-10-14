import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateFormSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/forms - List all forms
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const forms = await prisma.form.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(category ? { category } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ]
        } : {}),
      },
      include: {
        fields: { orderBy: { order: "asc" } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("[GET /api/forms]", error);
    return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 });
  }
}

// POST /api/forms - Create a new form
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateFormSchema.parse(body);

    const slug = validated.slug || slugify(validated.title);

    // Check slug uniqueness
    const existing = await prisma.form.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A form with this slug already exists" },
        { status: 409 }
      );
    }

    const form = await prisma.form.create({
      data: {
        title: validated.title,
        description: validated.description,
        slug,
        status: validated.status,
        category: validated.category,
        icon: validated.icon,
        publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
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
      },
      include: {
        fields: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid form data", details: error.errors }, { status: 400 });
    }
    console.error("[POST /api/forms]", error);
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 });
  }
}
