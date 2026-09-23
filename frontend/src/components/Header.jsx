import React from 'react';
import { School, Database, Download, Plus, Sparkles } from 'lucide-react';

export default function Header({ statusInfo, onOpenAddModal, onOpenMistralScraper, onExportCsv }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Skila</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Partnership Platform
                </span>
              </div>
              <p className="text-xs text-slate-500">School Intelligence & EdTech Partnership Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-600 font-medium">
                {statusInfo?.firebase_live ? 'Firebase Firestore (Live)' : 'Firestore Engine (Local)'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* Export CSV button */}
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>

            {/* Mistral AI Scraper button */}
            <button
              onClick={onOpenMistralScraper}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-lg transition shadow-sm shadow-purple-200 border border-purple-400/20"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Mistral AI Scraper
            </button>

            {/* Add School button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Add School
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
