import React, { useState } from 'react';
import { 
  X, Sparkles, Bot, Search, MapPin, Building, 
  Check, CheckCircle2, RefreshCw, Plus, ArrowRight, ShieldCheck 
} from 'lucide-react';

export default function MistralScraperModal({ onClose, onImportSuccess }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('Telangana');
  const [district, setDistrict] = useState('Hyderabad');
  const [mandal, setMandal] = useState('');
  const [count, setCount] = useState(3);
  
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedSchools, setScrapedSchools] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const handleStartScrape = async (e) => {
    e.preventDefault();
    setIsScraping(true);
    setScrapedSchools([]);
    setSelectedIds(new Set());
    setImportMessage('');

    try {
      const res = await fetch('/api/ai/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || undefined,
          state: state || undefined,
          district: district || undefined,
          mandal: mandal || undefined,
          count: Number(count),
          auto_save: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        setScrapedSchools(data.schools || []);
        // Select all by default
        const allIds = new Set((data.schools || []).map(s => s.id));
        setSelectedIds(allIds);
      } else {
        alert('Failed to scrape schools with Mistral AI. Please try again.');
      }
    } catch (err) {
      console.error('Scraping error:', err);
      alert('Network error while calling Mistral AI.');
    } finally {
      setIsScraping(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImportSelected = async () => {
    const toImport = scrapedSchools.filter(s => selectedIds.has(s.id));
    if (toImport.length === 0) return;

    setIsImporting(true);
    try {
      const res = await fetch('/api/ai/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schools: toImport })
      });

      if (res.ok) {
        const data = await res.json();
        setImportMessage(`Successfully imported ${data.count} schools into platform!`);
        setTimeout(() => {
          onImportSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shrink-0 flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-950">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Mistral AI School Scraper & Intelligence
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  ministral-14b
                </span>
              </div>
              <p className="text-xs text-slate-300">
                AI auto-discovers schools with 6-tier administrative hierarchy, infrastructure, and sales CRM metrics
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Config Form */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <form onSubmit={handleStartScrape} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Telangana, Andhra Pradesh"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Hyderabad, Rangareddy"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mandal / Sub-Region</label>
                <input
                  type="text"
                  value={mandal}
                  onChange={(e) => setMandal(e.target.value)}
                  placeholder="e.g. Shaikpet, Gachibowli, Alwal"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Schools to Discover</label>
                <select
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="2">2 Schools</option>
                  <option value="3">3 Schools</option>
                  <option value="4">4 Schools</option>
                  <option value="5">5 Schools</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Optional prompt or specific school name (e.g. 'Top CBSE schools with robotics and ATL labs in Kokapet')"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isScraping}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold shadow-sm transition shrink-0"
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mistral AI Scraping...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run AI Scraper</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Area */}
        <div className="p-5 overflow-y-auto flex-1 bg-white">
          {isScraping && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Mistral 14B is Researching & Scrapping School Profiles...
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Querying educational directories, mapping administrative boundaries, evaluating tech adoption, and calculating Skila AI opportunity metrics.
              </p>
            </div>
          )}

          {!isScraping && scrapedSchools.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Building className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Configure region parameters or enter a custom prompt above, then click <strong>Run AI Scraper</strong>.</p>
            </div>
          )}

          {!isScraping && scrapedSchools.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">
                  Discovered {scrapedSchools.length} Schools ({selectedIds.size} selected)
                </span>
                <button
                  onClick={() => {
                    if (selectedIds.size === scrapedSchools.length) setSelectedIds(new Set());
                    else setSelectedIds(new Set(scrapedSchools.map(s => s.id)));
                  }}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  {selectedIds.size === scrapedSchools.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {scrapedSchools.map((s) => {
                  const isChecked = selectedIds.has(s.id);
                  const { hierarchy, info, technology, sales } = s;

                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      className={`p-4 rounded-xl border text-xs transition cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-3 ${isChecked ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 font-semibold border border-slate-200">
                              UDISE: {info?.udise_code}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                              {info?.board}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-bold">
                              {sales?.skila_ai_potential} AI Potential
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-sm mb-1">{info?.school_name}</h4>
                          <p className="text-slate-500 flex items-center gap-1 text-[11px] mb-2">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {hierarchy?.village_locality_ward}, {hierarchy?.mandal} Mdl, {hierarchy?.district}, {hierarchy?.state}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-600">
                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                              Students: <strong>{info?.student_strength?.toLocaleString()}</strong>
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                              ERP: <strong>{technology?.erp_used}</strong> ({technology?.erp_vendor || 'None'})
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                              Coding: <strong>{technology?.coding_used}</strong>
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                              ATL Lab: <strong>{technology?.atl_lab}</strong>
                            </span>
                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                              Decision Maker: <strong>{sales?.decision_maker}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee Bracket</span>
                        <span className="font-bold text-emerald-700">{sales?.annual_fee_range}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Import Action */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {importMessage ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {importMessage}
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Powered by Mistral AI (<code>ministral-14b-latest</code>)
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Close
            </button>
            {scrapedSchools.length > 0 && (
              <button
                onClick={handleImportSelected}
                disabled={isImporting || selectedIds.size === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {isImporting ? 'Importing...' : `Import ${selectedIds.size} Schools to Platform`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
