/**
 * Skila Platform Standard Formatting Utilities
 */

export function formatINR(val, fallback = '₹0') {
  if (val === undefined || val === null || val === '') return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return fallback;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

export function formatShortINR(val, fallback = '₹0') {
  if (val === undefined || val === null || val === '') return fallback;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return fallback;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`;
  return `₹${Math.round(num)}`;
}

export function cleanNumber(val, fallback = 0) {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

export function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(isoStr).slice(0, 10);
  }
}

/**
 * Utility functions for formatting CRM remarks, JSON objects, and structured data into executive-friendly text.
 */
export function formatRemarksToCleanText(val) {
  if (!val) return '';

  const renderObjectToText = (data, depth = 0) => {
    if (data === null || data === undefined) return '';
    if (typeof data !== 'object') return String(data);

    if (Array.isArray(data)) {
      return data.map((item) => {
        if (item && typeof item === 'object') {
          const parts = [];
          for (const [k, v] of Object.entries(item)) {
            const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            parts.push(`${label}: ${typeof v === 'object' ? renderObjectToText(v, depth + 1) : v}`);
          }
          return `  • ${parts.join(' — ')}`;
        }
        return `  • ${item}`;
      }).join('\n');
    }

    const sections = [];
    for (const [k, v] of Object.entries(data)) {
      const title = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (depth === 0) {
        if (typeof v === 'object' && v !== null) {
          sections.push(`📌 ${title.toUpperCase()}\n\n${renderObjectToText(v, depth + 1)}`);
        } else {
          sections.push(`📌 ${title.toUpperCase()}:\n${v}`);
        }
      } else {
        if (Array.isArray(v)) {
          sections.push(`• ${title}:\n${renderObjectToText(v, depth + 1)}`);
        } else if (typeof v === 'object' && v !== null) {
          sections.push(`• ${title}:\n${renderObjectToText(v, depth + 1)}`);
        } else {
          sections.push(`• ${title}: ${v}`);
        }
      }
    }
    return sections.join('\n\n');
  };

  if (typeof val === 'object') {
    try {
      return renderObjectToText(val).trim();
    } catch (e) {}
  }

  let t = String(val).trim();

  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try {
      const parsed = JSON.parse(t);
      if (parsed && typeof parsed === 'object') {
        return renderObjectToText(parsed).trim();
      }
    } catch (e) {
      try {
        const relaxed = t
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"');
        const parsed = JSON.parse(relaxed);
        if (parsed && typeof parsed === 'object') {
          return renderObjectToText(parsed).trim();
        }
      } catch (e2) {}
    }
  }

  t = t
    .replace(/\\u2019/g, "'")
    .replace(/\\u2018/g, "'")
    .replace(/\\u201c/g, '"')
    .replace(/\\u201d/g, '"')
    .replace(/\\u2014/g, ' — ')
    .replace(/\\u2013/g, ' – ')
    .replace(/\\u20b9/g, '₹')
    .replace(/\ufffd/g, "'");

  t = t.replace(/\{[^{}]+\}/g, (match) => {
    try {
      const parsed = JSON.parse(match);
      return renderObjectToText(parsed);
    } catch (e) {
      try {
        const relaxed = match.replace(/'/g, '"');
        const parsed = JSON.parse(relaxed);
        return renderObjectToText(parsed);
      } catch (e2) {
        return match;
      }
    }
  });

  if (t.includes('{') || t.includes('}') || t.includes('":') || t.includes('": {')) {
    t = t
      .replace(/\{\s*"?([a-zA-Z0-9_ ]+)"?\s*:\s*\{/g, '\n📌 $1\n')
      .replace(/"?([a-zA-Z0-9_ ]+)"?\s*:\s*\[/g, '\n• $1:\n')
      .replace(/"?([a-zA-Z0-9_ ]+)"?\s*:\s*"([^"]+)"/g, '• $1: $2')
      .replace(/"?([a-zA-Z0-9_ ]+)"?\s*:\s*([^\n,}]+)/g, '• $1: $2')
      .replace(/[{}\[\]]/g, '')
      .replace(/^[ \t]*"/gm, '  • ')
      .replace(/",?$/gm, '');
  }

  t = t.replace(/\[\s*('[^']+'|"[^"]+")(?:\s*,\s*('[^']+'|"[^"]+"))*\s*\]/g, (match) => {
    try {
      const jsonArr = match.replace(/'/g, '"');
      const parsed = JSON.parse(jsonArr);
      if (Array.isArray(parsed)) {
        return '\n    • ' + parsed.join('\n    • ');
      }
    } catch (e) {}
    return match;
  });

  t = t.replace(/[•\u2022]\s*[•\u2022]/g, '•');
  t = t.replace(/[•\u2022]\s*-\s*/g, '• ');
  t = t.replace(/^[ \t]*[•\u2022][ \t]*/gm, '  • ');

  return t.trim();
}

/**
 * Resolves a lead status string and deal closed flag to a formatted badge configuration.
 */
export function getLeadStatusBadge(leadStatus = '', dealClosed = false) {
  if (dealClosed || (leadStatus && String(leadStatus).trim().toLowerCase() === 'closed won')) {
    return {
      label: 'Deal Closed',
      icon: '🏆',
      className: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
    };
  }

  const normalized = (leadStatus || '').toString().trim().toLowerCase();

  switch (normalized) {
    case 'proposal shared':
      return {
        label: 'Proposal Shared',
        icon: '📄',
        className: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
      };
    case 'demo scheduled':
      return {
        label: 'Demo Scheduled',
        icon: '📅',
        className: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
      };
    case 'demo completed':
    case 'demo done':
      return {
        label: 'Demo Done',
        icon: '🎯',
        className: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700'
      };
    case 'meeting scheduled':
      return {
        label: 'Meeting Scheduled',
        icon: '🗓️',
        className: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
      };
    case 'pilot started':
    case 'pilot running':
      return {
        label: 'Pilot Started',
        icon: '🚀',
        className: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700'
      };
    case 'contacted':
      return {
        label: 'Contacted',
        icon: '📞',
        className: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
      };
    case 'closed lost':
    case 'not interested':
      return {
        label: 'Closed Lost',
        icon: '❌',
        className: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
      };
    case 'new':
    case 'new lead':
    case '':
    case undefined:
    case null:
      return {
        label: 'New Lead',
        icon: '✨',
        className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
      };
    default:
      return {
        label: String(leadStatus).trim(),
        icon: '📌',
        className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
      };
  }
}
