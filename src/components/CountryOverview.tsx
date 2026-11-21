import React, { useState } from 'react';
import { ExternalLink, Globe2 } from 'lucide-react';
import type { CountryData, PhotoItem, TimezoneData, WeatherData } from '../types/travel';

interface CountryOverviewProps {
  country: CountryData | null;
  weather: WeatherData | null;
  timezone: TimezoneData | null;
  heroPhoto: PhotoItem | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const FALLBACK_HERO = '/src/assets/images/travel_kenya_savanna_1795246231430.jpg';

export const CountryOverview: React.FC<CountryOverviewProps> = ({
  country,
  weather,
  timezone,
  heroPhoto,
  isLoading,
  error,
  onRetry,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (isLoading && !country) {
    return (
      <section className="space-y-6" aria-label="Loading destination overview">
        <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 w-64 bg-slate-200 rounded" />
              <div className="h-32 w-full bg-slate-100 rounded" />
            </div>
            <div className="lg:col-span-5 h-64 bg-slate-200 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error && !country) {
    return (
      <section className="bg-white border border-red-200 rounded-xl p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Destination not found</h2>
        <p className="text-sm text-slate-600 mb-5">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
        >
          Reset to Kenya
        </button>
      </section>
    );
  }

  if (!country) return null;

  const displayPhotoUrl = !imgFailed && heroPhoto?.url ? heroPhoto.url : FALLBACK_HERO;
  const displayCaption = heroPhoto?.title || `${country.capital}, ${country.name}`;
  const displayCredit = heroPhoto?.photographer || 'Wayfinder Archive';

  const facts = [
    { label: 'Official Name', value: country.officialName },
    { label: 'Region', value: `${country.region} · ${country.subregion}` },
    {
      label: 'Languages',
      value: country.languages.length > 0 ? country.languages.slice(0, 4).join(', ') : 'N/A',
    },
    {
      label: 'Currencies',
      value:
        country.currencies.length > 0
          ? country.currencies.map((c) => `${c.name} (${c.code} ${c.symbol})`).join(', ')
          : 'N/A',
    },
    {
      label: 'Land Area',
      value: `${country.areaKm2.toLocaleString()} km²`,
    },
    {
      label: 'Driving & Calling',
      value: `${country.drivingSide}-hand traffic · ${country.callingCode}`,
    },
  ];

  return (
    <section id="section-overview" className="space-y-6">
      {/* Primary Hero Split */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Country Identity & Facts */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                <span>{country.region}</span>
                <span aria-hidden="true">·</span>
                <span>{country.subregion}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{country.cca3}</span>
              </div>

              <div className="flex items-center gap-4">
                {country.flagUrl && (
                  <img
                    src={country.flagUrl}
                    alt={country.flagAlt}
                    referrerPolicy="no-referrer"
                    className="w-14 h-10 object-cover rounded border border-slate-200 shrink-0"
                  />
                )}
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                  {country.name}
                </h1>
              </div>
            </div>

            {/* Clean Hairline Facts Table (No nested cards) */}
            <dl className="divide-y divide-slate-200 border-t border-b border-slate-200">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4"
                >
                  <dt className="text-xs font-medium text-slate-500 shrink-0">{fact.label}</dt>
                  <dd className="text-sm font-medium text-slate-900 sm:text-right break-words">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <span>
                Borders:{' '}
                <strong className="font-medium text-slate-700">
                  {country.borders.length > 0 ? country.borders.join(', ') : 'Island / None'}
                </strong>
              </span>
              {country.googleMapsUrl && (
                <a
                  href={country.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                >
                  <Globe2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>View on Google Maps</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Hero Destination Photograph */}
          <div className="lg:col-span-5 relative rounded-lg overflow-hidden bg-slate-900 min-h-[260px] lg:h-full">
            <img
              src={displayPhotoUrl}
              alt={displayCaption}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-4 text-white">
              <p className="text-sm font-medium leading-snug line-clamp-2">{displayCaption}</p>
              <p className="text-xs text-slate-300 mt-1">Photo credit: {displayCredit}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column KPI Strip Below Hero Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Capital City</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-slate-900 truncate">
            {country.capital}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {country.capitalLatLng
              ? `${country.capitalLatLng[0].toFixed(2)}°, ${country.capitalLatLng[1].toFixed(2)}°`
              : 'Coordinates N/A'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Population</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {country.population.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">National census record</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Local Time</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {timezone ? timezone.localTime24 : '—:—:—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {timezone ? `${timezone.zoneName} · ${timezone.gmtOffsetLabel}` : country.timezones[0]}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Capital Weather</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {weather ? `${weather.temperatureC}°C` : '—°C'}
          </p>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {weather
              ? `${weather.condition} · Feels like ${weather.feelsLikeC}°C`
              : 'Loading forecast...'}
          </p>
        </div>
      </div>
    </section>
  );
};
