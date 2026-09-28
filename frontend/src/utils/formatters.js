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

  // If val is already an object/array
  if (typeof val === 'object') {
    try {
      return renderObjectToText(val).trim();
    } catch (e) {}
  }

  let t = String(val).trim();

  // Check if string is a JSON or stringified dictionary
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

  // 1. Unescape escaped unicode sequences & clean replacement artifacts
  t = t
    .replace(/\\u2019/g, "'")
    .replace(/\\u2018/g, "'")
    .replace(/\\u201c/g, '"')
    .replace(/\\u201d/g, '"')
    .replace(/\\u2014/g, ' — ')
    .replace(/\\u2013/g, ' – ')
    .replace(/\\u20b9/g, '₹')
    .replace(/\ufffd/g, "'");

  // 2. Parse inline stringified JSON objects
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

  // 3. Clean remaining pseudo-JSON brackets and quotes if present
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

  // 4. Format stringified python-style arrays like ['Item 1', 'Item 2']
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

  // 5. Clean redundant bullet markers and spaces
  t = t.replace(/[•\u2022]\s*[•\u2022]/g, '•');
  t = t.replace(/[•\u2022]\s*-\s*/g, '• ');
  t = t.replace(/^[ \t]*[•\u2022][ \t]*/gm, '  • ');

  return t.trim();
}
