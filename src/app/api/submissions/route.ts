import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateSubmissionSchema } from "@/lib/validations";

// GET /api/submissions - List submissions (admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const submissions = await prisma.submission.findMany({
      where: {
        ...(formId ? { formId } : {}),
      },
      include: {
        form: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.submission.count({
      where: { ...(formId ? { formId } : {}) },
    });

    return NextResponse.json({ submissions, total, page, limit });
  } catch (error) {
    console.error("[GET /api/submissions]", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// POST /api/submissions - Create a submission
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateSubmissionSchema.parse(body);

    // Verify form exists and is published
    const form = await prisma.form.findUnique({
      where: { id: validated.formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Form is not accepting submissions" }, { status: 403 });
    }

    const submission = await prisma.submission.create({
      data: {
        formId: validated.formId,
        data: validated.data as any,
        completionPct: validated.completionPct,
        aiAssisted: validated.aiAssisted,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid submission data", details: error.errors }, { status: 400 });
    }
    console.error("[POST /api/submissions]", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
