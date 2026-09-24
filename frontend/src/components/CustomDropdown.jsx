import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * CustomDropdown ensures options always drop DOWN (never upwards/top),
 * includes quick search filtering for long lists (e.g. states/districts),
 * and dismisses gracefully on click-outside or Escape.
 */
export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  searchable = true,
  variant = 'dark', // 'dark' | 'auto'
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  alignRight = false,
  emptyText = 'No options available'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to { value, label } format
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: opt, label: String(opt) };
      }
      if (opt && typeof opt === 'object') {
        const val = opt.value !== undefined ? opt.value : (opt.name !== undefined ? opt.name : JSON.stringify(opt));
        const lbl = opt.label !== undefined ? opt.label : (opt.name !== undefined ? opt.name : String(val));
        return { value: val, label: lbl };
      }
      return { value: String(opt), label: String(opt) };
    });
  }, [options]);

  // Find currently selected label
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [normalizedOptions, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && normalizedOptions.length > 6) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable, normalizedOptions.length]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      if (prev) {
        setSearchQuery('');
      }
      return !prev;
    });
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Styling presets
  const isDark = variant === 'dark';

  const triggerClasses = isDark
    ? `w-full text-xs rounded-lg bg-slate-800/90 border border-slate-700 text-white p-2.5 font-medium flex items-center justify-between transition focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'
      } ${isOpen ? 'ring-2 ring-indigo-500 border-transparent' : ''}`
    : `w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 font-medium flex items-center justify-between transition focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600'
      } ${isOpen ? 'ring-1 ring-indigo-500 border-transparent' : ''}`;

  const menuClasses = isDark
    ? 'bg-slate-900 border border-slate-700/90 text-white shadow-2xl ring-1 ring-black/40'
    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl';

  const searchBgClasses = isDark
    ? 'bg-slate-950/80 border-b border-slate-800'
    : 'bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800';

  const searchInputClasses = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-indigo-500'
    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500';

  const optionHoverClasses = isDark
    ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white';

  const optionSelectedClasses = isDark
    ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
    : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold';

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-40' : 'z-10'} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`${triggerClasses} ${buttonClassName}`}
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Downward-Opening Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${alignRight ? 'right-0' : 'left-0'} top-full mt-1.5 w-full min-w-full rounded-xl z-50 overflow-hidden flex flex-col max-h-64 ${menuClasses} ${dropdownClassName}`}
          style={{ transformOrigin: 'top' }}
        >
          {/* Quick search filter for long option lists */}
          {searchable && normalizedOptions.length > 6 && (
            <div className={`p-2 sticky top-0 z-10 ${searchBgClasses}`}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter options..."
                  className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${searchInputClasses}`}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div ref={listRef} className="overflow-y-auto flex-1 py-1 divide-y divide-slate-800/20">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">
                {searchQuery ? 'No matching results' : emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    title={opt.label}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? optionSelectedClasses : optionHoverClasses
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
