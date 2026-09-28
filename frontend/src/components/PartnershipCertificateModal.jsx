import React from 'react';
import { X, Printer, Award, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

export default function PartnershipCertificateModal({ school, formalities, onClose }) {
  if (!school) return null;

  const info = school.info || {};
  const hierarchy = school.hierarchy || {};
  const form = formalities || school.formalities || school.sales?.formalities || {};

  const certId = `SKILA-CERT-2026-${school.id?.substring(0, 6)?.toUpperCase() || 'PARTNER'}`;
  const issueDate = form.formalities_completed_at 
    ? new Date(form.formalities_completed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const academicYear = form.academic_year || '2026 – 2027';
  const tier = form.partnership_tier || 'Skila AI Pioneer Partner Institution';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-white">Official Partnership Certificate</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950 print:p-0 print:m-0 print:bg-white print:overflow-visible">
          
          <div className="w-full max-w-3xl bg-radial from-slate-900 via-slate-950 to-slate-950 border-4 border-double border-amber-400/80 rounded-2xl p-8 sm:p-12 text-center relative shadow-2xl overflow-hidden print:border-amber-600 print:text-slate-900 print:bg-white">
            
            {/* Corner Decorative Accents */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

            {/* Top Brand & Badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <img
                src="/skila_logo_dark.png"
                alt="Skila.ai"
                className="h-10 w-auto object-contain print:hidden"
              />
              <img
                src="/skila_logo_clean.png"
                alt="Skila.ai"
                className="h-10 w-auto object-contain hidden print:block"
              />
            </div>

            <p className="text-[11px] uppercase tracking-[0.3em] text-amber-400/90 font-bold mb-6">
              INSTITUTIONAL PARTNERSHIP NETWORK
            </p>

            {/* Certificate Header */}
            <h1 className="text-2xl sm:text-4xl font-serif font-extrabold text-white tracking-wide mb-3 print:text-slate-950">
              Certificate of Partnership
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 italic mb-6">
              This prestigious certificate of educational excellence and technological integration is conferred upon
            </p>

            {/* School Name Headline */}
            <div className="py-4 my-2 border-y border-amber-500/20">
              <h2 className="text-xl sm:text-3xl font-extrabold text-amber-300 font-serif tracking-tight print:text-slate-900">
                {info.school_name || 'Partner School'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {hierarchy.district ? `${hierarchy.district}, ` : ''}{hierarchy.state || 'India'}
                {info.udise_code ? ` • UDISE: ${info.udise_code}` : ''}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto my-6 print:text-slate-700">
              In formal recognition of our collaborative dedication toward equipping students with 
              generative artificial intelligence, computer science competencies, and next-generation STEM pedagogy
              as an authorized <strong>{tier}</strong> for the academic year <strong>{academicYear}</strong>.
            </p>

            {/* Official Seal and Signatures */}
            <div className="pt-8 mt-6 border-t border-slate-800 grid grid-cols-3 items-center gap-4">
              
              {/* Left Signature */}
              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <span className="font-serif italic text-sm text-amber-300/80 border-b border-slate-600 pb-0.5 px-4">
                    Dr. Ananya Rao
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-300 print:text-slate-800">Dr. Ananya Rao</p>
                <p className="text-[10px] text-slate-500">Chief Academic Officer, Skila AI</p>
              </div>

              {/* Center Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-400 flex flex-col items-center justify-center bg-radial from-amber-500/20 to-amber-950/40 p-2 shadow-lg shadow-amber-500/10">
                  <Award className="w-6 h-6 text-amber-400 mb-0.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-300">CERTIFIED</span>
                  <span className="text-[7px] text-amber-400/80 font-mono">2026-27</span>
                </div>
              </div>

              {/* Right Signature */}
              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <span className="font-serif italic text-sm text-amber-300/80 border-b border-slate-600 pb-0.5 px-4">
                    Arjun Sengupta
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-300 print:text-slate-800">Arjun Sengupta</p>
                <p className="text-[10px] text-slate-500">VP, Institutional Alliances</p>
              </div>

            </div>

            {/* Bottom Verification Footer */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Date of Issue: {issueDate}</span>
              <span>Certificate ID: {certId}</span>
              <span>Verification: skila.ai/verify</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
