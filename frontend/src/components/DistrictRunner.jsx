import React, { useState } from 'react';
import { Play, Sparkles, RefreshCw, CheckCircle2, MapPin, Zap } from 'lucide-react';

const POPULAR_STATES_DISTRICTS = {
  'Telangana': ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Sangareddy', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Andhra Pradesh': ['Visakhapatnam', 'Krishna', 'Guntur', 'NTR District', 'Tirupati', 'Chittoor', 'East Godavari'],
  'Karnataka': ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Dakshina Kannada', 'Belagavi'],
  'Maharashtra': ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Thane', 'Nagpur', 'Nashik'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Kanchipuram', 'Madurai', 'Chengalpattu'],
  'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'West Delhi', 'South West Delhi']
};

export default function DistrictRunner({ onDistrictRunComplete, currentDistrict, currentState }) {
  const [selectedState, setSelectedState] = useState(currentState || 'Telangana');
  const [selectedDistrict, setSelectedDistrict] = useState(currentDistrict || 'Hyderabad');
  const [customDistrict, setCustomDistrict] = useState('');
  const [useCustomDistrict, setUseCustomDistrict] = useState(false);
  const [forceScrape, setForceScrape] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState('');

  const districtList = POPULAR_STATES_DISTRICTS[selectedState] || [];
  const activeDistrict = useCustomDistrict ? customDistrict.trim() : selectedDistrict;

  const handleStateChange = (st) => {
    setSelectedState(st);
    const districts = POPULAR_STATES_DISTRICTS[st] || [];
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    }
    setUseCustomDistrict(false);
  };

  const handleRunDistrict = async (e) => {
    e?.preventDefault();
    if (!selectedState || !activeDistrict) {
      alert('Please select or enter both a State and a District.');
      return;
    }

    setIsRunning(true);
    setRunMessage(`Mistral 14B is researching and scraping schools in ${activeDistrict}, ${selectedState}...`);

    try {
      const res = await fetch('/api/run-district', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: selectedState,
          district: activeDistrict,
          count: 5,
          force_scrape: forceScrape
        })
      });

      if (res.ok) {
        const data = await res.json();
        const sourceLabel = data.source === 'mistral_ai' ? 'Mistral AI Live Scraper' : 'Stored Database';
        setRunMessage(`Loaded ${data.count} schools for ${activeDistrict} (${sourceLabel})!`);
        
        onDistrictRunComplete({
          state: selectedState,
          district: activeDistrict,
          schools: data.schools
        });

        setTimeout(() => setRunMessage(''), 4500);
      } else {
        alert('Failed to run district scraper. Please try again.');
        setRunMessage('');
      }
    } catch (err) {
      console.error('District runner error:', err);
      alert('Network error while running district scraper.');
      setRunMessage('');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 mb-6 shadow-lg border border-indigo-800/40 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-950 shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Automated District School Discovery & Scraper
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                Mistral 14B Powered
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Select a State and District to automatically scrape revenue divisions, mandals, local bodies, wards, and school intelligence
            </p>
          </div>
        </div>

        {/* Force re-scrape toggle */}
        <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer self-start md:self-center">
          <input
            type="checkbox"
            checked={forceScrape}
            onChange={(e) => setForceScrape(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
          />
          <span>Force fresh AI re-scrape</span>
        </label>
      </div>

      {/* Control Row */}
      <form onSubmit={handleRunDistrict} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
        {/* 1. State Selector */}
        <div className="md:col-span-4">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
            1. Select State
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={isRunning}
            className="w-full text-xs rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            {Object.keys(POPULAR_STATES_DISTRICTS).map((st) => (
              <option key={st} value={st} className="bg-slate-900 text-white">{st}</option>
            ))}
          </select>
        </div>

        {/* 2. District Selector / Custom Input */}
        <div className="md:col-span-5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              2. Select or Enter District
            </label>
            <button
              type="button"
              onClick={() => setUseCustomDistrict(!useCustomDistrict)}
              className="text-[10px] text-indigo-300 hover:text-indigo-200 underline font-medium"
            >
              {useCustomDistrict ? 'Choose from list' : '+ Enter custom district'}
            </button>
          </div>

          {useCustomDistrict ? (
            <input
              type="text"
              value={customDistrict}
              onChange={(e) => setCustomDistrict(e.target.value)}
              placeholder="e.g. Warangal, Mysuru, Pune..."
              disabled={isRunning}
              className="w-full text-xs rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-400 focus:outline-none placeholder-slate-400"
            />
          ) : (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={isRunning}
              className="w-full text-xs rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            >
              {districtList.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
              ))}
            </select>
          )}
        </div>

        {/* 3. Run Button */}
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={isRunning}
            className="w-full h-[38px] inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all duration-200 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Running Scraper...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run District</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live status / progress banner */}
      {isRunning && (
        <div className="mt-3.5 pt-3 border-t border-indigo-800/40 flex items-center gap-2 text-xs text-amber-300 animate-pulse">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{runMessage}</span>
        </div>
      )}

      {!isRunning && runMessage && (
        <div className="mt-3.5 pt-3 border-t border-indigo-800/40 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{runMessage}</span>
        </div>
      )}
    </div>
  );
}
