import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateShort, truncate } from "@/lib/utils";
import {
  Brain,
  Plus,
  FileText,
  Users,
  BarChart3,
  Settings,
  Eye,
  Edit,
  CheckCircle2,
  Clock,
  Archive,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

async function getStats() {
  try {
    const [
      totalForms,
      publishedForms,
      draftForms,
      totalSubmissions,
      recentSubmissions,
    ] = await Promise.all([
      prisma.form.count(),
      prisma.form.count({ where: { status: "PUBLISHED" } }),
      prisma.form.count({ where: { status: "DRAFT" } }),
      prisma.submission.count(),
      prisma.submission.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return { totalForms, publishedForms, draftForms, totalSubmissions, recentSubmissions };
  } catch {
    return {
      totalForms: 0, publishedForms: 0, draftForms: 0,
      totalSubmissions: 0, recentSubmissions: 0,
    };
  }
}

async function getForms() {
  try {
    return await prisma.form.findMany({
      include: {
        _count: { select: { submissions: true } },
        fields: { select: { id: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });
  } catch {
    return [];
  }
}

async function getRecentSubmissions() {
  try {
    return await prisma.submission.findMany({
      include: {
        form: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch {
    return [];
  }
}

const STATUS_CONFIG = {
  PUBLISHED: { label: "Published", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  DRAFT: { label: "Draft", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  ARCHIVED: { label: "Archived", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
};

export default async function AdminDashboard() {
  const [stats, forms, submissions] = await Promise.all([
    getStats(),
    getForms(),
    getRecentSubmissions(),
  ]);

  const STAT_CARDS = [
    { label: "Total Forms", value: stats.totalForms, icon: FileText, color: "from-violet-500 to-purple-600" },
    { label: "Published", value: stats.publishedForms, icon: CheckCircle2, color: "from-green-500 to-emerald-600" },
    { label: "Total Submissions", value: stats.totalSubmissions, icon: Users, color: "from-blue-500 to-cyan-600" },
    { label: "Last 7 Days", value: stats.recentSubmissions, icon: TrendingUp, color: "from-orange-500 to-red-500" },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Sidebar + Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 bottom-0 w-60 glass border-r border-white/5 z-40 flex flex-col">
          {/* Logo */}
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

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20 text-sm font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/forms"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              Forms
            </Link>
            <Link
              href="/admin/submissions"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm transition-colors"
            >
              <Users className="w-4 h-4" />
              Submissions
            </Link>
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/5">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Site
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-60 flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your forms and view submission analytics
              </p>
            </div>
            <Link
              href="/admin/forms/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/20"
            >
              <Plus className="w-4 h-4" />
              New Form
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {/* Forms Table */}
          <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">Recent Forms</h2>
              <Link href="/admin/forms" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Form</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Fields</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Submissions</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Updated</th>
                    <th className="text-left px-6 py-3 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No forms yet. Create your first form!
                      </td>
                    </tr>
                  ) : (
                    forms.map((form) => {
                      const status = STATUS_CONFIG[form.status] || STATUS_CONFIG.DRAFT;
                      return (
                        <tr key={form.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{form.title}</p>
                              <p className="text-xs text-muted-foreground">{form.slug}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {form.fields.length}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {form._count.submissions}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {formatDateShort(form.updatedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/forms/${form.slug}`}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/admin/forms/${form.id}/edit`}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold">Recent Submissions</h2>
              <Link href="/admin/submissions" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                View all →
              </Link>
            </div>
            {submissions.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No submissions yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {submissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{sub.form?.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateShort(sub.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                            style={{ width: `${sub.completionPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round(sub.completionPct)}%</span>
                      </div>
                      {sub.aiAssisted && (
                        <span className="flex items-center gap-1 text-xs text-violet-400">
                          <Brain className="w-3 h-3" />
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
