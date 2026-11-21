import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { CountryData } from '../types/travel';

interface SidebarProps {
  currentQuery: string;
  country: CountryData | null;
  isLoading: boolean;
  onSearch: (query: string) => void;
}

const PRESET_DESTINATIONS = ['Kenya', 'Japan', 'France', 'Iceland', 'Brazil', 'Canada'];

export const Sidebar: React.FC<SidebarProps> = ({
  currentQuery,
  country,
  isLoading,
  onSearch,
}) => {
  const [input, setInput] = useState(currentQuery);

  useEffect(() => {
    setInput(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  const handlePreset = (dest: string) => {
    setInput(dest);
    onSearch(dest);
  };

  return (
    <aside className="w-full lg:w-[272px] shrink-0 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-6 self-start">
      {/* Destination Search */}
      <div>
        <label
          htmlFor="sidebar-destination-search"
          className="block text-xs font-semibold text-slate-700 mb-2"
        >
          Search country or city
        </label>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="sidebar-destination-search"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Kenya, Tokyo, Paris"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {isLoading ? 'Loading destination...' : 'Search Destination'}
          </button>
        </form>
      </div>

      {/* Quick Presets */}
      <div className="pt-5 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-700 mb-2.5">Featured destinations</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_DESTINATIONS.map((dest) => {
            const isSelected = currentQuery.toLowerCase() === dest.toLowerCase();
            return (
              <button
                key={dest}
                type="button"
                onClick={() => handlePreset(dest)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg text-left transition-colors duration-150 whitespace-nowrap truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dest}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Country Brief */}
      {country && (
        <div className="pt-5 border-t border-slate-200 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-3">Travel brief</p>
            <div className="flex items-center gap-3">
              {country.flagUrl ? (
                <img
                  src={country.flagUrl}
                  alt={country.flagAlt}
                  referrerPolicy="no-referrer"
                  className="w-11 h-8 object-cover rounded border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-11 h-8 rounded bg-slate-100 border border-slate-200 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{country.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {country.capital} · {country.cca2}
                </p>
              </div>
            </div>
          </div>

          <dl className="divide-y divide-slate-100 text-xs">
            <div className="py-2 flex items-center justify-between gap-2">
              <dt className="text-slate-500">Currency</dt>
              <dd className="font-mono font-medium text-slate-900">
                {country.primaryCurrencyCode}
              </dd>
            </div>
            <div className="py-2 flex items-center justify-between gap-2">
              <dt className="text-slate-500">Dial code</dt>
              <dd className="font-mono font-medium text-slate-900 tabular-nums">
                {country.callingCode}
              </dd>
            </div>
            <div className="py-2 flex items-center justify-between gap-2">
              <dt className="text-slate-500">Driving side</dt>
              <dd className="font-medium text-slate-900">{country.drivingSide}</dd>
            </div>
          </dl>
        </div>
      )}
    </aside>
  );
};
