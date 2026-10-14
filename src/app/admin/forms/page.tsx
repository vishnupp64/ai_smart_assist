import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/utils";
import {
  Plus,
  Eye,
  Edit,
  Search,
  FileText,
  BarChart3,
  Users,
  Brain,
  Archive,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Forms" };

async function getForms(search?: string, status?: string) {
  try {
    return await prisma.form.findMany({
      where: {
        ...(status && status !== "all" ? { status: status as any } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ]
        } : {}),
      },
      include: {
        _count: { select: { submissions: true } },
        fields: { select: { id: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return [];
  }
}

interface Props {
  searchParams: Promise<{ search?: string; status?: string }>;
}

const STATUS_CONFIG = {
  PUBLISHED: { label: "Published", color: "text-green-400 bg-green-500/10 border-green-500/20", Icon: CheckCircle2 },
  DRAFT: { label: "Draft", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", Icon: Clock },
  ARCHIVED: { label: "Archived", color: "text-gray-400 bg-gray-500/10 border-gray-500/20", Icon: Archive },
};

export default async function AdminFormsPage({ searchParams }: Props) {
  const params = await searchParams;
  const forms = await getForms(params.search, params.status);

  return (
    <div className="min-h-screen gradient-bg">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 bottom-0 w-60 glass border-r border-white/5 z-40 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">SmartForm AI</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm transition-colors">
              <BarChart3 className="w-4 h-4" />Dashboard
            </Link>
            <Link href="/admin/forms" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20 text-sm font-medium">
              <FileText className="w-4 h-4" />Forms
            </Link>
            <Link href="/admin/submissions" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm transition-colors">
              <Users className="w-4 h-4" />Submissions
            </Link>
          </nav>
          <div className="p-3 border-t border-white/5">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm transition-colors">
              <Eye className="w-4 h-4" />View Site
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-60 flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Forms</h1>
              <p className="text-muted-foreground text-sm mt-1">{forms.length} form{forms.length !== 1 ? "s" : ""} total</p>
            </div>
            <Link
              href="/admin/forms/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/20"
            >
              <Plus className="w-4 h-4" />
              New Form
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <form className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="search"
                defaultValue={params.search}
                placeholder="Search forms..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-muted-foreground/50"
              />
            </form>
            <div className="flex gap-2">
              {["all", "PUBLISHED", "DRAFT", "ARCHIVED"].map((status) => (
                <Link
                  key={status}
                  href={`/admin/forms${status !== "all" ? `?status=${status}` : ""}`}
                  className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                    (params.status || "all") === status
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "glass text-muted-foreground hover:text-foreground border border-white/5"
                  }`}
                >
                  {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                </Link>
              ))}
            </div>
          </div>

          {/* Forms Grid */}
          {forms.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground mb-4">No forms found.</p>
              <Link href="/admin/forms/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold">
                <Plus className="w-4 h-4" />Create First Form
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {forms.map((form) => {
                const statusCfg = STATUS_CONFIG[form.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = statusCfg.Icon;
                return (
                  <div key={form.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-violet-500/20 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-sm">{form.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>
                    {form.description && (
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{form.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      <span>{form.fields.length} fields</span>
                      <span>•</span>
                      <span>{form._count.submissions} submissions</span>
                      <span>•</span>
                      <span>{formatDateShort(form.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/forms/${form.slug}`} target="_blank"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass border border-white/5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Eye className="w-3.5 h-3.5" />Preview
                      </Link>
                      <Link href={`/admin/forms/${form.id}/edit`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 transition-colors ml-auto">
                        <Edit className="w-3.5 h-3.5" />Edit
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
