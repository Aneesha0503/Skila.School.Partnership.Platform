import React from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldCheck, Building2, Calendar, Award } from 'lucide-react';

export default function MOUPreviewModal({ school, formalities, onClose }) {
  if (!school) return null;

  const info = school.info || {};
  const hierarchy = school.hierarchy || {};
  const form = formalities || school.formalities || school.sales?.formalities || {};

  const mouNumber = form.mou_number || `SKILA-MOU-2026-${school.id?.substring(0, 6)?.toUpperCase() || 'REF'}`;
  const mouDate = form.mou_date || new Date().toISOString().substring(0, 10);
  const mouValidity = form.mou_validity || 'June 2026 – May 2027 (Academic Year 2026-2027)';
  const signatoryName = form.mou_signatory_name || info.principal_name || info.correspondent_name || 'Authorized Signatory';
  const signatoryRole = form.mou_signatory_designation || 'Principal / Institutional Head';
  const contractValue = form.contract_value || school.sales?.annual_fee_range || '₹2,50,000';
  const partnershipTier = form.partnership_tier || 'Skila AI Pioneer Partner';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Partnership Agreement (MOU)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Memorandum of Understanding • {info.school_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Formal Document Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 text-slate-800 dark:text-slate-200 font-sans print:p-0 print:m-0 print:overflow-visible">
          
          {/* Agreement Letterhead */}
          <div className="border-b-2 border-indigo-600 pb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-indigo-700 dark:text-indigo-400">SKILA</span>
                <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                  AI Education
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Skila Edutech AI Private Limited • School Partnership Division
              </p>
              <p className="text-[11px] text-slate-400">
                Official Document Ref: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{mouNumber}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                Status: {form.mou_status || 'Drafting'}
              </span>
              <p className="text-xs text-slate-500 mt-1 font-medium">Effective Date: {mouDate}</p>
              <p className="text-[11px] text-slate-400">Tenure: {mouValidity}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
              Memorandum of Understanding (MOU)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              FOR INTEGRATION OF SKILA ARTIFICIAL INTELLIGENCE & STEM CURRICULUM
            </p>
          </div>

          {/* Parties Involved */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4 text-xs leading-relaxed">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">
                BETWEEN:
              </h3>
              <p>
                <strong>Skila Edutech AI Private Limited</strong>, an educational technology enterprise pioneering generative AI and experiential computing for K-12 education (hereinafter referred to as <strong>"Skila AI"</strong>).
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">
                AND THE INSTITUTION:
              </h3>
              <p className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">
                {info.school_name || 'Partner School'}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {info.full_address || `${hierarchy.mandal || ''}, ${hierarchy.district || ''}, ${hierarchy.state || 'India'}`}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-[11px]">
                UDISE Code: {info.udise_code || 'N/A'} • Affiliated Board: {info.board || 'CBSE/State'} • Classification: {partnershipTier}
              </p>
            </div>
          </div>

          {/* Agreement Clauses */}
          <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase mb-1">
                1. Purpose & Scope of Partnership
              </h4>
              <p>
                The Institution agrees to adopt and deploy Skila AI's proprietary generative learning modules, hands-on STEM & Robotics lab tracks, and personalized student assessment suite for students from {info.classes_from || 'Grade 1'} to {info.classes_to || 'Grade 10'}.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase mb-1">
                2. Skila AI Commitments & Deliverables
              </h4>
              <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600 dark:text-slate-400">
                <li>Provide full institutional access to the Skila AI Learning Management & Analytics portal.</li>
                <li>Conduct accredited Teacher AI Enablement Orientation workshops for the designated school faculty.</li>
                <li>Ensure dedicated technical support and offline smart lab readiness guidance.</li>
                <li>Furnish periodic student cognitive growth reports and curriculum completion analytics to the school management.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase mb-1">
                3. Institution Responsibilities & SPOC
              </h4>
              <p>
                The Institution designates <strong>{form.school_spoc_name || signatoryName}</strong> ({form.school_spoc_designation || 'Institutional Coordinator'}) as the primary Single Point of Contact (SPOC) responsible for roster verification, smart lab access coordination, and curriculum scheduling.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase mb-1">
                4. Commercial Terms & Payment Schedule
              </h4>
              <p>
                The total agreed partnership fee is <strong>{contractValue}</strong> under <strong>{form.payment_terms || 'Annual Upfront'}</strong> terms. Invoicing shall be managed via Invoice Ref <strong>{form.invoice_number || 'INV-SKILA-PENDING'}</strong>, with tax compliance under applicable regulations.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase mb-1">
                5. Confidentiality & Intellectual Property
              </h4>
              <p>
                All courseware, AI models, software engines, and pedagogy methodologies remain the exclusive intellectual property of Skila Edutech AI Pvt. Ltd. Student data is safeguarded with end-to-end institutional grade encryption and will not be commercialized.
              </p>
            </div>
          </div>

          {/* Execution Signatures */}
          <div className="pt-8 border-t-2 border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                For Skila Edutech AI Pvt. Ltd.:
              </p>
              <div className="h-16 flex items-end">
                <div className="font-serif italic text-base text-indigo-700 dark:text-indigo-400 border-b border-slate-400 pb-1 w-48">
                  Authorized Signatory
                </div>
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Director of School Partnerships</p>
                <p className="text-slate-500">Skila Edutech AI Pvt. Ltd.</p>
                <p className="text-slate-400 text-[10px] font-mono mt-0.5">Seal: SKILA-CORP-VERIFIED</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                For {info.school_name || 'The Institution'}:
              </p>
              <div className="h-16 flex items-end">
                <div className="font-serif italic text-base text-slate-800 dark:text-slate-200 border-b border-slate-400 pb-1 w-48">
                  {signatoryName}
                </div>
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{signatoryName}</p>
                <p className="text-slate-500">{signatoryRole}</p>
                <p className="text-slate-400 text-[10px] font-mono mt-0.5">Date of Signing: {form.mou_signed_date || mouDate}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
