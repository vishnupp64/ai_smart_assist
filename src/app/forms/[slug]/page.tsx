import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormPageClient } from "@/components/forms/form-page-client";
import type { Metadata } from "next";
import type { Form } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const form = await getForm(slug);

  if (!form) return { title: "Form Not Found" };

  return {
    title: form.title,
    description: form.description || `Complete the ${form.title} form with AI assistance.`,
  };
}

async function getForm(slug: string) {
  try {
    return await prisma.form.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { fields: { orderBy: { order: "asc" } } },
    });
  } catch {
    return null;
  }
}

export default async function FormPage({ params }: Props) {
  const { slug } = await params;
  const form = await getForm(slug);

  if (!form) {
    notFound();
  }

  // Serialize dates and JSON fields
  const serializedForm: Form = {
    ...form,
    description: form.description ?? undefined,
    category: form.category ?? undefined,
    icon: form.icon ?? undefined,
    status: form.status as Form["status"],
    createdAt: new Date(form.createdAt),
    updatedAt: new Date(form.updatedAt),
    publishedAt: form.publishedAt ? new Date(form.publishedAt) : undefined,
    fields: form.fields.map((f) => ({
      ...f,
      type: f.type as any,
      placeholder: f.placeholder ?? undefined,
      helpText: f.helpText ?? undefined,
      defaultValue: f.defaultValue ?? undefined,
      options: (f.options as any) || undefined,
      validations: (f.validations as any) || undefined,
    })),
  };

  return <FormPageClient form={serializedForm} />;
}
