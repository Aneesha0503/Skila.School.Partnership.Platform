import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, 
  PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Download, 
  Plus, Trash2, Building2, Users, CheckCircle2, Clock, AlertCircle, 
  X, Search, Filter, RefreshCw, FileText, Wallet, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatShortINR } from '../utils/formatters';

export default function FinancialAnalyticsModal({ isOpen, onClose, onSelectSchool }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'schools' | 'ledger'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Quick Action Forms
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');

  // Form States
  const [expenseForm, setExpenseForm] = useState({
    category: 'Cloud Infrastructure & AI Tokens',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    payment_mode: 'Bank Transfer',
    receipt_ref: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    payment_type: 'Commercial Advance (50%)',
    payment_mode: 'NEFT / RTGS',
    reference_no: '',
    notes: ''
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch financial analytics from backend
  const fetchAnalytics = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/finances/analytics');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setData(json);
      if (json.schools_economics && json.schools_economics.length > 0 && !selectedSchoolId) {
        setSelectedSchoolId(json.schools_economics[0].school_id);
      }
    } catch (err) {
      console.error('Failed to load financial analytics:', err);
      setErrorMsg('Failed to load financial analytics. Please check backend server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  // Handle Log Expense
  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      setErrorMsg('Please select a school to log this expense against.');
      return;
    }
    const amt = parseFloat(expenseForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }
    setFormSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/schools/${selectedSchoolId}/finances/expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...expenseForm,
          amount: amt,
          logged_by: user?.full_name || 'Admin'
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resJson = await res.json();
      setSuccessMsg(resJson.message || 'Expense successfully logged!');
      setExpenseForm({
        category: 'Cloud Infrastructure & AI Tokens',
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        payment_mode: 'Bank Transfer',
        receipt_ref: ''
      });
      setShowExpenseForm(false);
      await fetchAnalytics(true);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error logging expense:', err);
      setErrorMsg('Could not log expense. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (schoolId, expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/schools/${schoolId}/finances/expense/${expenseId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccessMsg('Expense deleted successfully.');
      await fetchAnalytics(true);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error deleting expense:', err);
      setErrorMsg('Could not delete expense.');
    }
  };

  // Handle Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      setErrorMsg('Please select a school to record payment for.');
      return;
    }
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid payment amount.');
      return;
    }
    setFormSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/schools/${selectedSchoolId}/finances/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...paymentForm,
          amount: amt
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resJson = await res.json();
      setSuccessMsg(resJson.message || 'Payment successfully recorded!');
      setPaymentForm({
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        payment_type: 'Commercial Advance (50%)',
        payment_mode: 'NEFT / RTGS',
        reference_no: '',
        notes: ''
      });
      setShowPaymentForm(false);
      await fetchAnalytics(true);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error recording payment:', err);
      setErrorMsg('Could not record payment. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const summary = data?.summary || {
    total_contracted_revenue: 0,
    total_collected_revenue: 0,
    total_pending_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    projected_profit: 0,
    profit_margin_pct: 0,
    projected_margin_pct: 0,
    roi_multiplier: 1.0,
    partner_schools_count: 0,
    total_students_served: 0
  };

  const schools = data?.schools_economics || [];
  const categories = data?.categories_breakdown || [];
  const trends = data?.monthly_trends || [];
  const ledger = data?.recent_expenses || [];

  // Filtered schools
  const filteredSchools = schools.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (s.school_name || '').toLowerCase().includes(q);
      const matchDist = (s.district || '').toLowerCase().includes(q);
      const matchState = (s.state || '').toLowerCase().includes(q);
      if (!matchName && !matchDist && !matchState) return false;
    }
    if (statusFilter !== 'All') {
      if ((statusFilter === 'High Profit' || statusFilter === 'High Margin') && s.profit_margin_pct < 20) return false;
      if (statusFilter === 'Fully Paid' && s.invoice_status !== 'Fully Paid') return false;
      if (statusFilter === 'Advance Paid' && s.invoice_status !== 'Advance Paid') return false;
      if (statusFilter === 'Pending' && s.invoice_status !== 'Pending Invoice') return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-6xl my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  School Fees & Expense Tracker (Accounts)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {summary.profit_margin_pct >= 0 ? `+${summary.profit_margin_pct}% Profit Margin` : `${summary.profit_margin_pct}% Deficit`}
                </span>
                <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {summary.partner_schools_count} Joined Schools
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track fees collected from joined schools, daily operational expenses, and net profit.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <a
              href="/api/finances/export"
              download="Skila_School_Accounts_Statement.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-2xs cursor-pointer"
              title="Download Accounts Statement as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Accounts (CSV)</span>
            </a>

            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Refresh financial data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK NOTICES */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
          </div>
        )}

        {/* TOP 5 EXECUTIVE METRIC CARDS */}
        <div className="px-5 pt-4 pb-2 grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
          {/* 1. Contracted Revenue */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Total Agreed Fees</span>
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {formatINR(summary.total_contracted_revenue)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {summary.partner_schools_count} Signed Agreements
            </div>
          </div>

          {/* 2. Cash Collected */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 mb-1">
              <span>Fees Collected (Cash In)</span>
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-blue-950 dark:text-blue-100">
              {formatINR(summary.total_collected_revenue)}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-300 mt-0.5">
              {summary.total_contracted_revenue > 0 ? `${Math.round((summary.total_collected_revenue / summary.total_contracted_revenue) * 100)}% collected` : '100%'}
            </div>
          </div>

          {/* 3. Operational Expenses */}
          <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-900/50">
            <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 mb-1">
              <span>Total Money Spent (Outflow)</span>
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-rose-950 dark:text-rose-100">
              {formatINR(summary.total_expenses)}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-300 mt-0.5 truncate">
              Hardware, AI, visits & operations
            </div>
          </div>

          {/* 4. Net Realized Profit */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-1">
              <span>Net Profit (Remaining)</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className={`text-lg sm:text-xl font-extrabold ${summary.net_profit >= 0 ? 'text-emerald-950 dark:text-emerald-100' : 'text-red-600'}`}>
              {formatINR(summary.net_profit)}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {summary.profit_margin_pct}% Realized Margin
            </div>
          </div>

          {/* 5. ROI Multiplier & Projected */}
          <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/80 dark:border-purple-900/50 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 mb-1">
              <span>Return on Spend (ROI)</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-purple-950 dark:text-purple-100">
              {summary.roi_multiplier}x
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5 truncate">
              Projected: {formatShortINR(summary.projected_profit)}
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS & ACTION BUTTONS */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Overall Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('schools')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schools'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>School Accounts ({filteredSchools.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ledger'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Expense Bills & Log ({ledger.length})</span>
            </button>
          </div>

          {/* Quick Record Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowExpenseForm(!showExpenseForm); setShowPaymentForm(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Expense Bill</span>
            </button>

            <button
              onClick={() => { setShowPaymentForm(!showPaymentForm); setShowExpenseForm(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>+ Add Fee Payment</span>
            </button>
          </div>
        </div>

        {/* EXPANDABLE QUICK FORM: LOG EXPENSE */}
        {showExpenseForm && (
          <div className="mx-5 my-3 p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl animate-fade-in shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                Add Operational Expense Bill
              </h3>
              <button onClick={() => setShowExpenseForm(false)} className="text-rose-500 hover:text-rose-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleLogExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Select School</label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  {schools.map(s => (
                    <option key={s.school_id} value={s.school_id}>
                      {s.school_name} ({s.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Cost Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Cloud Infrastructure & AI Tokens">Cloud Infrastructure & AI Tokens</option>
                  <option value="STEM & Robotics Hardware Kits">STEM & Robotics Hardware Kits</option>
                  <option value="Teacher Training & Enablement">Teacher Training & Enablement</option>
                  <option value="Field Sales & Campus Visits">Field Sales & Campus Visits</option>
                  <option value="Student Welcome Kits & Logistics">Student Welcome Kits & Logistics</option>
                  <option value="Legal, Admin & Operations">Legal, Admin & Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                  min="1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Bill Description / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Arduino UNO kits shipment & soldering tools"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Expense Bill'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* EXPANDABLE QUICK FORM: RECORD PAYMENT */}
        {showPaymentForm && (
          <div className="mx-5 my-3 p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl animate-fade-in shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Record School Fee Payment
              </h3>
              <button onClick={() => setShowPaymentForm(false)} className="text-emerald-500 hover:text-emerald-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Select School</label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  {schools.map(s => (
                    <option key={s.school_id} value={s.school_id}>
                      {s.school_name} (Pending: {formatShortINR(s.pending_revenue)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount Received (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Payment Mode</label>
                <select
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="NEFT / RTGS">NEFT / RTGS</option>
                  <option value="UPI / Online Transfer">UPI / Online Transfer</option>
                  <option value="Institutional Cheque">Institutional Cheque</option>
                  <option value="Demand Draft (DD)">Demand Draft (DD)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Bank Reference / Cheque No / UTR</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFC-9938201948"
                  value={paymentForm.reference_no}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Fee Payment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL MAIN CONTENT BODY */}
        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
              <p className="text-sm font-semibold">Loading institutional financials & expenses...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: P&L OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Revenue vs Cost Comparison Visual Flow */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                      Money Flow & Profit Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1 flex items-center justify-between">
                          <span>Total Fees Received</span>
                          <ArrowDownRight className="w-4 h-4" />
                        </div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">
                          {formatINR(summary.total_collected_revenue)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          From {summary.partner_schools_count} partner schools
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/30">
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1 flex items-center justify-between">
                          <span>Total Money Spent</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">
                          {formatINR(summary.total_expenses)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Hardware kits, AI tokens, visits & workshops
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1 flex items-center justify-between">
                          <span>Net Profit Saved</span>
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {formatINR(summary.net_profit)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {summary.profit_margin_pct}% of collected fees
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Money Spent ({Math.round((summary.total_expenses / (summary.total_collected_revenue || 1)) * 100)}%)</span>
                        <span>Net Profit Saved ({summary.profit_margin_pct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-rose-500 h-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((summary.total_expenses / (summary.total_collected_revenue || 1)) * 100))}%` }}
                          title="Expenses"
                        />
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${Math.max(0, summary.profit_margin_pct)}%` }}
                          title="Net Profit"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Operational Expense Breakdown */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                      Where Money Was Spent (Categories)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.map(cat => (
                        <div 
                          key={cat.id} 
                          className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                              {cat.name}
                            </span>
                            <span className="text-xs font-extrabold" style={{ color: cat.color }}>
                              {cat.percentage}%
                            </span>
                          </div>
                          <div className="text-lg font-black text-slate-900 dark:text-white">
                            {formatINR(cat.amount)}
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Trend Progression */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                      Monthly Cash In & Out History
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Month</th>
                            <th className="py-2.5 px-3">Fees Received (Inflow)</th>
                            <th className="py-2.5 px-3">Money Spent (Outflow)</th>
                            <th className="py-2.5 px-3">Net Remaining</th>
                            <th className="py-2.5 px-3">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {trends.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400">
                                No monthly transaction records yet.
                              </td>
                            </tr>
                          ) : (
                            trends.map((t, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{t.month}</td>
                                <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-semibold">{formatINR(t.revenue)}</td>
                                <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-semibold">{formatINR(t.expenses)}</td>
                                <td className={`py-2.5 px-3 font-extrabold ${t.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {formatINR(t.profit)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    t.profit >= 0
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                  }`}>
                                    {t.profit >= 0 ? 'Profitable' : 'Deficit'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SCHOOL ACCOUNTS TABLE */}
              {activeTab === 'schools' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search school name, district, or state..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      {['All', 'High Profit', 'Fully Paid', 'Advance Paid'].map(filterOption => (
                        <button
                          key={filterOption}
                          onClick={() => setStatusFilter(filterOption)}
                          className={`px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                            statusFilter === filterOption
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {filterOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">School Name & Place</th>
                          <th className="py-2.5 px-3">Students</th>
                          <th className="py-2.5 px-3">Agreed Fees</th>
                          <th className="py-2.5 px-3">Fees Received</th>
                          <th className="py-2.5 px-3">Pending Fees</th>
                          <th className="py-2.5 px-3">Money Spent</th>
                          <th className="py-2.5 px-3">Net Profit / Loss</th>
                          <th className="py-2.5 px-3">Profit %</th>
                          <th className="py-2.5 px-3">Payment Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSchools.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-slate-400">
                              No schools found matching your search.
                            </td>
                          </tr>
                        ) : (
                          filteredSchools.map(s => (
                            <tr key={s.school_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{s.school_name}</span>
                                  {s.is_active && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      Joined
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {s.district}, {s.state} · <span className="font-medium">{s.tier}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                {s.agreed_capacity}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                {formatShortINR(s.contracted_revenue)}
                              </td>
                              <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">
                                {formatShortINR(s.collected_revenue)}
                              </td>
                              <td className="py-3 px-3 font-bold text-amber-600 dark:text-amber-400">
                                {formatShortINR(s.pending_revenue)}
                              </td>
                              <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400">
                                {formatShortINR(s.total_expenses)}
                              </td>
                              <td className={`py-3 px-3 font-extrabold ${s.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatShortINR(s.net_profit)}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  s.profit_margin_pct >= 20 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : s.profit_margin_pct > 0
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                  {s.profit_margin_pct}%
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  s.invoice_status === 'Fully Paid'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : s.invoice_status === 'Advance Paid'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {s.invoice_status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedSchoolId(s.school_id);
                                      setShowExpenseForm(true);
                                      setShowPaymentForm(false);
                                    }}
                                    title="+ Add Expense Bill"
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSchoolId(s.school_id);
                                      setShowPaymentForm(true);
                                      setShowExpenseForm(false);
                                    }}
                                    title="+ Add Fee Payment"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition cursor-pointer"
                                  >
                                    <Wallet className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: EXPENSE AUDIT TRAIL LEDGER */}
              {activeTab === 'ledger' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Itemized record of all money spent for school kits, server tokens, travel, and training.
                    </p>
                    <button
                      onClick={() => { setShowExpenseForm(true); setShowPaymentForm(false); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Expense Bill</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Bill Date</th>
                          <th className="py-2.5 px-3">School Name</th>
                          <th className="py-2.5 px-3">Cost Category</th>
                          <th className="py-2.5 px-3">Details / Reason</th>
                          <th className="py-2.5 px-3">Paid Via</th>
                          <th className="py-2.5 px-3">Recorded By</th>
                          <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {ledger.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              No expense bills recorded yet. Click "+ Add Expense Bill" to log real operational costs.
                            </td>
                          </tr>
                        ) : (
                          ledger.map(e => (
                            <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {e.date}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                {e.school_name}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {e.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                                {e.description}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                {e.payment_mode}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                {e.logged_by}
                              </td>
                              <td className="py-2.5 px-3 text-right font-extrabold text-rose-600 dark:text-rose-400">
                                {formatINR(e.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => handleDeleteExpense(e.school_id, e.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  title="Delete Expense Bill"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span>Return on Spend: <strong className="text-slate-900 dark:text-white">{summary.roi_multiplier}x</strong></span>
            <span>·</span>
            <span>Total Students Enrolled: <strong className="text-slate-900 dark:text-white">{summary.total_students_served}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
