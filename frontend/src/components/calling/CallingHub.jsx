import React, { useState } from 'react';
import { 
  BarChart3, PhoneCall, School, Flame, Megaphone, 
  CheckCircle2, Settings, FileText, Sparkles, ArrowLeft 
} from 'lucide-react';

import CallingDashboard from './CallingDashboard';
import CallingSchoolList from './CallingSchoolList';
import CallingHistoryView from './CallingHistoryView';
import HotLeadsView from './HotLeadsView';
import CampaignManager from './CampaignManager';
import FollowupsAndDemos from './FollowupsAndDemos';
import CallingAnalytics from './CallingAnalytics';
import CallingSettings from './CallingSettings';
import ActiveCallModal from './ActiveCallModal';
import CallDetailModal from './CallDetailModal';

export default function CallingHub({ 
  onBackToCRM,
  initialSchoolForCall = null
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCallData, setActiveCallData] = useState(initialSchoolForCall);
  const [inspectCallId, setInspectCallId] = useState(null);
  const [inspectCallData, setInspectCallData] = useState(null);

  const handleStartCall = (callResponse) => {
    setActiveCallData(callResponse);
  };

  const handleViewCallDetails = (callId, callData = null) => {
    setInspectCallId(callId);
    setInspectCallData(callData);
  };

  const handleCallCompleted = (summary) => {
    // When a call ends, immediately open the detail modal to inspect the AI evaluation
    if (summary?.call_id) {
      setInspectCallId(summary.call_id);
      setInspectCallData(summary);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'schools', label: 'School Directory', icon: School },
    { id: 'calls', label: 'Call Logs & Transcripts', icon: FileText },
    { id: 'hot-leads', label: 'HOT Leads', icon: Flame, badge: 'High Intent' },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'action-center', label: 'Follow-ups & Demos', icon: CheckCircle2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'AI Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Calling Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            {onBackToCRM && (
              <button
                onClick={onBackToCRM}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Return to School CRM"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden md:inline">CRM</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                SK
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-tight text-white">
                    Skila AI Calling Hub
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Telugu Outreach
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Telangana Schools • Ananya AI Assistant • Sarvam Speech Engine
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                      HOT
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <CallingDashboard
            onStartCall={handleStartCall}
            onViewCallDetails={handleViewCallDetails}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'schools' && (
          <CallingSchoolList
            onStartCall={handleStartCall}
            onViewCallDetails={handleViewCallDetails}
            onNavigateToSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'calls' && (
          <CallingHistoryView
            onViewCallDetails={handleViewCallDetails}
            onStartCall={handleStartCall}
          />
        )}

        {activeTab === 'hot-leads' && (
          <HotLeadsView
            onViewCallDetails={handleViewCallDetails}
            onBookDemo={(lead) => {
              alert(`Demo booking for ${lead.school_name} initiated with Principal ${lead.principal_name || ''}`);
              setActiveTab('action-center');
            }}
          />
        )}

        {activeTab === 'campaigns' && (
          <CampaignManager />
        )}

        {activeTab === 'action-center' && (
          <FollowupsAndDemos />
        )}

        {activeTab === 'analytics' && (
          <CallingAnalytics />
        )}

        {activeTab === 'settings' && (
          <CallingSettings />
        )}
      </main>

      {/* Active Call Modal */}
      {activeCallData && (
        <ActiveCallModal
          callData={activeCallData}
          onClose={() => setActiveCallData(null)}
          onCallCompleted={handleCallCompleted}
          onNavigateToSettings={() => setActiveTab('settings')}
        />
      )}

      {/* Call Details & AI Evaluation Modal */}
      {inspectCallId && (
        <CallDetailModal
          callId={inspectCallId}
          initialData={inspectCallData}
          onClose={() => {
            setInspectCallId(null);
            setInspectCallData(null);
          }}
          onBookDemo={(lead) => {
            alert(`Demo booking recorded for ${lead.school_name || 'school'}`);
          }}
          onCreateFollowup={(lead) => {
            alert(`Follow-up task created for ${lead.school_name || 'school'}`);
          }}
        />
      )}

    </div>
  );
}
