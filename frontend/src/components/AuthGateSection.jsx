import React from 'react';
import { Lock, LogIn, UserPlus, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AuthGateSection({ onOpenLogin, onOpenRegister }) {
  return (
    <section 
      id="auth-gate-section" 
      className="relative overflow-hidden my-8 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 p-6 sm:p-10 shadow-xl"
    >
      {/* Background ambient decorative shapes */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        
        {/* Protected Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-bold tracking-wide shadow-2xs">
          <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Institutional Access Restricted • Authentication Required</span>
        </div>

        {/* Headline & Description */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Sign In to Access School Intelligence & CRM Pipeline
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            You are currently exploring in guest preview mode. Sign in to your authorized Skila team account to unlock automated district discovery, the 49-field verified school directory, field notes, and formal onboarding workflows.
          </p>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenLogin}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm shadow-md hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Access Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenRegister}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-sm shadow-2xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Register Team Member</span>
          </button>
        </div>

        {/* Security / RBAC Guarantee footer */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected by Enterprise Role-Based Access Control (RBAC) & Cryptographic JWT Authentication</span>
        </div>

      </div>
    </section>
  );
}
