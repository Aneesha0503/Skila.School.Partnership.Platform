import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  Building2,
  Calendar,
  Award,
  Edit3,
  Eye,
  Save,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Download,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Camera,
  RefreshCw
} from 'lucide-react';

/**
 * Extracts clean, distinguished initials from school name.
 * e.g. "The Hyderabad Public School" -> "HPS"
 * "Delhi Public School" -> "DPS"
 * "Sri Siddartha High School" -> "SSHS"
 */
function getSchoolInitials(name = '') {
  const stopWords = new Set(['the', 'of', 'and', '&', 'for', 'in', 'at']);
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => !stopWords.has(w.toLowerCase()));
  if (words.length === 0) return 'SCH';
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Renders an elegant fallback academic crest with school initials.
 */
function SchoolInitialsCrest({ schoolName, size = 'md' }) {
  const initials = getSchoolInitials(schoolName);
  const sizeClasses = size === 'sm' ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-sm';

  return (
    <div
      className={`${sizeClasses} shrink-0 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-amber-300 font-serif font-bold flex flex-col items-center justify-center border-2 border-amber-400/80 shadow-md relative select-none`}
      title={`${schoolName} Emblem`}
    >
      <div className="absolute inset-1 rounded-full border border-amber-300/40 pointer-events-none" />
      <span className="tracking-widest font-black drop-shadow-xs">{initials}</span>
      <span className="text-[7px] text-amber-200/90 font-sans tracking-tighter uppercase font-semibold">
        ACADEMY
      </span>
    </div>
  );
}

/**
 * Resolves initial school logos array:
 * 1. Checks saved full data
 * 2. Checks saved formalities logo fields
 * 3. Checks school info logo
 * 4. Checks if school name matches Sri Siddartha High School (from PDF)
 * 5. Otherwise returns empty array so user can upload any logo(s)
 */
function getInitialSchoolLogos(school, form) {
  if (form?.mou_full_data?.schoolLogos && Array.isArray(form.mou_full_data.schoolLogos) && form.mou_full_data.schoolLogos.length > 0) {
    return form.mou_full_data.schoolLogos;
  }
  if (form?.school_logos && Array.isArray(form.school_logos) && form.school_logos.length > 0) {
    return form.school_logos;
  }
  if (form?.mou_logos && Array.isArray(form.mou_logos) && form.mou_logos.length > 0) {
    return form.mou_logos;
  }
  if (form?.mou_logo_url) {
    return [{ id: 'logo-init-1', url: form.mou_logo_url, name: 'School Logo' }];
  }
  if (school?.info?.logo_url) {
    return [{ id: 'logo-init-1', url: school.info.logo_url, name: 'School Logo' }];
  }
  if (school?.info?.logos && Array.isArray(school.info.logos) && school.info.logos.length > 0) {
    return school.info.logos;
  }

  // Only default to Sri Siddartha crest if the school is actually Sri Siddartha
  const name = (school?.info?.school_name || '').toLowerCase();
  if (name.includes('siddartha') || name.includes('siddhartha')) {
    return [{ id: 'crest-siddartha', url: '/pdf_school_crest.png', name: 'Sri Siddartha Crest' }];
  }

  return [];
}

/**
 * Generates initial default MOU data matching the authentic 7-page legal agreement.
 */
function getInitialMOUData(school, formalities) {
  const info = school?.info || {};
  const hierarchy = school?.hierarchy || {};
  const form = formalities || school?.formalities || school?.sales?.formalities || {};

  // Check if there is previously saved custom MOU data
  if (form.mou_full_data && typeof form.mou_full_data === 'object') {
    const existing = { ...form.mou_full_data };
    if (!existing.schoolLogos || !Array.isArray(existing.schoolLogos)) {
      existing.schoolLogos = getInitialSchoolLogos(school, form);
    }
    return existing;
  }

  const defaultStudents = parseInt(info.total_students || 350, 10) || 350;
  const defaultDiscountedPrice = 500;
  const defaultRetailPrice = 1500;
  const defaultTotal = defaultStudents * defaultDiscountedPrice;

  const today = new Date();
  const dayStr = today.getDate();
  const daySuffix = [11, 12, 13].includes(dayStr) ? 'th' : ['st', 'nd', 'rd'][(dayStr % 10) - 1] || 'th';
  const monthStr = today.toLocaleString('default', { month: 'long' });
  const yearStr = today.getFullYear();
  const defaultFormattedDate = `${dayStr < 10 ? '0' + dayStr : dayStr}${daySuffix} day of ${monthStr} ${yearStr}`;

  return {
    mouNumber: form.mou_number || `TECH-NIRMAAN/SKILA/MOU/${yearStr}/${school?.id?.substring(0, 6)?.toUpperCase() || 'REF'}`,
    mouDate: form.mou_date || today.toISOString().substring(0, 10),
    mouSigningDateFormatted: form.mou_signed_date || defaultFormattedDate,
    mouValidity: form.mou_validity || 'Two (2) Years from the date of signing',
    noticePeriod: 'six (6) months’ notice',
    status: form.mou_status || 'Drafting',
    academicYear: form.academic_year || `${yearStr}-${yearStr + 1}`,

    // Uploadable School Logos (multiple supported)
    schoolLogos: getInitialSchoolLogos(school, form),

    // Party 1: Tech Nirmaan
    techNirmaan: {
      name: 'Tech Nirmaan',
      tagline: 'technology and skill-development EdTech',
      office: 'Mindspace, Madhapur, Hyderabad, Telangana, 500081, India',
      signatoryName: 'Merugu Anjaneyulu',
      signatoryTitle: 'Cofounder',
      platform: 'Skila.ai (Smart Knowledge Integrated Learning Accelerator)'
    },

    // Party 2: Partner School
    schoolParty: {
      name: info.school_name || 'Partner School',
      campusAddress: info.full_address || `${hierarchy.mandal ? hierarchy.mandal + ', ' : ''}${hierarchy.district ? hierarchy.district + ', ' : ''}${hierarchy.state || 'Telangana'} – ${info.pincode || '500001'}`,
      signatoryName: form.mou_signatory_name || info.correspondent_name || info.principal_name || 'Authorized Signatory',
      signatoryTitle: form.mou_signatory_designation || 'Principal / Chairman',
      coordinatorName: form.school_spoc_name || info.principal_name || 'Designated School Coordinator',
      coordinatorTitle: form.school_spoc_designation || 'Institutional SPOC',
      udiseCode: info.udise_code || '',
      board: info.board || 'CBSE / State Board',
      classesCovered: `${info.classes_from || 'Grade 1'} to ${info.classes_to || 'Grade 10'}`
    },

    // Section I: Objectives
    objectives: [
      'Provide access to the Skila.ai AI-powered learning platform.',
      'Enhance teaching and learning through personalized and interactive digital education.',
      'Promote coding, STEM education, innovation, and future-ready skills.',
      'Improve student performance through AI-based assessments and analytics.',
      'Conduct workshops, competitions, and teacher development programs.',
      'Foster project-based learning and overall student development.'
    ],

    // Section II: Scope of Collaboration
    scopeAreas: [
      'Skila.ai Platform Implementation',
      'AI-Powered Personalized Learning',
      'Digital Assessments and Performance Analytics',
      'Coding, STEM, and Future Skills Programs',
      'Teacher Development and Training Programs',
      'Workshops, Competitions, and Student Engagement Activities',
      'Project-Based Learning and Innovation Programs',
      'Academic Performance Monitoring and Reporting',
      'Parent Awareness and School Support Programs'
    ],

    // Section III: Financials
    financials: {
      product: 'Skila',
      description: 'AI LMS Platform',
      retailPrice: 'Rs. 1500/- per student',
      discountedPrice: 'Rs. 500/- per student',
      discountedPriceNum: defaultDiscountedPrice,
      estimatedStudents: defaultStudents,
      totalContractValue: form.contract_value || `Rs. ${defaultTotal.toLocaleString('en-IN')}/-`,
      gstTerms: 'This cost does not include GST.',
      priceValidity: 'The pricing mentioned herein shall remain valid for one year during the Two-year term of this Agreement and shall be applicable only to the current batch. Pricing for the second year or future batches may be revised upon mutual agreement.',
      paymentMilestones: [
        { percentage: '50%', condition: 'Paid before the program starts' },
        { percentage: '50%', condition: 'Paid within the first three months of the program' }
      ]
    },

    // Section IV: Digital Content
    digitalContentNotice:
      'The Parties acknowledge that the Products and Services involve proprietary digital content, data, and intellectual property, which cannot be returned once disclosed or accessed. Accordingly, all payments made under this Agreement shall be deemed final upon grant of access.',

    // Section V: Tech Nirmaan Responsibilities
    techNirmaanResponsibilities: [
      'Provide access to the Skila.ai platform for students and teachers.',
      'Deliver AI-powered learning content, assessments, and digital learning resources.',
      'Organize training programs, workshops, coding activities, and skill development sessions.',
      'Provide student performance analytics and progress reports.',
      'Offer technical support, platform maintenance, and timely assistance.',
      'Appoint a Program Coordinator to ensure smooth implementation and coordination of all collaborative activities.'
    ],

    // Section VI: School Responsibilities
    schoolResponsibilities: [
      'Facilitate the implementation of the Skila.ai platform within the school.',
      'Nominate a School Coordinator to coordinate with Tech Nirmaan.',
      'Provide the necessary infrastructure and support for program execution.',
      'Encourage active participation of students and teachers in all learning activities.',
      'Ensure timely communication and coordination for the successful implementation of the collaboration.',
      'Support the effective utilization of the platform to achieve the objectives of this MOU.'
    ],

    // Section VII-XII Standard Legal Boilerplate clauses
    confidentialityClause:
      'Both Parties agree to maintain confidentiality of proprietary information exchanged during the collaboration. This obligation shall survive the termination or expiry of this MOU.',
    durationClause:
      'This MOU shall be valid for Two (2) years from the date of signing and may be terminated by either Party with six (6) months’ notice.',
    nonExclusivityClause:
      'This MOU is non-exclusive, and both Parties are free to enter into similar agreements with other institutions or organizations.',
    ipClause1: 'Skila.ai software remains the intellectual property of Tech Nirmaan.',
    ipClause2: 'School receives only a non-exclusive license to use it during the active term.',
    liabilityClause:
      'Neither Party shall be liable for indirect, incidental, or consequential damages arising from this collaboration.',
    governingLawClause:
      'This MOU shall be governed by the laws of India, subject to the exclusive jurisdiction of the courts at Hyderabad, Telangana.',

    // Optional Custom Clauses
    customClauses: form.mou_custom_clauses || []
  };
}

export default function MOUPreviewModal({ school, formalities, onClose, onSaveFormalities }) {
  if (!school) return null;

  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'editor'
  const [inlineEdit, setInlineEdit] = useState(false);
  const [mouData, setMouData] = useState(() => getInitialMOUData(school, formalities));
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const replaceIndexRef = useRef(null);
  const replaceFileInputRef = useRef(null);

  // Sync if school changes
  useEffect(() => {
    setMouData(getInitialMOUData(school, formalities));
  }, [school?.id]);

  const handlePrint = () => {
    window.print();
  };

  /**
   * Optimizes and resizes uploaded image files via HTML5 Canvas (max 600px)
   * to guarantee crisp print quality while keeping Firestore payload compact.
   */
  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/png');
          resolve({
            id: `logo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: dataUrl,
            name: file.name.replace(/\.[^/.]+$/, '') || 'School Logo'
          });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handles multiple file uploads at once
   */
  const handleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    try {
      const processed = await Promise.all(fileList.map((f) => processImageFile(f)));
      setMouData((prev) => ({
        ...prev,
        schoolLogos: [...(prev.schoolLogos || []), ...processed]
      }));
      setSaveStatus({
        type: 'success',
        text: `Uploaded ${processed.length} logo${processed.length > 1 ? 's' : ''} successfully! Remember to Save Changes.`
      });
      setTimeout(() => setSaveStatus({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error('Error uploading logos:', err);
      setSaveStatus({ type: 'error', text: 'Failed to process image files.' });
    }
  };

  /**
   * Handles replacing an existing logo
   */
  const handleReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    const index = replaceIndexRef.current;
    if (!file || index === null) return;

    try {
      const processed = await processImageFile(file);
      setMouData((prev) => {
        const arr = [...(prev.schoolLogos || [])];
        arr[index] = processed;
        return { ...prev, schoolLogos: arr };
      });
      setSaveStatus({ type: 'success', text: 'Logo replaced successfully!' });
      setTimeout(() => setSaveStatus({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error replacing logo:', err);
    } finally {
      replaceIndexRef.current = null;
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = (index) => {
    setMouData((prev) => {
      const arr = [...(prev.schoolLogos || [])];
      arr.splice(index, 1);
      return { ...prev, schoolLogos: arr };
    });
  };

  const handleApplyPresetCrest = () => {
    setMouData((prev) => ({
      ...prev,
      schoolLogos: [{ id: 'siddartha-crest', url: '/pdf_school_crest.png', name: 'Sri Siddartha High School Crest' }]
    }));
  };

  const handleClearAllLogos = () => {
    if (window.confirm('Remove all uploaded logos for this agreement?')) {
      setMouData((prev) => ({
        ...prev,
        schoolLogos: []
      }));
    }
  };

  const handleResetToTemplate = () => {
    if (window.confirm('Reset all MOU fields to the standard legal agreement template? Unsaved changes will be discarded.')) {
      const fresh = getInitialMOUData(school, { ...formalities, mou_full_data: null });
      setMouData(fresh);
      setSaveStatus({ type: 'success', text: 'Reset to standard legal template!' });
      setTimeout(() => setSaveStatus({ type: '', text: '' }), 3000);
    }
  };

  const handleFieldChange = (section, field, value) => {
    if (section) {
      setMouData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setMouData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayItemChange = (arrayKey, index, value) => {
    setMouData((prev) => {
      const arr = [...(prev[arrayKey] || [])];
      arr[index] = value;
      return { ...prev, [arrayKey]: arr };
    });
  };

  const handleAddArrayItem = (arrayKey, defaultVal = '') => {
    setMouData((prev) => ({
      ...prev,
      [arrayKey]: [...(prev[arrayKey] || []), defaultVal]
    }));
  };

  const handleRemoveArrayItem = (arrayKey, index) => {
    setMouData((prev) => {
      const arr = [...(prev[arrayKey] || [])];
      arr.splice(index, 1);
      return { ...prev, [arrayKey]: arr };
    });
  };

  // Recalculate total contract value when students or price change
  const handleStudentsChange = (count) => {
    const num = parseInt(count, 10) || 0;
    const disc = parseInt(mouData.financials.discountedPriceNum, 10) || 500;
    const total = num * disc;
    setMouData((prev) => ({
      ...prev,
      financials: {
        ...prev.financials,
        estimatedStudents: num,
        totalContractValue: `Rs. ${total.toLocaleString('en-IN')}/-`
      }
    }));
  };

  const handlePriceChange = (price) => {
    const num = parseInt(price, 10) || 0;
    const count = parseInt(mouData.financials.estimatedStudents, 10) || 0;
    const total = count * num;
    setMouData((prev) => ({
      ...prev,
      financials: {
        ...prev.financials,
        discountedPriceNum: num,
        discountedPrice: `Rs. ${num}/- per student`,
        totalContractValue: `Rs. ${total.toLocaleString('en-IN')}/-`
      }
    }));
  };

  const handleSaveToRecord = async () => {
    setIsSaving(true);
    setSaveStatus({ type: '', text: '' });
    try {
      const payload = {
        mou_number: mouData.mouNumber,
        mou_date: mouData.mouDate,
        mou_signed_date: mouData.mouSigningDateFormatted,
        mou_validity: mouData.mouValidity,
        mou_signatory_name: mouData.schoolParty.signatoryName,
        mou_signatory_designation: mouData.schoolParty.signatoryTitle,
        school_spoc_name: mouData.schoolParty.coordinatorName,
        school_spoc_designation: mouData.schoolParty.coordinatorTitle,
        contract_value: mouData.financials.totalContractValue,
        academic_year: mouData.academicYear,
        mou_status: mouData.status || 'Drafting',
        school_logos: mouData.schoolLogos || [],
        mou_logo_url: mouData.schoolLogos?.[0]?.url || '',
        mou_full_data: mouData
      };

      const token = localStorage.getItem('token');
      const role = localStorage.getItem('user_role') || 'admin';
      const agentName = localStorage.getItem('agent_name') || 'Admin';

      const res = await fetch(`/api/schools/${school.id}/formalities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-User-Role': role,
          'X-Agent-Name': agentName
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to update school records');
      }

      if (onSaveFormalities) {
        onSaveFormalities(payload);
      }

      setSaveStatus({
        type: 'success',
        text: 'MOU terms, clauses, and institutional logos saved successfully to school records!'
      });
      setTimeout(() => setSaveStatus({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Error saving MOU:', err);
      setSaveStatus({
        type: 'error',
        text: `Error saving: ${err.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyText = () => {
    const plainText = `
MEMORANDUM OF UNDERSTANDING (MOU)
For Academic, Skill Development and Digital Learning Collaboration

BETWEEN
${mouData.techNirmaan.name.toUpperCase()}
AND
${mouData.schoolParty.name.toUpperCase()}

This Memorandum of Understanding (hereinafter referred to as "MOU") is entered into on this ${mouData.mouSigningDateFormatted}.

BY AND BETWEEN:
${mouData.techNirmaan.name}, ${mouData.techNirmaan.tagline}, having its principal office at ${mouData.techNirmaan.office} (hereinafter referred to as "Tech Nirmaan"), represented by its authorized signatory, ${mouData.techNirmaan.signatoryName}, ${mouData.techNirmaan.signatoryTitle}.
AND
${mouData.schoolParty.name}, a distinguished academic institution, having its campus at ${mouData.schoolParty.campusAddress}, represented by its authorized signatory, ${mouData.schoolParty.signatoryName}, ${mouData.schoolParty.signatoryTitle}.
(Tech Nirmaan and ${mouData.schoolParty.name} are hereinafter referred to individually as a "Party" and collectively as the "Parties").

PREAMBLE
WHEREAS, TECH NIRMAAN is a leading EdTech and technology-driven skill development organization committed to transforming education through Artificial Intelligence (AI), digital learning, coding, STEM education, innovation programs, and future-ready skill development...
WHEREAS, TECH NIRMAAN, through its flagship AI-powered platform Skila.ai (Smart Knowledge Integrated Learning Accelerator), provides personalized learning pathways, adaptive assessments, AI-powered learning assistance, coding and STEM education, real-time student performance analytics, teacher enablement programs, project-based learning, digital content, and holistic academic development solutions.
WHEREAS, ${mouData.schoolParty.name}, located at ${mouData.schoolParty.campusAddress}, is committed to providing quality education...

I. PURPOSE AND OBJECTIVES
The primary purpose of this Memorandum of Understanding (MOU) is to establish a strategic collaboration between Tech Nirmaan and ${mouData.schoolParty.name} to implement AI-powered digital learning solutions, promote technology-enabled education, and enhance the overall academic and skill development of students through the Skila.ai platform.
Objectives:
${mouData.objectives.map((o) => `• ${o}`).join('\n')}

II. SCOPE OF COLLABORATION
${mouData.scopeAreas.map((s, i) => `${i + 1}. ${s}`).join('\n')}

III. FINANCIAL ARRANGEMENTS
a. Payment Details:
Product: ${mouData.financials.product}
Description: ${mouData.financials.description}
Retail Price: ${mouData.financials.retailPrice}
Final Discounted Price: ${mouData.financials.discountedPrice}
Estimated Student Enrolment: ${mouData.financials.estimatedStudents}
Total Contract Value: ${mouData.financials.totalContractValue}

b. Terms and Conditions:
➢ The details of pricing are confidential and must not be disclosed to any other Educational Institution.
➢ ${mouData.financials.gstTerms}
➢ The actual cost could vary based on the number of students.
➢ Payment Schedule:
${mouData.financials.paymentMilestones.map((m) => `  • ${m.percentage}: ${m.condition}`).join('\n')}
➢ ${mouData.financials.priceValidity}

IV. DIGITAL CONTENT ACKNOWLEDGMENT
${mouData.digitalContentNotice}

V. ROLES AND RESPONSIBILITIES OF TECH NIRMAAN
${mouData.techNirmaanResponsibilities.map((r) => `• ${r}`).join('\n')}

VI. ROLES AND RESPONSIBILITIES OF ${mouData.schoolParty.name.toUpperCase()}
${mouData.schoolResponsibilities.map((r) => `• ${r}`).join('\n')}

VII. CONFIDENTIALITY
${mouData.confidentialityClause}

VIII. DURATION, TERMINATION AND AMENDMENT
${mouData.durationClause}

IX. NON-EXCLUSIVITY CLAUSE
${mouData.nonExclusivityClause}

X. INTELLECTUAL PROPERTY CLAUSE
• ${mouData.ipClause1}
• ${mouData.ipClause2}

XI. LIMITATION OF LIABILITY
${mouData.liabilityClause}

XII. GOVERNING LAW
${mouData.governingLawClause}

IN WITNESS WHEREOF
The Parties have executed this Memorandum of Understanding on the date first written above.

For Tech Nirmaan:
Name: ${mouData.techNirmaan.signatoryName}
Designation: ${mouData.techNirmaan.signatoryTitle}

For ${mouData.schoolParty.name}:
Name: ${mouData.schoolParty.signatoryName}
Designation: ${mouData.schoolParty.signatoryTitle}
    `.trim();

    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Hidden file inputs for uploading and replacing logos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesUpload(e.target.files)}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceFileInputRef}
        onChange={handleReplaceFile}
        accept="image/*"
        className="hidden"
      />

      {/* Print Styles for Multi-page Legal Document */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .mou-print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          .mou-page-break {
            page-break-before: always;
            break-before: page;
          }
          .mou-avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .mou-header-rule {
            border-bottom: 2px solid #1e3a8a !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[94vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header & Interactive Toolbar (hidden in print) */}
        <div className="print:hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Memorandum of Understanding (MOU)
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Legal Agreement
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                Tech Nirmaan &bull; Skila.ai &times; {mouData.schoolParty.name}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document View</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Clauses &amp; Terms</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {activeTab === 'preview' && (
              <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inlineEdit}
                  onChange={(e) => setInlineEdit(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Inline Edit</span>
              </label>
            )}

            {/* Quick Upload Button directly in header */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              title="Upload logo(s) for this school (supports multiple)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Logo</span>
            </button>

            <button
              onClick={handleCopyText}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              title="Copy plain text agreement"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleResetToTemplate}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              title="Reset to 7-page PDF standard legal agreement"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>

            <button
              onClick={handleSaveToRecord}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Save agreement terms & logos to school record"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Print or export high-resolution PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {saveStatus.text && (
          <div
            className={`print:hidden px-4 py-2 text-xs font-medium flex items-center justify-between border-b ${
              saveStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{saveStatus.text}</span>
            </div>
            <button
              onClick={() => setSaveStatus({ type: '', text: '' })}
              className="text-xs hover:underline cursor-pointer opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100/60 dark:bg-slate-950/60 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
          
          {/* ======================================================== */}
          {/* TAB 1: DOCUMENT PREVIEW (PRINT-READY LEGAL FORMAT)     */}
          {/* ======================================================== */}
          {activeTab === 'preview' && (
            <div className="mou-print-container max-w-4xl mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-12 space-y-8 font-serif leading-relaxed text-[13px] print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
              
              {/* Document Header with Uploadable Logos */}
              <div className="border-b-2 border-slate-900 dark:border-slate-300 pb-5 flex items-center justify-between gap-4">
                
                {/* School Logos Area (Left) */}
                <div className="flex items-center gap-3 flex-wrap">
                  
                  {/* If custom logos exist, render each logo in a gallery */}
                  {mouData.schoolLogos && mouData.schoolLogos.length > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {mouData.schoolLogos.map((logo, idx) => (
                        <div key={logo.id || idx} className="relative group shrink-0">
                          <img
                            src={logo.url}
                            alt={logo.name || 'School Logo'}
                            className="h-14 sm:h-16 w-auto max-w-[150px] object-contain drop-shadow-2xs rounded-xs bg-transparent"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {/* Hover action toolbar for this specific logo (screen only) */}
                          <div className="print:hidden absolute -top-2 -right-2 hidden group-hover:flex items-center gap-1 bg-slate-900/90 text-white rounded-full p-1 shadow-md z-10 transition">
                            <button
                              type="button"
                              onClick={() => {
                                replaceIndexRef.current = idx;
                                replaceFileInputRef.current?.click();
                              }}
                              className="p-1 hover:text-indigo-300 transition"
                              title="Replace this logo"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLogo(idx)}
                              className="p-1 hover:text-red-400 transition"
                              title="Remove logo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Small "+ Add Another Logo" button in preview (screen only) */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="print:hidden h-12 px-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-400 hover:text-indigo-600 transition flex items-center gap-1 text-[11px] font-sans font-medium cursor-pointer"
                        title="Upload another logo (e.g. Trust, Society, Board crest)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Logo</span>
                      </button>
                    </div>
                  ) : (
                    /* When NO logos are uploaded yet */
                    <div className="flex items-center gap-3">
                      {/* Dynamic Academic Initial Crest (also printed gracefully) */}
                      <SchoolInitialsCrest schoolName={mouData.schoolParty.name} size="md" />

                      {/* Prominent Upload Prompt (screen only) */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="print:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer text-xs font-sans font-semibold shadow-2xs group"
                        title="Click to upload one or multiple logos for this school"
                      >
                        <Upload className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
                        <div className="text-left">
                          <span className="block font-bold">Upload School Logo(s)</span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            Multiple photos supported (PNG/JPG)
                          </span>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* School Name & Collaboration Subtitle */}
                  <div>
                    <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tight">
                      {inlineEdit ? (
                        <input
                          type="text"
                          value={mouData.schoolParty.name}
                          onChange={(e) => handleFieldChange('schoolParty', 'name', e.target.value)}
                          className="px-1 py-0.5 border border-dashed border-indigo-400 rounded bg-indigo-50/50 font-bold"
                        />
                      ) : (
                        mouData.schoolParty.name
                      )}
                    </h3>
                    <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                      Academic &amp; Skill Development Collaboration
                    </p>
                  </div>
                </div>

                {/* Right Side: Tech Nirmaan & Skila.ai Brand */}
                <div className="text-right flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block text-right">
                    <p className="font-sans text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                      Powered By
                    </p>
                    <p className="font-sans text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Skila.ai
                    </p>
                  </div>
                  <img
                    src="/technirmaan_logo.png"
                    alt="Tech Nirmaan"
                    className="h-12 w-auto object-contain"
                    onError={(e) => {
                      e.target.src = '/skila_logo_transparent.png';
                    }}
                  />
                </div>
              </div>

              {/* Title Section (Matching Page 1 of PDF) */}
              <div className="text-center space-y-2 pt-2">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-950 dark:text-white">
                  MEMORANDUM OF UNDERSTANDING (MOU)
                </h1>
                <p className="text-xs sm:text-sm font-sans font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  For Academic, Skill Development and Digital Learning Collaboration
                </p>
                <div className="pt-2 text-xs font-sans font-bold tracking-widest text-slate-700 dark:text-slate-400">
                  <span className="block">BETWEEN</span>
                  <span className="text-base text-slate-950 dark:text-white mt-1 block">
                    {mouData.techNirmaan.name.toUpperCase()}
                  </span>
                  <span className="block my-1 text-slate-500">AND</span>
                  <span className="text-base text-slate-950 dark:text-white block">
                    {mouData.schoolParty.name.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Preamble & Parties */}
              <div className="space-y-4 pt-4 text-justify leading-relaxed">
                <p>
                  This Memorandum of Understanding (hereinafter referred to as <strong>&ldquo;MOU&rdquo;</strong>) is entered into on this{' '}
                  {inlineEdit ? (
                    <input
                      type="text"
                      value={mouData.mouSigningDateFormatted}
                      onChange={(e) => handleFieldChange(null, 'mouSigningDateFormatted', e.target.value)}
                      className="px-1.5 py-0.5 border border-dashed border-indigo-500 rounded bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold"
                    />
                  ) : (
                    <strong className="underline decoration-slate-400">{mouData.mouSigningDateFormatted}</strong>
                  )}.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 font-sans text-xs">
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                      BY AND BETWEEN:
                    </h4>
                    <p className="leading-relaxed">
                      <strong>{mouData.techNirmaan.name}</strong>, {mouData.techNirmaan.tagline}, having its principal office at{' '}
                      <em>{mouData.techNirmaan.office}</em> (hereinafter referred to as <strong>&ldquo;Tech Nirmaan&rdquo;</strong>), represented by its authorized signatory,{' '}
                      <strong>{mouData.techNirmaan.signatoryName}</strong>, {mouData.techNirmaan.signatoryTitle}.
                    </p>
                  </div>

                  <div className="text-center font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                    AND
                  </div>

                  <div>
                    <p className="leading-relaxed">
                      <strong>{mouData.schoolParty.name}</strong>, a distinguished academic institution, having its campus at{' '}
                      <em>{mouData.schoolParty.campusAddress}</em>, represented by its authorized signatory,{' '}
                      <strong>{mouData.schoolParty.signatoryName}</strong>, {mouData.schoolParty.signatoryTitle}.
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                      (Tech Nirmaan and {mouData.schoolParty.name} are hereinafter referred to individually as a &ldquo;Party&rdquo; and collectively as the &ldquo;Parties&rdquo;).
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b pb-1">
                    PREAMBLE
                  </h3>
                  <p>
                    <strong>WHEREAS</strong>, TECH NIRMAAN is a leading EdTech and technology-driven skill development organization committed to transforming education through Artificial Intelligence (AI), digital learning, coding, STEM education, innovation programs, and future-ready skill development, enabling students to excel academically and prepare for the evolving global workforce.
                  </p>
                  <p>
                    <strong>WHEREAS</strong>, TECH NIRMAAN, through its flagship AI-powered platform <strong>Skila.ai (Smart Knowledge Integrated Learning Accelerator)</strong>, provides personalized learning pathways, adaptive assessments, AI-powered learning assistance, coding and STEM education, real-time student performance analytics, teacher enablement programs, project-based learning, digital content, and holistic academic development solutions.
                  </p>
                  <p>
                    <strong>WHEREAS</strong>, {mouData.schoolParty.name}, located at {mouData.schoolParty.campusAddress}, is committed to providing quality education by fostering academic excellence, innovation, creativity, digital literacy, and the overall development of students through modern teaching methodologies and technology-enabled learning.
                  </p>
                  <p>
                    <strong>WHEREAS</strong>, both Parties share a common vision of creating a future-ready learning ecosystem by integrating Artificial Intelligence, personalized learning, digital education, coding, STEM education, innovation, and 21st-century skills into the academic environment, thereby enhancing student learning outcomes, teacher effectiveness, and institutional excellence.
                  </p>
                  <p>
                    <strong>NOW, THEREFORE</strong>, in consideration of the mutual promises, understandings, and covenants contained herein, the Parties agree to establish this Memorandum of Understanding (MOU) to collaborate in implementing AI-powered digital learning solutions, skill development initiatives, teacher capacity-building programs, student engagement activities, and future-readiness programs through the Skila.ai platform, in accordance with the terms and conditions set forth herein.
                  </p>
                </div>
              </div>

              {/* Section I. Purpose and Objectives */}
              <div className="space-y-3 pt-2">
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b pb-1">
                  I. PURPOSE AND OBJECTIVES
                </h3>
                <p>
                  The primary purpose of this Memorandum of Understanding (MOU) is to establish a strategic collaboration between Tech Nirmaan and {mouData.schoolParty.name} to implement AI-powered digital learning solutions, promote technology-enabled education, and enhance the overall academic and skill development of students through the Skila.ai platform.
                </p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  The objectives of this collaboration are to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-slate-800 dark:text-slate-200">
                  {mouData.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
                <p className="text-slate-700 dark:text-slate-300 italic pt-1">
                  This collaboration aims to create an engaging, inclusive, and future-ready learning environment that empowers students, supports educators, and contributes to the overall academic excellence of {mouData.schoolParty.name}.
                </p>
              </div>

              {/* Section II. Scope of Collaboration */}
              <div className="space-y-3 pt-2">
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b pb-1">
                  II. SCOPE OF COLLABORATION
                </h3>
                <p>The Parties agree to collaborate in the following areas:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-xs">
                  {mouData.scopeAreas.map((area, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800"
                    >
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 w-5 text-right shrink-0">
                        {i + 1}.
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section III. Financial Arrangements (Matching Page 4 of PDF) */}
              <div className="space-y-4 pt-2 mou-avoid-break">
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b pb-1">
                  III. FINANCIAL ARRANGEMENTS
                </h3>
                
                <div>
                  <h4 className="font-sans font-bold text-xs uppercase text-slate-800 dark:text-slate-200 mb-2">
                    a. Payment Details
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-300 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-4">Product</th>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-4">Retail Price</th>
                          <th className="py-2.5 px-4 text-indigo-700 dark:text-indigo-400">Final Discounted Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {mouData.financials.product}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {mouData.financials.description}
                          </td>
                          <td className="py-3 px-4 line-through text-slate-400">
                            {mouData.financials.retailPrice}
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                            {mouData.financials.discountedPrice}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Pricing commercial summary badge */}
                  <div className="mt-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex flex-wrap items-center justify-between gap-3 font-sans text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Enrolment Scope: </span>
                      <strong className="text-slate-900 dark:text-white">
                        {mouData.financials.estimatedStudents} Students ({mouData.schoolParty.classesCovered})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Total Program Consideration: </span>
                      <strong className="text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                        {mouData.financials.totalContractValue}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-sans font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                    b. Terms and Conditions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold">➢</span>
                      <span>The details of pricing are confidential and must not be disclosed to any other Educational Institution.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold">➢</span>
                      <span><strong>{mouData.financials.gstTerms}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold">➢</span>
                      <span>The actual cost could vary based on the number of students.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold">➢</span>
                      <div>
                        <span>{mouData.schoolParty.name} shall pay Tech Nirmaan as per the Schedule mentioned herein below:</span>
                        <div className="pl-4 mt-1 space-y-1 font-medium">
                          {mouData.financials.paymentMilestones.map((m, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-indigo-600 font-bold">•</span>
                              <span><strong>{m.percentage}</strong> of the amount will be {m.condition}.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold">➢</span>
                      <span>Any change in the above could impact and lead to change in the overall cost of the program.</span>
                    </li>
                  </ul>
                  <p className="text-xs font-sans text-slate-600 dark:text-slate-400 italic pt-1">
                    {mouData.financials.priceValidity}
                  </p>
                </div>
              </div>

              {/* Section IV. Digital Content Acknowledgment */}
              <div className="space-y-2 pt-2 mou-avoid-break">
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b pb-1">
                  IV. DIGITAL CONTENT ACKNOWLEDGMENT
                </h3>
                <p className="leading-relaxed">
                  {mouData.digitalContentNotice}
                </p>
              </div>

              {/* Section V. Roles & Responsibilities of Tech Nirmaan */}
              <div className="space-y-3 pt-2 mou-avoid-break">
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b pb-1">
                  V. ROLES AND RESPONSIBILITIES OF TECH NIRMAAN
                </h3>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Tech Nirmaan shall:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-800 dark:text-slate-200">
                  {mouData.techNirmaanResponsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>

              {/* Section VI. Roles & Responsibilities of School */}
              <div className="space-y-3 pt-2 mou-avoid-break">
                <h3 className="font-sans font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b pb-1">
                  VI. ROLES AND RESPONSIBILITIES OF {mouData.schoolParty.name.toUpperCase()}
                </h3>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {mouData.schoolParty.name} shall:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-slate-800 dark:text-slate-200">
                  {mouData.schoolResponsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>

              {/* Sections VII - XII Legal Provisions */}
              <div className="space-y-4 pt-2 mou-avoid-break font-sans text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    VII. CONFIDENTIALITY
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-serif text-[13px]">
                    {mouData.confidentialityClause}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    VIII. DURATION, TERMINATION AND AMENDMENT
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-serif text-[13px]">
                    {mouData.durationClause}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    IX. NON-EXCLUSIVITY CLAUSE
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-serif text-[13px]">
                    {mouData.nonExclusivityClause}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    X. INTELLECTUAL PROPERTY CLAUSE
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 font-serif text-[13px]">
                    <li>{mouData.ipClause1}</li>
                    <li>{mouData.ipClause2}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    XI. LIMITATION OF LIABILITY
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-serif text-[13px]">
                    {mouData.liabilityClause}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                    XII. GOVERNING LAW
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-serif text-[13px]">
                    {mouData.governingLawClause}
                  </p>
                </div>

                {/* Custom Clauses if added */}
                {mouData.customClauses && mouData.customClauses.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                      XIII. SPECIAL CONDITIONS &amp; ADDENDUMS
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 font-serif text-[13px]">
                      {mouData.customClauses.map((clause, idx) => (
                        <li key={idx}>{clause}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Execution & Dual Signature Box (Matching Page 7 of PDF) */}
              <div className="pt-8 border-t-2 border-slate-900 dark:border-slate-300 space-y-6 mou-avoid-break">
                <div className="text-center font-bold font-sans uppercase tracking-widest text-sm text-slate-950 dark:text-white">
                  IN WITNESS WHEREOF
                </div>
                <p className="text-center text-xs italic text-slate-600 dark:text-slate-400">
                  The Parties have executed this Memorandum of Understanding on the date first written above.
                </p>

                <div className="grid grid-cols-2 gap-8 sm:gap-12 pt-4 font-sans text-xs">
                  {/* Party 1: Tech Nirmaan Signature Box */}
                  <div className="space-y-4 border border-slate-300 dark:border-slate-700 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] border-b pb-1">
                      For Tech Nirmaan
                    </p>
                    <div className="h-16 flex items-end">
                      <div className="w-full border-b border-dashed border-slate-400 pb-1 text-indigo-700 dark:text-indigo-400 italic font-serif">
                        Authorized Signatory
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p>
                        <span className="text-slate-500">Signature: </span>
                        <span className="font-serif italic">_______________________</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Name: </span>
                        <strong>{mouData.techNirmaan.signatoryName}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Designation: </span>
                        <span>{mouData.techNirmaan.signatoryTitle}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Date: </span>
                        <span>{mouData.mouDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Party 2: School Signature Box */}
                  <div className="space-y-4 border border-slate-300 dark:border-slate-700 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] border-b pb-1">
                      For {mouData.schoolParty.name}
                    </p>
                    <div className="h-16 flex items-end">
                      <div className="w-full border-b border-dashed border-slate-400 pb-1 text-slate-700 dark:text-slate-300 italic font-serif">
                        Authorized Signatory
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p>
                        <span className="text-slate-500">Signature: </span>
                        <span className="font-serif italic">_______________________</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Name: </span>
                        <strong>{mouData.schoolParty.signatoryName}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Designation: </span>
                        <span>{mouData.schoolParty.signatoryTitle}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Date: </span>
                        <span>{mouData.mouDate}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 text-[10px] text-slate-400 font-sans border-t border-slate-200 dark:border-slate-800">
                  Tech Nirmaan &bull; Official Legal Reference: <span className="font-mono font-semibold">{mouData.mouNumber}</span> &bull; Status: {mouData.status}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: STRUCTURED CLAUSES & TERMS EDITOR                 */}
          {/* ======================================================== */}
          {activeTab === 'editor' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Informational Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-transparent border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Interactive Legal Agreement Editor
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Customize commercial parameters, signatories, institutional logos, per-student pricing, and specific school clauses. All changes update the Document View in real-time and can be saved to Firestore.
                  </p>
                </div>
              </div>

              {/* Section 0: Institutional Logos & Branding (Multiple Supported!) */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4" />
                    <span>School &amp; Institutional Logos ({mouData.schoolLogos?.length || 0} Attached)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyPresetCrest}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Sample Crest Preset
                    </button>
                    {mouData.schoolLogos?.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllLogos}
                        className="text-[11px] text-red-500 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Drag-and-drop / Click-to-upload Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFilesUpload(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Click or Drag &amp; Drop to Upload Logo(s)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Upload one or multiple photos: School Crest, Educational Trust, Society, or Affiliation emblem (PNG, JPG, SVG, WebP)
                    </p>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
                    Supports Multiple Photos &bull; Auto-optimized for Print
                  </span>
                </div>

                {/* List of currently attached logos */}
                {mouData.schoolLogos && mouData.schoolLogos.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Attached Logos for {mouData.schoolParty.name}:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {mouData.schoolLogos.map((logo, idx) => (
                        <div
                          key={logo.id || idx}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 relative group"
                        >
                          <img
                            src={logo.url}
                            alt={logo.name}
                            className="h-12 w-12 object-contain rounded-md bg-white p-1 border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={logo.name || `Logo ${idx + 1}`}
                              onChange={(e) => {
                                const newLogos = [...mouData.schoolLogos];
                                newLogos[idx].name = e.target.value;
                                setMouData((prev) => ({ ...prev, schoolLogos: newLogos }));
                              }}
                              className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-hidden w-full"
                              title="Rename logo label"
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {idx === 0 ? 'Primary Crest' : `Partner Logo #${idx + 1}`}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                replaceIndexRef.current = idx;
                                replaceFileInputRef.current?.click();
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition"
                              title="Replace photo"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLogo(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 transition"
                              title="Delete logo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 1: Agreement Meta & Identification */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Agreement Metadata &amp; Tenure</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      MOU Reference Number
                    </label>
                    <input
                      type="text"
                      value={mouData.mouNumber}
                      onChange={(e) => handleFieldChange(null, 'mouNumber', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Signing Date (Formatted in Agreement)
                    </label>
                    <input
                      type="text"
                      value={mouData.mouSigningDateFormatted}
                      onChange={(e) => handleFieldChange(null, 'mouSigningDateFormatted', e.target.value)}
                      placeholder="e.g. 08th day of July 2026"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Agreement Duration
                    </label>
                    <input
                      type="text"
                      value={mouData.mouValidity}
                      onChange={(e) => handleFieldChange(null, 'mouValidity', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Execution Status
                    </label>
                    <select
                      value={mouData.status}
                      onChange={(e) => handleFieldChange(null, 'status', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    >
                      <option value="Drafting">Drafting</option>
                      <option value="Sent for Signing">Sent for Signing</option>
                      <option value="Signed by School">Signed by School</option>
                      <option value="Fully Executed">Fully Executed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={mouData.academicYear}
                      onChange={(e) => handleFieldChange(null, 'academicYear', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Parties Details */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>Parties &amp; Signatories</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Party 1: Tech Nirmaan */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] pb-1 border-b">
                      Party 1: Tech Nirmaan
                    </h4>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Entity Name</label>
                      <input
                        type="text"
                        value={mouData.techNirmaan.name}
                        onChange={(e) => handleFieldChange('techNirmaan', 'name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Principal Office</label>
                      <textarea
                        rows={2}
                        value={mouData.techNirmaan.office}
                        onChange={(e) => handleFieldChange('techNirmaan', 'office', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Signatory Name</label>
                        <input
                          type="text"
                          value={mouData.techNirmaan.signatoryName}
                          onChange={(e) => handleFieldChange('techNirmaan', 'signatoryName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Designation</label>
                        <input
                          type="text"
                          value={mouData.techNirmaan.signatoryTitle}
                          onChange={(e) => handleFieldChange('techNirmaan', 'signatoryTitle', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Party 2: School */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] pb-1 border-b">
                      Party 2: {mouData.schoolParty.name}
                    </h4>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">School Name</label>
                      <input
                        type="text"
                        value={mouData.schoolParty.name}
                        onChange={(e) => handleFieldChange('schoolParty', 'name', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Campus Address</label>
                      <textarea
                        rows={2}
                        value={mouData.schoolParty.campusAddress}
                        onChange={(e) => handleFieldChange('schoolParty', 'campusAddress', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Authorized Signatory</label>
                        <input
                          type="text"
                          value={mouData.schoolParty.signatoryName}
                          onChange={(e) => handleFieldChange('schoolParty', 'signatoryName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Designation</label>
                        <input
                          type="text"
                          value={mouData.schoolParty.signatoryTitle}
                          onChange={(e) => handleFieldChange('schoolParty', 'signatoryTitle', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Designated SPOC</label>
                        <input
                          type="text"
                          value={mouData.schoolParty.coordinatorName}
                          onChange={(e) => handleFieldChange('schoolParty', 'coordinatorName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">SPOC Title</label>
                        <input
                          type="text"
                          value={mouData.schoolParty.coordinatorTitle}
                          onChange={(e) => handleFieldChange('schoolParty', 'coordinatorTitle', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Financial Arrangements & Commercial Calculation */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" />
                  <span>Financial Arrangements &amp; Payment Schedule (Section III)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Retail Price (Per Student)
                    </label>
                    <input
                      type="text"
                      value={mouData.financials.retailPrice}
                      onChange={(e) => handleFieldChange('financials', 'retailPrice', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Discounted Price (₹ per Student)
                    </label>
                    <input
                      type="number"
                      value={mouData.financials.discountedPriceNum}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold text-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Enrolled Students
                    </label>
                    <input
                      type="number"
                      value={mouData.financials.estimatedStudents}
                      onChange={(e) => handleStudentsChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Total Calculated Consideration
                    </label>
                    <input
                      type="text"
                      value={mouData.financials.totalContractValue}
                      onChange={(e) => handleFieldChange('financials', 'totalContractValue', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Payment Milestones */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Payment Milestones Schedule
                  </label>
                  <div className="space-y-2">
                    {mouData.financials.paymentMilestones.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={m.percentage}
                          onChange={(e) => {
                            const newMilestones = [...mouData.financials.paymentMilestones];
                            newMilestones[idx].percentage = e.target.value;
                            handleFieldChange('financials', 'paymentMilestones', newMilestones);
                          }}
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center"
                        />
                        <input
                          type="text"
                          value={m.condition}
                          onChange={(e) => {
                            const newMilestones = [...mouData.financials.paymentMilestones];
                            newMilestones[idx].condition = e.target.value;
                            handleFieldChange('financials', 'paymentMilestones', newMilestones);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 4: Scope of Collaboration (9 Points) */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    <span>Scope of Collaboration ({mouData.scopeAreas.length} Areas)</span>
                  </div>
                  <button
                    onClick={() => handleAddArrayItem('scopeAreas', 'New Collaborative Initiative')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Area</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {mouData.scopeAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-right font-bold text-xs text-slate-400">{idx + 1}.</span>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => handleArrayItemChange('scopeAreas', idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleRemoveArrayItem('scopeAreas', idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Custom Addendums & Special Covenants */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Special Addendums / Custom Clauses</span>
                  </div>
                  <button
                    onClick={() => handleAddArrayItem('customClauses', 'Special mutual covenant...')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Special Clause</span>
                  </button>
                </div>

                {(!mouData.customClauses || mouData.customClauses.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">
                    No custom special clauses specified. The agreement uses the standard 7-page legal provisions.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {mouData.customClauses.map((clause, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={clause}
                          onChange={(e) => handleArrayItemChange('customClauses', idx, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={() => handleRemoveArrayItem('customClauses', idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Quick Save in Editor Mode */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to print? Switch back to <strong>Document View</strong> to review the formatted pages.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    Preview Document
                  </button>
                  <button
                    onClick={handleSaveToRecord}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save to School Record'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
