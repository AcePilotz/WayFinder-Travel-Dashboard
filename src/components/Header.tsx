import React from 'react';
import { Search } from 'lucide-react';

export type NavSection = 'overview' | 'weather' | 'currency' | 'gallery' | 'news';

interface HeaderProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  onFocusSearch: () => void;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'weather', label: 'Weather' },
  { id: 'currency', label: 'Currency' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'news', label: 'News' },
];

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  onFocusSearch,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          Wayfinder
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors duration-150 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? 'text-blue-700 border-blue-700'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onFocusSearch}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Find Destination</span>
          </button>
        </div>
      </div>
    </header>
  );
};
