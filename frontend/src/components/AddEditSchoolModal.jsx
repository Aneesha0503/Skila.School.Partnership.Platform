import React, { useState } from 'react';
import { X, Save, Building2, Cpu, DollarSign, MapPin } from 'lucide-react';

export default function AddEditSchoolModal({ initialData, onClose, onSaveSuccess }) {
  const isEditing = Boolean(initialData?.id);
  const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy' | 'info' | 'tech' | 'sales'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    hierarchy: {
      state: initialData?.hierarchy?.state || 'Telangana',
      district: initialData?.hierarchy?.district || 'Hyderabad',
      revenue_division: initialData?.hierarchy?.revenue_division || 'Hyderabad North',
      mandal: initialData?.hierarchy?.mandal || 'Shaikpet',
      local_body_type: initialData?.hierarchy?.local_body_type || 'Municipal Corporation',
      local_body_name: initialData?.hierarchy?.local_body_name || 'GHMC',
      village_locality_ward: initialData?.hierarchy?.village_locality_ward || ''
    },
    info: {
      udise_code: initialData?.info?.udise_code || '',
      school_name: initialData?.info?.school_name || '',
      school_category: initialData?.info?.school_category || 'Secondary',
      management_type: initialData?.info?.management_type || 'Private Unaided',
      school_type: initialData?.info?.school_type || 'Co-educational',
      board: initialData?.info?.board || 'CBSE',
      classes_from: initialData?.info?.classes_from || 'Grade 1',
      classes_to: initialData?.info?.classes_to || 'Grade 12',
      student_strength: initialData?.info?.student_strength || 1000,
      teacher_strength: initialData?.info?.teacher_strength || 60,
      principal_name: initialData?.info?.principal_name || '',
      correspondent_name: initialData?.info?.correspondent_name || '',
      mobile: initialData?.info?.mobile || '',
      email: initialData?.info?.email || '',
      website: initialData?.info?.website || '',
      full_address: initialData?.info?.full_address || '',
      pincode: initialData?.info?.pincode || ''
    },
    technology: {
      erp_used: initialData?.technology?.erp_used || 'No',
      erp_vendor: initialData?.technology?.erp_vendor || '',
      lms_used: initialData?.technology?.lms_used || 'No',
      lms_vendor: initialData?.technology?.lms_vendor || '',
      coding_used: initialData?.technology?.coding_used || 'No',
      coding_vendor: initialData?.technology?.coding_vendor || '',
      robotics_used: initialData?.technology?.robotics_used || 'No',
      robotics_vendor: initialData?.technology?.robotics_vendor || '',
      ai_used: initialData?.technology?.ai_used || 'No',
      ai_vendor: initialData?.technology?.ai_vendor || '',
      stem_program: initialData?.technology?.stem_program || 'No',
      atl_lab: initialData?.technology?.atl_lab || 'No',
      smart_classroom: initialData?.technology?.smart_classroom || 'No',
      smart_classroom_count: initialData?.technology?.smart_classroom_count || 0,
      computer_lab: initialData?.technology?.computer_lab || 'No',
      computer_lab_count: initialData?.technology?.computer_lab_count || 0,
      internet: initialData?.technology?.internet || 'Fiber 300 Mbps',
      parent_app: initialData?.technology?.parent_app || 'No',
      school_app: initialData?.technology?.school_app || 'No'
    },
    sales: {
      decision_maker: initialData?.sales?.decision_maker || '',
      decision_maker_designation: initialData?.sales?.decision_maker_designation || 'Correspondent',
      decision_maker_contact: initialData?.sales?.decision_maker_contact || '',
      annual_fee_range: initialData?.sales?.annual_fee_range || '₹50,000 - ₹1,00,000',
      existing_edtech_partners: initialData?.sales?.existing_edtech_partners || '',
      technology_adoption_level: initialData?.sales?.technology_adoption_level || 'Medium',
      skila_ai_potential: initialData?.sales?.skila_ai_potential || 'High',
      lead_status: initialData?.sales?.lead_status || 'New',
      interest_level: initialData?.sales?.interest_level || 'High',
      demo_done: initialData?.sales?.demo_done || 'No',
      proposal_shared: initialData?.sales?.proposal_shared || 'No',
      pilot_started: initialData?.sales?.pilot_started || 'No',
      last_contact_date: initialData?.sales?.last_contact_date || '',
      next_follow_up_date: initialData?.sales?.next_follow_up_date || '',
      sales_owner: initialData?.sales?.sales_owner || 'Rahul Verma',
      remarks: initialData?.sales?.remarks || ''
    }
  });

  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.info.school_name || !formData.info.udise_code) {
      setErrorMsg('School Name and UDISE Code are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const url = isEditing ? `/api/schools/${initialData.id}` : '/api/schools';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const saved = await res.json();
        onSaveSuccess(saved);
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        let msg = 'Failed to save school.';
        if (typeof err.detail === 'string') {
          msg = err.detail;
        } else if (Array.isArray(err.detail)) {
          msg = err.detail.map(d => `${d.loc ? d.loc.slice(-1)[0] : 'field'}: ${d.msg}`).join(', ');
        } else if (err.message) {
          msg = err.message;
        }
        setErrorMsg(msg);
      }
    } catch (err) {
      setErrorMsg('Network error while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? `Edit School: ${initialData?.info?.school_name}` : 'Add New School to Platform'}
            </h2>
            <p className="text-xs text-slate-400">Fill in Administrative, Academic, Tech, and Sales CRM fields</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 px-5 pt-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`py-2 px-3 rounded-t-lg transition flex items-center gap-1.5 ${activeTab === 'hierarchy' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <MapPin className="w-3.5 h-3.5" /> 1. Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-3 rounded-t-lg transition flex items-center gap-1.5 ${activeTab === 'info' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Building2 className="w-3.5 h-3.5" /> 2. School Info
          </button>
          <button
            onClick={() => setActiveTab('tech')}
            className={`py-2 px-3 rounded-t-lg transition flex items-center gap-1.5 ${activeTab === 'tech' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Cpu className="w-3.5 h-3.5" /> 3. Technology
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-3 rounded-t-lg transition flex items-center gap-1.5 ${activeTab === 'sales' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <DollarSign className="w-3.5 h-3.5" /> 4. Sales CRM
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 text-xs space-y-4 bg-white dark:bg-slate-900">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {/* TAB: HIERARCHY */}
          {activeTab === 'hierarchy' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">State</label>
                <input
                  type="text"
                  value={formData.hierarchy.state}
                  onChange={(e) => handleChange('hierarchy', 'state', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  placeholder="e.g. Telangana"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">District</label>
                <input
                  type="text"
                  value={formData.hierarchy.district}
                  onChange={(e) => handleChange('hierarchy', 'district', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  placeholder="e.g. Hyderabad"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Revenue Division / Sub-Division</label>
                <input
                  type="text"
                  value={formData.hierarchy.revenue_division}
                  onChange={(e) => handleChange('hierarchy', 'revenue_division', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  placeholder="e.g. Hyderabad North"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mandal</label>
                <input
                  type="text"
                  value={formData.hierarchy.mandal}
                  onChange={(e) => handleChange('hierarchy', 'mandal', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  placeholder="e.g. Shaikpet"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Local Body Type</label>
                <select
                  value={formData.hierarchy.local_body_type}
                  onChange={(e) => handleChange('hierarchy', 'local_body_type', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Municipal Corporation">Municipal Corporation</option>
                  <option value="Municipality">Municipality</option>
                  <option value="Nagar Panchayat">Nagar Panchayat</option>
                  <option value="Gram Panchayat">Gram Panchayat</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Local Body Name</label>
                <input
                  type="text"
                  value={formData.hierarchy.local_body_name}
                  onChange={(e) => handleChange('hierarchy', 'local_body_name', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  placeholder="e.g. GHMC"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Village / Locality / Ward</label>
                <input
                  type="text"
                  value={formData.hierarchy.village_locality_ward}
                  onChange={(e) => handleChange('hierarchy', 'village_locality_ward', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  placeholder="e.g. Ward 95 - Jubilee Hills"
                  required
                />
              </div>
            </div>
          )}

          {/* TAB: SCHOOL INFO */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">School Name *</label>
                <input
                  type="text"
                  value={formData.info.school_name}
                  onChange={(e) => handleChange('info', 'school_name', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">UDISE Code (11 digits) *</label>
                <input
                  type="text"
                  value={formData.info.udise_code}
                  onChange={(e) => handleChange('info', 'udise_code', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Affiliated Board</label>
                <select
                  value={formData.info.board}
                  onChange={(e) => handleChange('info', 'board', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="IB / Cambridge">IB / Cambridge</option>
                  <option value="State Board">State Board</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">School Category</label>
                <select
                  value={formData.info.school_category}
                  onChange={(e) => handleChange('info', 'school_category', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Secondary">Secondary (1-10)</option>
                  <option value="Higher Secondary">Higher Secondary (1-12)</option>
                  <option value="K-12">K-12 (Pre-Primary to 12)</option>
                  <option value="Primary">Primary (1-5)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Student Strength</label>
                <input
                  type="number"
                  value={formData.info.student_strength}
                  onChange={(e) => handleChange('info', 'student_strength', Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Teacher Strength</label>
                <input
                  type="number"
                  value={formData.info.teacher_strength}
                  onChange={(e) => handleChange('info', 'teacher_strength', Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Principal Name</label>
                <input
                  type="text"
                  value={formData.info.principal_name}
                  onChange={(e) => handleChange('info', 'principal_name', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Correspondent Name</label>
                <input
                  type="text"
                  value={formData.info.correspondent_name}
                  onChange={(e) => handleChange('info', 'correspondent_name', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mobile</label>
                <input
                  type="text"
                  value={formData.info.mobile}
                  onChange={(e) => handleChange('info', 'mobile', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={formData.info.email}
                  onChange={(e) => handleChange('info', 'email', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Address</label>
                <input
                  type="text"
                  value={formData.info.full_address}
                  onChange={(e) => handleChange('info', 'full_address', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
            </div>
          )}

          {/* TAB: TECHNOLOGY */}
          {activeTab === 'tech' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ERP Used?</label>
                <select
                  value={formData.technology.erp_used}
                  onChange={(e) => handleChange('technology', 'erp_used', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ERP Vendor</label>
                <input
                  type="text"
                  value={formData.technology.erp_vendor}
                  onChange={(e) => handleChange('technology', 'erp_vendor', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  placeholder="e.g. Next Education, Fedena"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">LMS Used?</label>
                <select
                  value={formData.technology.lms_used}
                  onChange={(e) => handleChange('technology', 'lms_used', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">LMS Vendor</label>
                <input
                  type="text"
                  value={formData.technology.lms_vendor}
                  onChange={(e) => handleChange('technology', 'lms_vendor', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                  placeholder="e.g. Google Classroom, Canvas"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Coding Curriculum?</label>
                <select
                  value={formData.technology.coding_used}
                  onChange={(e) => handleChange('technology', 'coding_used', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Robotics Program?</label>
                <select
                  value={formData.technology.robotics_used}
                  onChange={(e) => handleChange('technology', 'robotics_used', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ATL Lab Established?</label>
                <select
                  value={formData.technology.atl_lab}
                  onChange={(e) => handleChange('technology', 'atl_lab', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Smart Classroom Count</label>
                <input
                  type="number"
                  value={formData.technology.smart_classroom_count}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    handleChange('technology', 'smart_classroom_count', c);
                    handleChange('technology', 'smart_classroom', c > 0 ? 'Yes' : 'No');
                  }}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
            </div>
          )}

          {/* TAB: SALES CRM */}
          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Key Decision Maker</label>
                <input
                  type="text"
                  value={formData.sales.decision_maker}
                  onChange={(e) => handleChange('sales', 'decision_maker', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.sales.decision_maker_designation}
                  onChange={(e) => handleChange('sales', 'decision_maker_designation', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Annual Fee Range</label>
                <input
                  type="text"
                  value={formData.sales.annual_fee_range}
                  onChange={(e) => handleChange('sales', 'annual_fee_range', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Lead Status</label>
                <select
                  value={formData.sales.lead_status}
                  onChange={(e) => handleChange('sales', 'lead_status', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Demo Scheduled">Demo Scheduled</option>
                  <option value="Proposal Shared">Proposal Shared</option>
                  <option value="Pilot Started">Pilot Started</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Skila AI Potential</label>
                <select
                  value={formData.sales.skila_ai_potential}
                  onChange={(e) => handleChange('sales', 'skila_ai_potential', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Sales Owner</label>
                <input
                  type="text"
                  value={formData.sales.sales_owner}
                  onChange={(e) => handleChange('sales', 'sales_owner', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Remarks & Strategy Notes</label>
                <textarea
                  rows="3"
                  value={formData.sales.remarks}
                  onChange={(e) => handleChange('sales', 'remarks', e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create School')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
