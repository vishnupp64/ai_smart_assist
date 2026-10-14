import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  BarChart3,
  FileText,
  Users,
  Brain,
  Eye,
  Search,
  Download,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Submissions" };

interface Props {
  searchParams: Promise<{ formId?: string; page?: string; search?: string }>;
}

async function getSubmissions(formId?: string, page: number = 1) {
  try {
    const limit = 20;
    const where = formId ? { formId } : {};

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          form: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    return { submissions, total, pages: Math.ceil(total / limit) };
  } catch {
    return { submissions: [], total: 0, pages: 0 };
  }
}

async function getForms() {
  try {
    return await prisma.form.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function AdminSubmissionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const [{ submissions, total, pages }, forms] = await Promise.all([
    getSubmissions(params.formId, page),
    getForms(),
  ]);

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
            <Link href="/admin/forms" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm transition-colors">
              <FileText className="w-4 h-4" />Forms
            </Link>
            <Link href="/admin/submissions" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20 text-sm font-medium">
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
              <h1 className="text-2xl font-bold">Submissions</h1>
              <p className="text-muted-foreground text-sm mt-1">{total} total submission{total !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <select className="px-3 py-2.5 rounded-xl bg-secondary/50 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50">
              <option value="">All Forms</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>{f.title}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Form</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Completion</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">AI Assisted</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Submitted</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Data Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        No submissions yet.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => {
                      const dataEntries = Object.entries(sub.data as Record<string, unknown>)
                        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
                        .slice(0, 3);

                      return (
                        <tr key={sub.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium">{sub.form?.title}</p>
                            <p className="text-xs text-muted-foreground font-mono">{sub.id.slice(0, 8)}...</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                                  style={{ width: `${sub.completionPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{Math.round(sub.completionPct)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {sub.aiAssisted ? (
                              <span className="flex items-center gap-1 text-xs text-violet-400">
                                <Brain className="w-3 h-3" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {formatDate(sub.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              {dataEntries.map(([key, val]) => (
                                <p key={key} className="text-xs">
                                  <span className="text-muted-foreground">{key}: </span>
                                  <span className="text-foreground">{String(val).slice(0, 30)}</span>
                                </p>
                              ))}
                              {Object.keys(sub.data as object).length > 3 && (
                                <p className="text-xs text-muted-foreground">+{Object.keys(sub.data as object).length - 3} more</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {pages} · {total} submissions
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/admin/submissions?page=${page - 1}${params.formId ? `&formId=${params.formId}` : ""}`}
                      className="px-3 py-1.5 rounded-lg glass border border-white/5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Previous
                    </Link>
                  )}
                  {page < pages && (
                    <Link
                      href={`/admin/submissions?page=${page + 1}${params.formId ? `&formId=${params.formId}` : ""}`}
                      className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
