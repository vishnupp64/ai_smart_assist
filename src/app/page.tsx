import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/utils";
import {
  MessageSquare,
  AlertTriangle,
  UserPlus,
  Briefcase,
  Headphones,
  FileText,
  Zap,
  Shield,
  ChevronRight,
  Brain,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  AlertTriangle,
  UserPlus,
  Briefcase,
  Headphones,
  FileText,
};

const CATEGORY_COLORS: Record<string, string> = {
  General: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  Support: "from-orange-500/20 to-red-500/20 border-orange-500/30",
  Account: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  HR: "from-purple-500/20 to-violet-500/20 border-purple-500/30",
};

async function getForms() {
  try {
    return await prisma.form.findMany({
      where: { status: "PUBLISHED" },
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [totalForms, totalSubmissions] = await Promise.all([
      prisma.form.count({ where: { status: "PUBLISHED" } }),
      prisma.submission.count(),
    ]);
    return { totalForms, totalSubmissions };
  } catch {
    return { totalForms: 0, totalSubmissions: 0 };
  }
}

export default async function HomePage() {
  const [forms, stats] = await Promise.all([getForms(), getStats()]);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">SmartForm AI</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Powered by Google Gemini AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-white">
            <span className="gradient-text">Complete forms</span>
            <br />
            smarter, not harder
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            SmartForm AI understands your context, autofills fields from natural
            language descriptions, detects errors, and guides you to perfect
            form submissions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#forms"
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
            >
              Browse Forms
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Feature Pills */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {[
            { icon: Brain, text: "AI Autofill" },
            { icon: CheckCircle2, text: "Smart Validation" },
            { icon: Shield, text: "Error Detection" },
            { icon: TrendingUp, text: "Completion Tracking" },
            { icon: Clock, text: "Follow-up Questions" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground"
            >
              <Icon className="w-3.5 h-3.5 text-violet-400" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Row */}
      {(stats.totalForms > 0 || stats.totalSubmissions > 0) && (
        <section className="pb-16 px-4">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-violet-400">{stats.totalForms}</div>
              <div className="text-sm text-muted-foreground mt-1">Available Forms</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-400">{stats.totalSubmissions}</div>
              <div className="text-sm text-muted-foreground mt-1">Submissions Made</div>
            </div>
          </div>
        </section>
      )}

      {/* Forms Grid */}
      <section id="forms" className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Available Forms</h2>
            <p className="text-muted-foreground">
              Select a form to get started. AI assistance is available on every form.
            </p>
          </div>

          {forms.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No forms available yet.</p>
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center gap-2 text-violet-400 hover:text-violet-300"
              >
                Go to Admin to create forms
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => {
                const Icon = ICON_MAP[form.icon || "FileText"] || FileText;
                const colorClass =
                  CATEGORY_COLORS[form.category || ""] ||
                  "from-violet-500/20 to-purple-500/20 border-violet-500/30";

                return (
                  <Link
                    key={form.id}
                    href={`/forms/${form.slug}`}
                    className="group block"
                  >
                    <div className="glass rounded-2xl p-6 border border-white/5 hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10 h-full">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} border flex items-center justify-center`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {form.category && (
                          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                            {form.category}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-violet-300 transition-colors">
                        {form.title}
                      </h3>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {form.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Brain className="w-3.5 h-3.5 text-violet-400" />
                          AI Assisted
                        </div>
                        <div className="flex items-center gap-1 text-xs text-violet-400 font-medium">
                          Open form
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">SmartForm AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by Google Gemini · Built with Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
