import React, { useState, useEffect } from 'react';
import { 
  School, Phone, PhoneCall, Search, Filter, MapPin, 
  Users, CheckCircle2, Flame, Sparkles, RefreshCw, ArrowUpDown 
} from 'lucide-react';
import { initiateAICall } from '../../utils/callingApi';

export default function CallingSchoolList({ 
  onStartCall, 
  onViewCallDetails 
}) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [callingId, setCallingId] = useState(null);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools || data || []);
      }
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleCallSchool = async (school) => {
    const schoolName = school.info?.school_name || school.name || 'Telangana School';
    const phone = school.info?.phone || school.contact?.phone || '9849012345';
    const district = school.hierarchy?.district || 'Hyderabad';
    const principal = school.info?.principal_name || school.contact?.principal || 'Principal';

    setCallingId(school.id);
    try {
      const res = await initiateAICall({
        school_id: school.id,
        school_name: schoolName,
        phone_number: phone,
        district: district,
        principal_name: principal,
        force_mock: false
      });
      if (onStartCall) {
        onStartCall(res);
      }
    } catch (err) {
      alert(`Could not initiate call: ${err.message}`);
    } finally {
      setCallingId(null);
    }
  };

  const filteredSchools = schools.filter((s) => {
    const name = (s.info?.school_name || s.name || '').toLowerCase();
    const dist = (s.hierarchy?.district || '').toLowerCase();
    const phone = (s.info?.phone || s.contact?.phone || '').toLowerCase();
    const q = search.toLowerCase();

    if (q && !name.includes(q) && !dist.includes(q) && !phone.includes(q)) {
      return false;
    }
    if (selectedDistrict !== 'All' && dist !== selectedDistrict.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* Search & Filter Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-400" />
            Telangana School Calling Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select any school to initiate an automated Telugu AI outreach and qualification call.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school, city, phone..."
              className="bg-slate-950/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Districts</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Warangal">Warangal</option>
            <option value="Karimnagar">Karimnagar</option>
            <option value="Nizamabad">Nizamabad</option>
            <option value="Khammam">Khammam</option>
            <option value="Ranga Reddy">Ranga Reddy</option>
            <option value="Nalgonda">Nalgonda</option>
            <option value="Medak">Medak</option>
          </select>

          <button
            onClick={fetchSchools}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Schools Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading Telangana schools directory...
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No schools matching current search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">School Name</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Principal / Contact</th>
                  <th className="px-4 py-3">Strength</th>
                  <th className="px-4 py-3">AI Calling Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSchools.map((s) => {
                  const sName = s.info?.school_name || s.name || 'Telangana School';
                  const sDist = s.hierarchy?.district || 'Hyderabad';
                  const sPhone = s.info?.phone || s.contact?.phone || '9849012345';
                  const sPrincipal = s.info?.principal_name || s.contact?.principal || 'Principal';
                  const sStudents = s.info?.student_count || s.metrics?.total_students || 450;
                  const aiStatus = s.ai_calling_status || 'NOT_CALLED';
                  const interest = s.ai_interest_level || 'PENDING';
                  const isCalling = callingId === s.id;

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                            {sName.charAt(0)}
                          </div>
                          <div>
                            <div>{sName}</div>
                            <div className="text-[10px] text-slate-500 font-normal">ID: {s.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{sDist}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-200">{sPrincipal}</div>
                        <div className="text-[11px] font-mono text-slate-400">{sPhone}</div>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-300">
                        {sStudents} Students
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {interest === 'HOT' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              HOT LEAD
                            </span>
                          ) : interest === 'WARM' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              WARM
                            </span>
                          ) : interest === 'COLD' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              COLD
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                              Ready to Call
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleCallSchool(s)}
                          disabled={isCalling}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-emerald-600/30 transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          {isCalling ? 'Dialing...' : 'Call with AI'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
