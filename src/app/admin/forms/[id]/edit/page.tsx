import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormBuilder } from "@/components/admin/form-builder";
import type { Metadata } from "next";
import type { FormBuilderField } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Form" };

async function getForm(id: string) {
  try {
    return await prisma.form.findUnique({
      where: { id },
      include: { fields: { orderBy: { order: "asc" } } },
    });
  } catch {
    return null;
  }
}

export default async function EditFormPage({ params }: Props) {
  const { id } = await params;
  const form = await getForm(id);

  if (!form) notFound();

  const initialForm = {
    id: form.id,
    title: form.title,
    description: form.description || "",
    slug: form.slug,
    status: form.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    category: form.category || "",
    icon: form.icon || "FileText",
    fields: form.fields.map((f) => ({
      id: f.id,
      name: f.name,
      label: f.label,
      type: f.type as FormBuilderField["type"],
      placeholder: f.placeholder || "",
      helpText: f.helpText || "",
      required: f.required,
      order: f.order,
      options: (f.options as any) || undefined,
      validations: (f.validations as any) || undefined,
      defaultValue: f.defaultValue || "",
    })) as FormBuilderField[],
  };

  return (
    <div className="h-screen gradient-bg overflow-hidden">
      <FormBuilder initialForm={initialForm} />
    </div>
  );
}
