"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import type { FormBuilderField, FieldType } from "@/types";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  ChevronUp,
  ChevronDown,
  Copy,
  Settings,
  Type,
  Mail,
  Phone,
  Hash,
  Calendar,
  AlignLeft,
  ChevronDown as SelectIcon,
  CheckSquare,
  Circle,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD_TYPES: Array<{ type: FieldType; label: string; icon: React.ElementType }> = [
  { type: "TEXT", label: "Text", icon: Type },
  { type: "EMAIL", label: "Email", icon: Mail },
  { type: "TEL", label: "Phone", icon: Phone },
  { type: "NUMBER", label: "Number", icon: Hash },
  { type: "DATE", label: "Date", icon: Calendar },
  { type: "TEXTAREA", label: "Textarea", icon: AlignLeft },
  { type: "SELECT", label: "Select", icon: SelectIcon },
  { type: "CHECKBOX", label: "Checkbox", icon: CheckSquare },
  { type: "RADIO", label: "Radio", icon: Circle },
];

interface FormBuilderProps {
  initialForm?: {
    id?: string;
    title: string;
    description: string;
    slug: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    category: string;
    icon: string;
    fields: FormBuilderField[];
  };
}

let tempIdCounter = 0;
function genId() {
  return `temp_${++tempIdCounter}`;
}

export function FormBuilder({ initialForm }: FormBuilderProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const [formMeta, setFormMeta] = useState({
    title: initialForm?.title || "",
    description: initialForm?.description || "",
    slug: initialForm?.slug || "",
    status: initialForm?.status || "DRAFT" as const,
    category: initialForm?.category || "",
    icon: initialForm?.icon || "FileText",
  });

  const [fields, setFields] = useState<FormBuilderField[]>(
    initialForm?.fields || []
  );

  const addField = useCallback((type: FieldType) => {
    const id = genId();
    const newField: FormBuilderField = {
      id,
      name: `field_${type.toLowerCase()}_${id}`,
      label: type.charAt(0) + type.slice(1).toLowerCase(),
      type,
      required: false,
      order: fields.length,
      placeholder: "",
      helpText: "",
      options: type === "SELECT" || type === "RADIO" || type === "CHECKBOX"
        ? [{ label: "Option 1", value: "option_1" }]
        : undefined,
    };
    setFields((prev) => [...prev, newField]);
    setActiveFieldId(id);
  }, [fields.length]);

  const updateField = useCallback((id: string, updates: Partial<FormBuilderField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (activeFieldId === id) setActiveFieldId(null);
  }, [activeFieldId]);

  const moveField = useCallback((id: string, dir: "up" | "down") => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx === -1) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const newFields = [...prev];
      [newFields[idx], newFields[newIdx]] = [newFields[newIdx], newFields[idx]];
      return newFields.map((f, i) => ({ ...f, order: i }));
    });
  }, []);

  const duplicateField = useCallback((id: string) => {
    const field = fields.find((f) => f.id === id);
    if (!field) return;
    const newId = genId();
    setFields((prev) => [
      ...prev,
      {
        ...field,
        id: newId,
        name: `${field.name}_copy`,
        label: `${field.label} (Copy)`,
        order: prev.length,
      },
    ]);
  }, [fields]);

  const handleSave = async (status?: "DRAFT" | "PUBLISHED") => {
    if (!formMeta.title.trim()) {
      toast.error("Form title is required");
      return;
    }
    if (fields.length === 0) {
      toast.error("Add at least one field");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formMeta,
        status: status || formMeta.status,
        slug: formMeta.slug || slugify(formMeta.title),
        fields: fields.map((f, i) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder,
          helpText: f.helpText,
          required: f.required,
          order: i,
          options: f.options,
          validations: f.validations,
          defaultValue: f.defaultValue,
        })),
      };

      const url = initialForm?.id
        ? `/api/forms/${initialForm.id}`
        : "/api/forms";
      const method = initialForm?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }

      toast.success(
        initialForm?.id ? "Form updated!" : "Form created!",
        { description: status === "PUBLISHED" ? "Form is now live." : "Saved as draft." }
      );

      router.push("/admin/forms");
      router.refresh();
    } catch (error: any) {
      toast.error("Failed to save", { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const activeField = fields.find((f) => f.id === activeFieldId);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Field Type Palette */}
      <div className="w-56 border-r border-white/5 glass flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-white/5">
          <p className="text-xs font-medium text-muted-foreground">FIELD TYPES</p>
        </div>
        <div className="p-3 space-y-1">
          {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => addField(type)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-violet-400" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Form Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 glass">
          <div className="flex-1">
            <input
              value={formMeta.title}
              onChange={(e) => setFormMeta((p) => ({
                ...p,
                title: e.target.value,
                slug: p.slug || slugify(e.target.value),
              }))}
              placeholder="Form Title..."
              className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
            />
          </div>
          <select
            value={formMeta.status}
            onChange={(e) => setFormMeta((p) => ({ ...p, status: e.target.value as any }))}
            className="text-sm bg-secondary/50 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Publish
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Form Meta */}
          <div className="glass rounded-2xl p-5 mb-4 border border-white/5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <input
                  value={formMeta.description}
                  onChange={(e) => setFormMeta((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Form description..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
                <input
                  value={formMeta.slug}
                  onChange={(e) => setFormMeta((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="form-slug"
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder:text-muted-foreground/50 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <input
                  value={formMeta.category}
                  onChange={(e) => setFormMeta((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Support, HR..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </div>

          {/* Fields List */}
          {fields.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center border-2 border-dashed border-white/10">
              <Plus className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground text-sm">
                Click a field type on the left to add fields
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, idx) => {
                const FieldIcon = FIELD_TYPES.find((t) => t.type === field.type)?.icon || Type;
                const isActive = activeFieldId === field.id;

                return (
                  <div
                    key={field.id}
                    onClick={() => setActiveFieldId(isActive ? null : field.id)}
                    className={cn(
                      "glass rounded-xl border cursor-pointer transition-all",
                      isActive
                        ? "border-violet-500/40 shadow-lg shadow-violet-500/10"
                        : "border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground/30" />
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <FieldIcon className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{field.label}</p>
                        <p className="text-xs text-muted-foreground">{field.type} · {field.name}</p>
                      </div>
                      {field.required && (
                        <span className="text-xs text-red-400 border border-red-400/20 bg-red-500/10 px-1.5 py-0.5 rounded">Required</span>
                      )}
                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => moveField(field.id, "up")} disabled={idx === 0}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveField(field.id, "down")} disabled={idx === fields.length - 1}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => duplicateField(field.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeField(field.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Field Settings Panel */}
      <div className={cn(
        "w-80 border-l border-white/5 glass flex flex-col overflow-y-auto transition-all duration-200",
        !activeField && "opacity-50"
      )}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-violet-400" />
            <p className="text-sm font-medium">
              {activeField ? `Edit: ${activeField.label}` : "Field Settings"}
            </p>
            {activeField && (
              <button onClick={() => setActiveFieldId(null)} className="ml-auto p-1 rounded hover:bg-white/5 text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {activeField ? (
          <FieldSettingsPanel
            field={activeField}
            onChange={(updates) => updateField(activeField.id, updates)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground text-sm">
            <div>
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-20" />
              Click a field to edit its settings
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldSettingsPanel({
  field,
  onChange,
}: {
  field: FormBuilderField;
  onChange: (updates: Partial<FormBuilderField>) => void;
}) {
  const inputClass = "w-full px-3 py-2 rounded-lg bg-secondary/50 border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder:text-muted-foreground/50";

  const addOption = () => {
    const options = field.options || [];
    const n = options.length + 1;
    onChange({ options: [...options, { label: `Option ${n}`, value: `option_${n}` }] });
  };

  const updateOption = (idx: number, key: "label" | "value", val: string) => {
    const options = [...(field.options || [])];
    options[idx] = { ...options[idx], [key]: val };
    onChange({ options });
  };

  const removeOption = (idx: number) => {
    onChange({ options: field.options?.filter((_, i) => i !== idx) });
  };

  return (
    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
      {/* Label */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Label *</label>
        <input value={field.label} onChange={(e) => onChange({ label: e.target.value })}
          className={inputClass} placeholder="Field label" />
      </div>

      {/* Name */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Field Name (ID) *</label>
        <input value={field.name} onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
          className={cn(inputClass, "font-mono")} placeholder="field_name" />
      </div>

      {/* Placeholder */}
      {!["CHECKBOX", "RADIO"].includes(field.type) && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Placeholder</label>
          <input value={field.placeholder || ""} onChange={(e) => onChange({ placeholder: e.target.value })}
            className={inputClass} placeholder="Placeholder text..." />
        </div>
      )}

      {/* Help Text */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Help Text</label>
        <input value={field.helpText || ""} onChange={(e) => onChange({ helpText: e.target.value })}
          className={inputClass} placeholder="Helpful description..." />
      </div>

      {/* Required */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm text-muted-foreground">Required field</span>
        <div
          onClick={() => onChange({ required: !field.required })}
          className={cn(
            "relative w-9 h-5 rounded-full transition-colors cursor-pointer",
            field.required ? "bg-violet-600" : "bg-secondary"
          )}
        >
          <div className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            field.required ? "translate-x-4" : "translate-x-0.5"
          )} />
        </div>
      </label>

      {/* Options (for SELECT, RADIO) */}
      {(field.type === "SELECT" || field.type === "RADIO") && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">Options</label>
            <button onClick={addOption} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <Plus className="w-3 h-3" />Add
            </button>
          </div>
          <div className="space-y-2">
            {field.options?.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input value={opt.label} onChange={(e) => updateOption(idx, "label", e.target.value)}
                  placeholder="Label" className={cn(inputClass, "flex-1 text-xs py-1.5")} />
                <input value={opt.value} onChange={(e) => updateOption(idx, "value", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  placeholder="value" className={cn(inputClass, "w-24 text-xs py-1.5 font-mono")} />
                <button onClick={() => removeOption(idx)}
                  className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validations */}
      {["TEXT", "TEXTAREA", "NUMBER"].includes(field.type) && (
        <div>
          <label className="text-xs text-muted-foreground block mb-2">Validations</label>
          <div className="space-y-2">
            {(field.type === "NUMBER") ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Min</label>
                  <input type="number" value={field.validations?.min ?? ""} onChange={(e) => onChange({ validations: { ...field.validations, min: e.target.value ? Number(e.target.value) : undefined } })}
                    className={cn(inputClass, "text-xs")} placeholder="Min" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Max</label>
                  <input type="number" value={field.validations?.max ?? ""} onChange={(e) => onChange({ validations: { ...field.validations, max: e.target.value ? Number(e.target.value) : undefined } })}
                    className={cn(inputClass, "text-xs")} placeholder="Max" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Min Length</label>
                  <input type="number" value={field.validations?.minLength ?? ""} onChange={(e) => onChange({ validations: { ...field.validations, minLength: e.target.value ? Number(e.target.value) : undefined } })}
                    className={cn(inputClass, "text-xs")} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Max Length</label>
                  <input type="number" value={field.validations?.maxLength ?? ""} onChange={(e) => onChange({ validations: { ...field.validations, maxLength: e.target.value ? Number(e.target.value) : undefined } })}
                    className={cn(inputClass, "text-xs")} placeholder="∞" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
