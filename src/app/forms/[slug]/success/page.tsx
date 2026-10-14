import Link from "next/link";
import { CheckCircle2, Home, ChevronRight, Brain, Sparkles, Clock, Mail, MessageSquare } from "lucide-react";

export default function FormSuccessPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Content Card */}
        <div className="glass rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl backdrop-blur-xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
            <span className="gradient-text">Submission Received!</span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-6">
            Your form has been processed and submitted successfully. All details have been securely recorded.
          </p>

          {/* AI Badge */}
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Verified & completed with AI assistance
          </div>

          {/* What's Next Steps Box */}
          <div className="bg-slate-900/80 rounded-2xl p-5 border border-white/10 text-left space-y-4 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              What happens next:
            </p>

            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-violet-300" />
              </div>
              <span className="text-sm text-slate-200 leading-snug">
                We'll review your submission within <strong className="text-white">1–2 business days</strong>.
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-violet-300" />
              </div>
              <span className="text-sm text-slate-200 leading-snug">
                You'll receive a confirmation email with a reference ID.
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare className="w-3.5 h-3.5 text-violet-300" />
              </div>
              <span className="text-sm text-slate-200 leading-snug">
                Our support team will reach out directly with next steps.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:-translate-y-0.5"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <Link
              href="/#forms"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-white/10 rounded-xl font-semibold text-sm transition-all hover:text-white hover:-translate-y-0.5"
            >
              Browse More Forms
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Brain className="w-4 h-4 text-violet-400" />
          <span>SmartForm AI — Powered by Google Gemini</span>
        </div>
      </div>
    </div>
  );
}
