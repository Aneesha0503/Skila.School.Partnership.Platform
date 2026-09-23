import React, { useState, useEffect } from 'react';
import { Play, Sparkles, RefreshCw, CheckCircle2, MapPin, Zap, ChevronRight, Award, Layers } from 'lucide-react';

const FALLBACK_STATES_DISTRICTS = {
  'Telangana': ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Sangareddy', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Andhra Pradesh': ['Visakhapatnam', 'Krishna', 'Guntur', 'NTR District', 'Tirupati', 'Chittoor', 'East Godavari'],
  'Karnataka': ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Dakshina Kannada', 'Belagavi'],
  'Maharashtra': ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Thane', 'Nagpur', 'Nashik'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Kanchipuram', 'Madurai', 'Chengalpattu'],
  'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'West Delhi', 'South West Delhi']
};

export default function DistrictRunner({ onDistrictRunComplete, currentDistrict, currentState }) {
  const [statesList, setStatesList] = useState(Object.keys(FALLBACK_STATES_DISTRICTS));
  const [districtsMap, setDistrictsMap] = useState(FALLBACK_STATES_DISTRICTS);
  
  const [selectedState, setSelectedState] = useState(currentState || 'Telangana');
  const [selectedDistrict, setSelectedDistrict] = useState(currentDistrict || 'Hyderabad');
  const [customDistrict, setCustomDistrict] = useState('');
  const [useCustomDistrict, setUseCustomDistrict] = useState(false);
  const [forceScrape, setForceScrape] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState('');

  // Fetch all official Indian States and Districts on mount
  useEffect(() => {
    async function loadStatesDistricts() {
      try {
        const res = await fetch('/api/states-districts');
        if (res.ok) {
          const data = await res.json();
          if (data.states && data.states.length > 0) {
            setStatesList(data.states);
            setDistrictsMap(data.districts_by_state || {});
          }
        }
      } catch (err) {
        console.warn('Could not load states-districts API, using default list:', err);
      }
    }
    loadStatesDistricts();
  }, []);

  // Sync if parent updates current state/district
  useEffect(() => {
    if (currentState && currentState !== selectedState) {
      setSelectedState(currentState);
    }
    if (currentDistrict && currentDistrict !== selectedDistrict) {
      setSelectedDistrict(currentDistrict);
    }
  }, [currentState, currentDistrict]);

  const districtList = districtsMap[selectedState] || [];
  const activeDistrict = useCustomDistrict ? customDistrict.trim() : selectedDistrict;

  const handleStateChange = (st) => {
    setSelectedState(st);
    const districts = districtsMap[st] || [];
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    } else {
      setSelectedDistrict('');
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
          count: 6,
          force_scrape: forceScrape
        })
      });

      if (res.ok) {
        const data = await res.json();
        const sourceLabel = data.source === 'mistral_ai' ? 'Mistral AI Live Scraped' : 'Loaded from Stored Database';
        setRunMessage(`Loaded ${data.count} schools in ${activeDistrict} (${sourceLabel})! Sorted High to Low.`);
        
        onDistrictRunComplete({
          state: selectedState,
          district: activeDistrict,
          schools: data.schools
        });

        setTimeout(() => setRunMessage(''), 5000);
      } else {
        alert('Failed to run district scraper. Please verify backend connection.');
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
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 mb-6 shadow-xl border border-indigo-700/40 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950 shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Automated District School Discovery & AI Scraper
              </h2>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Mistral 14B Powered
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Select any Indian State and District to automatically retrieve or scrape school profiles with 16 Info, 17 Tech, and 16 CRM fields.
            </p>
          </div>
        </div>

        {/* Force re-scrape toggle */}
        <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer self-start md:self-center bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <input
            type="checkbox"
            checked={forceScrape}
            onChange={(e) => setForceScrape(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
          />
          <span>Force fresh AI re-scrape</span>
        </label>
      </div>

      {/* Control Form */}
      <form onSubmit={handleRunDistrict} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5 items-end">
        {/* 1. State Selector */}
        <div className="md:col-span-4">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            1. Select State ({statesList.length} States & UTs)
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={isRunning}
            className="w-full text-xs rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white p-2.5 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
          >
            {statesList.map((st) => (
              <option key={st} value={st} className="bg-slate-900 text-white">{st}</option>
            ))}
          </select>
        </div>

        {/* 2. District Selector / Custom Input */}
        <div className="md:col-span-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              2. Select District ({districtList.length} in {selectedState})
            </label>
            <button
              type="button"
              onClick={() => setUseCustomDistrict(!useCustomDistrict)}
              className="text-[10px] text-amber-300 hover:text-amber-200 underline font-medium"
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
              className="w-full text-xs rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white p-2.5 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-400"
            />
          ) : (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={isRunning || districtList.length === 0}
              className="w-full text-xs rounded-xl bg-slate-800/90 border border-indigo-700/50 text-white p-2.5 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
            >
              {districtList.length === 0 ? (
                <option value="" className="bg-slate-900 text-white">No predefined districts</option>
              ) : (
                districtList.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
                ))
              )}
            </select>
          )}
        </div>

        {/* 3. Run Button */}
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={isRunning}
            className="w-full h-[40px] inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Researching Schools...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run District Schools</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tier Structure Guide */}
      <div className="mt-4 pt-3.5 border-t border-indigo-800/40 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
        <span className="font-semibold text-amber-300 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> High to Low Sort Order:
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-200 border border-purple-500/30">
          👑 1. High Range (International, Cambridge, CBSE, ICSE)
        </span>
        <ChevronRight className="w-3 h-3 text-slate-500 hidden sm:inline" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-200 border border-blue-500/30">
          🔷 2. State Board High Strength (1,200+ students)
        </span>
        <ChevronRight className="w-3 h-3 text-slate-500 hidden sm:inline" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-200 border border-amber-500/30">
          🔶 3. State Board Mid Strength (500–1,200)
        </span>
        <ChevronRight className="w-3 h-3 text-slate-500 hidden sm:inline" />
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-600">
          ⚪ 4. State Board Low Strength (&lt;500)
        </span>
      </div>

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
