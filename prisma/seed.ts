import { prisma } from "@/lib/prisma";
import { FORM_TEMPLATES } from "@/lib/form-templates";
import { slugify } from "@/lib/utils";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@smartform.ai" },
    update: {},
    create: {
      email: "admin@smartform.ai",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create demo user
  const userPassword = await bcrypt.hash("user123", 12);
  await prisma.user.upsert({
    where: { email: "demo@smartform.ai" },
    update: {},
    create: {
      email: "demo@smartform.ai",
      name: "Demo User",
      password: userPassword,
      role: "USER",
    },
  });
  console.log("✅ Demo user created: demo@smartform.ai");

  // Create forms from templates
  for (const template of FORM_TEMPLATES) {
    const slug = template.slug || slugify(template.title);

    // Check if form already exists
    const existing = await prisma.form.findUnique({ where: { slug } });
    if (existing) {
      console.log(`⏭️  Form already exists: ${template.title}`);
      continue;
    }

    const form = await prisma.form.create({
      data: {
        title: template.title,
        description: template.description,
        slug,
        status: template.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        category: template.category,
        icon: template.icon,
        createdBy: admin.id,
        publishedAt: template.status === "PUBLISHED" ? new Date() : null,
        fields: {
          create: template.fields.map((field) => ({
            name: field.name,
            label: field.label,
            type: field.type,
            placeholder: field.placeholder,
            helpText: field.helpText,
            required: field.required,
            order: field.order,
            options: field.options ? (field.options as any) : undefined,
            validations: field.validations
              ? (field.validations as any)
              : undefined,
            defaultValue: field.defaultValue,
          })),
        },
      },
    });

    console.log(`✅ Created form: ${form.title} (${form.slug})`);
  }

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
