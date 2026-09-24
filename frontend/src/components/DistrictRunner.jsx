import React, { useState, useEffect } from 'react';
import { Building2, RefreshCw, CheckCircle2, Search, Plus, Lock, ShieldAlert } from 'lucide-react';

const FALLBACK_STATES_DISTRICTS = {
  'Telangana': ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Sangareddy', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Siddipet'],
  'Andhra Pradesh': ['Visakhapatnam', 'Krishna', 'Guntur', 'NTR District', 'Tirupati', 'Chittoor', 'East Godavari'],
  'Karnataka': ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Dakshina Kannada', 'Belagavi'],
  'Maharashtra': ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Thane', 'Nagpur', 'Nashik'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Kanchipuram', 'Madurai', 'Chengalpattu'],
  'Delhi': ['New Delhi', 'South Delhi', 'North Delhi', 'West Delhi', 'South West Delhi']
};

export default function DistrictRunner({ 
  onDistrictRunComplete, 
  currentDistrict, 
  currentState, 
  totalSchoolsLoaded,
  userRole = 'admin'
}) {
  const [statesList, setStatesList] = useState(Object.keys(FALLBACK_STATES_DISTRICTS));
  const [districtsMap, setDistrictsMap] = useState(FALLBACK_STATES_DISTRICTS);
  
  const [selectedState, setSelectedState] = useState(currentState || 'Telangana');
  const [selectedDistrict, setSelectedDistrict] = useState(currentDistrict || 'Hyderabad');
  const [customDistrict, setCustomDistrict] = useState('');
  const [useCustomDistrict, setUseCustomDistrict] = useState(false);
  const [scanCount, setScanCount] = useState(25);
  const [forceScrape, setForceScrape] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isScrapingMore, setIsScrapingMore] = useState(false);
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

  const handleRunDistrict = async (e, scrapeMore = false) => {
    e?.preventDefault();
    if (!selectedState || !activeDistrict) {
      alert('Please select or enter both a State and a District.');
      return;
    }

    if (scrapeMore) {
      setIsScrapingMore(true);
      setRunMessage(`Discovering additional schools in ${activeDistrict}...`);
    } else {
      setIsRunning(true);
      setRunMessage(`Discovering schools in ${activeDistrict}, ${selectedState}...`);
    }

    try {
      const res = await fetch('/api/run-district', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': userRole
        },
        body: JSON.stringify({
          state: selectedState,
          district: activeDistrict,
          count: scrapeMore ? 25 : scanCount,
          force_scrape: scrapeMore ? false : forceScrape,
          scrape_more: scrapeMore
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRunMessage(`Loaded ${data.count} schools in ${activeDistrict}.`);
        
        onDistrictRunComplete({
          state: selectedState,
          district: activeDistrict,
          schools: data.schools
        });

        setTimeout(() => setRunMessage(''), 5000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || 'Discovery request failed. Please check server status.');
        setRunMessage('');
      }
    } catch (err) {
      console.error('District discovery error:', err);
      alert('Network error while running discovery.');
      setRunMessage('');
    } finally {
      setIsRunning(false);
      setIsScrapingMore(false);
    }
  };

  return (
    <div id="district-runner-section" className="bg-slate-900 text-white rounded-xl p-5 mb-6 shadow-sm border border-slate-800 scroll-mt-6">
      {/* Agent Access Banner */}
      {userRole === 'agent' && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Agent Level Access:</strong> Automated multi-mandal scraping is restricted to Administrators to prevent duplicate queries. You can browse, filter, and review existing database records for this district.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
            View Only
          </span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              District School Discovery
            </h2>
            <p className="text-xs text-slate-400">
              Discover and list institutions by geography, pre-ranked from High to Low tier.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
          {userRole === 'admin' ? (
            <>
              <label 
                className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80 transition"
                title="Checks live websites again instead of loading schools already saved in the database"
              >
                <input
                  type="checkbox"
                  checked={forceScrape}
                  onChange={(e) => setForceScrape(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="font-medium text-slate-200">Fresh search from web</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">(ignore saved list)</span>
              </label>

              {totalSchoolsLoaded > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleRunDistrict(e, true)}
                  disabled={isRunning || isScrapingMore}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 text-xs font-medium border border-indigo-500/40 transition disabled:opacity-50 cursor-pointer shadow-xs"
                  title="Crawls other mandals and rural areas in this district to find 25 new schools without duplicates"
                >
                  {isScrapingMore ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-300" />
                      <span>Searching other mandals...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>+ Find 25 More Schools</span>
                      <span className="text-[10px] text-indigo-300/70 hidden sm:inline">(other mandals)</span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Scraper Controls (Admin Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Inputs Form */}
      <form onSubmit={(e) => handleRunDistrict(e, false)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
        {/* State */}
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            State
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={isRunning || isScrapingMore}
            className="w-full text-xs rounded-lg bg-slate-800/90 border border-slate-700 text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            {statesList.map((st) => (
              <option key={st} value={st} className="bg-slate-900 text-white">{st}</option>
            ))}
          </select>
        </div>

        {/* District */}
        <div className="md:col-span-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">
              District
            </label>
            <button
              type="button"
              onClick={() => setUseCustomDistrict(!useCustomDistrict)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {useCustomDistrict ? 'Select from list' : '+ Custom District'}
            </button>
          </div>

          {useCustomDistrict ? (
            <input
              type="text"
              value={customDistrict}
              onChange={(e) => setCustomDistrict(e.target.value)}
              placeholder="Enter district name..."
              disabled={isRunning || isScrapingMore}
              className="w-full text-xs rounded-lg bg-slate-800/90 border border-slate-700 text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
            />
          ) : (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={isRunning || isScrapingMore || districtList.length === 0}
              className="w-full text-xs rounded-lg bg-slate-800/90 border border-slate-700 text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
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

        {/* Batch Size */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Batch Size
          </label>
          <select
            value={scanCount}
            onChange={(e) => setScanCount(Number(e.target.value))}
            disabled={isRunning || isScrapingMore}
            className="w-full text-xs rounded-lg bg-slate-800/90 border border-slate-700 text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value={25} className="bg-slate-900 text-white">25 Schools</option>
            <option value={50} className="bg-slate-900 text-white">50 Schools</option>
            <option value={100} className="bg-slate-900 text-white">100 Schools</option>
          </select>
        </div>

        {/* Submit */}
        <div className="md:col-span-3">
          {userRole === 'admin' ? (
            <button
              type="submit"
              disabled={isRunning || isScrapingMore}
              className="w-full h-[38px] inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Discovering...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Discover Schools</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              title="Admin authorization required to run automated district scraper"
              className="w-full h-[38px] inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Scraper Locked</span>
            </button>
          )}
        </div>
      </form>

      {/* Status Feedback */}
      {(isRunning || isScrapingMore) && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-indigo-300">
          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-indigo-400" />
          <span>{runMessage}</span>
        </div>
      )}

      {!isRunning && !isScrapingMore && runMessage && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{runMessage}</span>
        </div>
      )}
    </div>
  );
}
