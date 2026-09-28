import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Compass, ArrowDownRight, Layers, School, ChevronRight, CheckCircle2, Zap } from 'lucide-react';
import { INDIA_STATES, MAJOR_HUBS, PAN_INDIA_STATS } from '../data/indiaMapData';

export default function IndiaMapHero({ onSelectState, selectedState, isAuthenticated = true, onRequireAuth }) {
  const [internalPinnedState, setInternalPinnedState] = useState(selectedState || 'Telangana');
  const [hoveredState, setHoveredState] = useState(null);
  const [hoveredHub, setHoveredHub] = useState(null);

  // Sync internal state whenever parent selectedState changes
  useEffect(() => {
    if (selectedState) {
      setInternalPinnedState(selectedState);
    }
  }, [selectedState]);

  const activePinnedStateName = internalPinnedState || selectedState || 'Telangana';
  const activePinnedState = INDIA_STATES.find(s => s.name === activePinnedStateName);
  const activeHubInfo = MAJOR_HUBS.find(h => h.state === activePinnedStateName) || 
                        MAJOR_HUBS.find(h => h.state === (hoveredState?.name || 'Telangana')) ||
                        MAJOR_HUBS[0];

  const scrollToTarget = () => {
    if (!isAuthenticated) {
      const authEl = document.getElementById('auth-gate-section');
      if (authEl) {
        authEl.scrollIntoView({ behavior: 'smooth' });
      } else if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }
    const el = document.getElementById('district-runner-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStateClick = (stateName) => {
    setInternalPinnedState(stateName);
    if (onSelectState) {
      onSelectState(stateName);
    }
  };

  const scrollToDistrictRunner = scrollToTarget;

  return (
    <section className="relative overflow-hidden mb-8 rounded-3xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 shadow-xl transition-all">
      {/* Ambient background glow & grid effect */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 lg:p-10">
        
        {/* Left Column: Vision Statement & Action Controls */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold w-fit tracking-wide shadow-xs">
            <img src="/skila_3d_glass.png" alt="Skila 3D" className="w-4.5 h-4.5 object-contain drop-shadow-xs animate-pulse" />
            <span>Pan-India School Intelligence & AI Pipeline</span>
          </div>

          {/* User's Exact Requested Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Skila AI Should Be <br />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 bg-clip-text text-transparent underline decoration-amber-400/40 decoration-wavy">
                Everywhere
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              From Kashmir to Kanyakumari, Gujarat to Arunachal Pradesh — empowering every school, educator, and student across all 28 States and 8 Union Territories with high-impact AI infrastructure, real-time lead analytics, and automated district discovery.
            </p>
          </div>

          {/* Key KPI Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">National Vision</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">100% India</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Pan-India Reach</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Administrative</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">28 + 8 UTs</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Fully Mapped</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Districts</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">780+</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Automated Scraper</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target Schools</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">1.5M+</div>
              <div className="text-[10px] text-indigo-500 dark:text-indigo-300 font-medium">AI Potential</div>
            </div>
          </div>

          {/* Quick Select State Shortcuts */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                Quick Launch States:
              </span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                Click a state to target in District Runner
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Telangana', hub: 'HQ' },
                { name: 'Andhra Pradesh', hub: 'Vizag' },
                { name: 'Karnataka', hub: 'BLR' },
                { name: 'Maharashtra', hub: 'BOM' },
                { name: 'Delhi', hub: 'NCR' },
                { name: 'Tamil Nadu', hub: 'Chennai' },
                { name: 'Gujarat', hub: 'AMD' },
                { name: 'Uttar Pradesh', hub: 'LKO' },
                { name: 'West Bengal', hub: 'CCU' },
                { name: 'Kerala', hub: 'COK' },
                { name: 'Rajasthan', hub: 'JAI' }
              ].map(({ name, hub }) => {
                const isSelected = activePinnedStateName === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      handleStateClick(name);
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{name}</span>
                    <span className={`text-[10px] px-1 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {hub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={scrollToDistrictRunner}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
            >
              <span>{isAuthenticated ? 'Launch Regional District Runner' : 'Sign In to Access District Discovery'}</span>
              <ArrowDownRight className="w-4 h-4" />
            </button>

            {selectedState && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Selected State: <strong>{selectedState}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: High-Tech Interactive Pan-India Vector Map */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[540px] aspect-[1/1.05] p-3 sm:p-5 rounded-3xl bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md flex flex-col items-center justify-between">
            
            {/* Map Top Bar */}
            <div className="w-full flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <img src="/skila_3d_glass.png" alt="Skila 3D" className="w-4.5 h-4.5 object-contain drop-shadow-xs" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Interactive Pan-India Coverage Map
                </span>
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                36 States & UTs Live
              </span>
            </div>

            {/* SVG Canvas */}
            <div className="relative w-full flex-1 flex items-center justify-center py-2">
              <svg
                viewBox="120 70 780 860"
                className="w-full h-full max-h-[460px] drop-shadow-md select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Selected State Radial Gradient */}
                  <radialGradient id="selectedStateGlow" cx="50%" cy="50%" r="75%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4338ca" />
                  </radialGradient>

                  <style>{`
                    @keyframes pinDrop {
                      0% { opacity: 0; transform: translateY(-16px) scale(0.9); }
                      70% { opacity: 1; transform: translateY(2px) scale(1.04); }
                      100% { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .pin-drop-anim {
                      animation: pinDrop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                  `}</style>
                </defs>

                {/* State Vector Paths - Vibrant & Crisply Highlighted */}
                <g id="india-states-layer">
                  {INDIA_STATES.map((state) => {
                    const isSelected = activePinnedStateName === state.name;
                    const isHovered = hoveredState?.name === state.name && !isSelected;

                    let fillClass = "fill-slate-100/95 dark:fill-slate-800/85 hover:fill-indigo-100 dark:hover:fill-indigo-900/90";
                    let strokeClass = "stroke-slate-300 dark:stroke-slate-600";
                    let strokeWidth = "0.75";

                    if (isSelected) {
                      fillClass = "fill-indigo-600 dark:fill-indigo-500";
                      strokeClass = "stroke-white dark:stroke-white";
                      strokeWidth = "2.2";
                    } else if (isHovered) {
                      fillClass = "fill-indigo-300 dark:fill-indigo-700";
                      strokeClass = "stroke-indigo-600 dark:stroke-indigo-400";
                      strokeWidth = "1.6";
                    }

                    return (
                      <path
                        key={state.id}
                        d={state.d}
                        id={state.id}
                        className={`${fillClass} ${strokeClass} transition-colors duration-150 cursor-pointer`}
                        strokeWidth={strokeWidth}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        onMouseEnter={() => setHoveredState(state)}
                        onMouseLeave={() => setHoveredState(null)}
                        onClick={() => {
                          handleStateClick(state.name);
                        }}
                      />
                    );
                  })}
                </g>

                {/* Major Educational Hubs with Glowing Radar Beacons */}
                <g id="major-hubs-layer">
                  {MAJOR_HUBS.map((hub) => {
                    const isSelected = activePinnedStateName === hub.state;
                    const isHovered = (hoveredState?.name === hub.state || hoveredHub?.name === hub.name) && !isSelected;

                    return (
                      <g
                        key={hub.name}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredHub(hub)}
                        onMouseLeave={() => setHoveredHub(null)}
                        onClick={() => {
                          handleStateClick(hub.state);
                        }}
                      >
                        {/* Outer Radar Pulse Ring */}
                        <circle
                          cx={hub.x}
                          cy={hub.y}
                          r={isSelected || isHovered || hub.name === 'Chennai' ? "14" : "9"}
                          className={`${hub.name === 'Chennai' ? 'fill-indigo-500/35 dark:fill-indigo-400/40' : 'fill-indigo-500/20 dark:fill-indigo-400/25'} animate-ping origin-center`}
                          style={{ animationDuration: hub.name === 'Hyderabad' ? '2s' : hub.name === 'Chennai' ? '2.5s' : '3.5s' }}
                        />

                        {/* Mid Halo Ring */}
                        <circle
                          cx={hub.x}
                          cy={hub.y}
                          r={isSelected || hub.name === 'Chennai' ? "8" : "5.5"}
                          className={
                            hub.name === 'Hyderabad'
                              ? 'fill-amber-400 dark:fill-amber-300 stroke-amber-600 stroke-1'
                              : hub.name === 'Chennai'
                              ? 'fill-indigo-600 dark:fill-indigo-500 stroke-white dark:stroke-slate-900 stroke-1.5'
                              : 'fill-indigo-500 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 stroke-1'
                          }
                        />

                        {/* Center Beacon Dot */}
                        {hub.name === 'Hyderabad' ? (
                          <image
                            href="/skila_3d_glass.png"
                            x={hub.x - 7.5}
                            y={hub.y - 7.5}
                            width="15"
                            height="15"
                            className="pointer-events-none drop-shadow-xs"
                            preserveAspectRatio="xMidYMid meet"
                          />
                        ) : hub.name === 'Chennai' ? (
                          <circle
                            cx={hub.x}
                            cy={hub.y}
                            r="3.5"
                            className="fill-white dark:fill-indigo-100"
                          />
                        ) : (
                          <circle
                            cx={hub.x}
                            cy={hub.y}
                            r="2.5"
                            className="fill-white"
                          />
                        )}

                        {/* City Label for Prominent Hubs */}
                        {(isSelected || isHovered || ['Hyderabad', 'Delhi NCR', 'Bengaluru', 'Mumbai', 'Chennai'].includes(hub.name)) && (
                          <text
                            x={hub.x + 8}
                            y={hub.y + 3}
                            className={`text-[9px] font-bold pointer-events-none select-none ${
                              isSelected || hub.name === 'Chennai'
                                ? 'fill-indigo-900 dark:fill-indigo-200 stroke-white dark:stroke-slate-900 stroke-[0.3]'
                                : 'fill-slate-700 dark:fill-slate-200'
                            }`}
                          >
                            {hub.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* Dynamically Pinned 3D Logo on Selected / Clicked State */}
                {activePinnedState && activePinnedState.cx && activePinnedState.cy && (() => {
                  const cx = activePinnedState.cx;
                  const cy = activePinnedState.cy;
                  const pillWidth = Math.max(76, (activePinnedState.name.length * 6.3) + 24);
                  const isNearTop = cy < 130;
                  const pillY = isNearTop ? cy + 24 : cy - 50;

                  return (
                    <g
                      key={activePinnedState.name}
                      id="selected-state-logo-pin"
                      className="pointer-events-none select-none pin-drop-anim"
                    >
                      {/* Ground Soft Contact Shadow */}
                      <ellipse
                        cx={cx}
                        cy={cy + 16}
                        rx="16"
                        ry="5"
                        className="fill-slate-900/35 dark:fill-black/60 blur-[1.5px]"
                      />

                      {/* Glowing Radar Pulse Rings */}
                      <circle
                        cx={cx}
                        cy={cy + 16}
                        r="20"
                        className="fill-indigo-500/30 dark:fill-indigo-400/35 animate-ping origin-center"
                        style={{ animationDuration: '2.4s' }}
                      />
                      <circle
                        cx={cx}
                        cy={cy + 16}
                        r="10"
                        className="fill-indigo-500/40 dark:fill-indigo-400/45 blur-xs"
                      />

                      {/* Focal Ground Anchor Beacon */}
                      <circle
                        cx={cx}
                        cy={cy + 16}
                        r="3.5"
                        className="fill-white stroke-indigo-600 stroke-[1.8]"
                      />

                      {/* 3D Glass Emblem Standing at Clicked State */}
                      <image
                        href="/skila_3d_glass.png"
                        x={cx - 21}
                        y={cy - 34}
                        width="42"
                        height="52"
                        className="drop-shadow-2xl"
                        preserveAspectRatio="xMidYMid meet"
                      />

                      {/* Floating Badge Pill with State Name */}
                      <g className="filter drop-shadow-md">
                        <rect
                          x={cx - pillWidth / 2}
                          y={pillY}
                          width={pillWidth}
                          height="18"
                          rx="9"
                          className="fill-slate-900/95 dark:fill-slate-950/95 stroke-indigo-400/90 stroke-1"
                        />
                        {/* Live Status Indicator Dot */}
                        <circle
                          cx={cx - pillWidth / 2 + 9}
                          cy={pillY + 9}
                          r="2.5"
                          className="fill-emerald-400 animate-pulse"
                        />
                        <text
                          x={cx + 4}
                          y={pillY + 12.5}
                          textAnchor="middle"
                          className="text-[8.5px] font-black fill-white tracking-wider uppercase font-sans"
                        >
                          {activePinnedState.name}
                        </text>
                      </g>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Bottom Interactive State / Hub Hover Card */}
            <div className="w-full mt-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                  <img src="/skila_3d_glass.png" alt="Skila 3D" className="w-6 h-6 object-contain drop-shadow-xs" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {hoveredState ? hoveredState.name : activePinnedStateName}
                    </span>
                    {hoveredState && hoveredState.name !== activePinnedStateName && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-medium">
                        Click to Pin
                      </span>
                    )}
                    {activeHubInfo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-semibold">
                        {activeHubInfo.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeHubInfo ? activeHubInfo.role : 'Target this state for automated school discovery & AI deployment.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (hoveredState?.name) handleStateClick(hoveredState.name);
                  scrollToDistrictRunner();
                }}
                className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Launch Scanner</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
