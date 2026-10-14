import { FormBuilder } from "@/components/admin/form-builder";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create New Form" };

export default function NewFormPage() {
  return (
    <div className="h-screen gradient-bg overflow-hidden">
      {/* Mini nav */}
      <div className="absolute top-0 left-0 right-0 z-10 h-0" />
      <FormBuilder />
    </div>
  );
}
