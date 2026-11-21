import React, { useEffect, useState } from 'react';
import { Clock, Cloud, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';
import type { TimezoneData, WeatherData } from '../types/travel';

interface WeatherAndTimeProps {
  weather: WeatherData | null;
  timezone: TimezoneData | null;
  isLoading: boolean;
}

function renderWeatherIcon(condition: string) {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
    return <CloudRain className="w-6 h-6 text-blue-600" aria-hidden="true" />;
  }
  if (lower.includes('snow')) {
    return <CloudSnow className="w-6 h-6 text-sky-600" aria-hidden="true" />;
  }
  if (lower.includes('cloud') || lower.includes('fog') || lower.includes('mist')) {
    return <Cloud className="w-6 h-6 text-slate-500" aria-hidden="true" />;
  }
  return <Sun className="w-6 h-6 text-amber-500" aria-hidden="true" />;
}

export const WeatherAndTime: React.FC<WeatherAndTimeProps> = ({
  weather,
  timezone,
  isLoading,
}) => {
  const [use24Hour, setUse24Hour] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const getLiveClockStrings = () => {
    if (!timezone?.zoneName) {
      return { time: '—:—:—', date: 'Unavailable', day: '' };
    }
    try {
      const dateObj = new Date(nowTick);
      const time = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone.zoneName,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !use24Hour,
      }).format(dateObj);

      const date = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone.zoneName,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj);

      const day = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone.zoneName,
        weekday: 'long',
      }).format(dateObj);

      return { time, date, day };
    } catch {
      return {
        time: use24Hour ? timezone.localTime24 : timezone.localTime12,
        date: timezone.localDate,
        day: timezone.dayOfWeek,
      };
    }
  };

  const liveClock = getLiveClockStrings();

  return (
    <section
      id="section-weather"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      aria-label="Weather and local time"
    >
      {/* Weather Telemetry Panel */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Weather Conditions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {weather ? `${weather.city}${weather.country ? `, ${weather.country}` : ''} · Live local forecast` : 'Fetching live meteorology...'}
            </p>
          </div>
          {weather && renderWeatherIcon(weather.condition)}
        </div>

        {isLoading && !weather ? (
          <div className="h-44 bg-slate-100 rounded-lg animate-pulse" />
        ) : weather ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-6 pb-5 border-b border-slate-200">
              <div>
                <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">
                  {weather.temperatureC}°C
                </span>
                <p className="text-sm text-slate-600 mt-1 capitalize">
                  {weather.description} · Feels like{' '}
                  <span className="font-mono tabular-nums">{weather.feelsLikeC}°C</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 text-right">
                <div>
                  <p className="text-xs text-slate-500">Humidity</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums mt-0.5">
                    {weather.humidity}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Wind</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums mt-0.5 inline-flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    {weather.windSpeedKmh} km/h
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pressure</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums mt-0.5">
                    {weather.pressureHpa} hPa
                  </p>
                </div>
              </div>
            </div>

            {weather.forecast.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-3">4-Day Outlook</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {weather.forecast.map((day) => (
                    <div
                      key={day.date}
                      className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <p className="text-xs font-mono text-slate-500 tabular-nums">{day.date}</p>
                      <p className="text-xs font-medium text-slate-800 mt-1 truncate">
                        {day.condition}
                      </p>
                      <p className="font-mono text-xs text-slate-700 tabular-nums mt-1.5">
                        <span className="font-semibold text-slate-900">{day.tempMaxC}°</span>
                        <span className="text-slate-400"> / </span>
                        <span>{day.tempMinC}°</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">Weather data is unavailable for this destination.</p>
        )}
      </div>

      {/* Local Time & Timezone Panel */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Local Time & Zone
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]">
              {timezone ? `${timezone.zoneName} · ${timezone.gmtOffsetLabel}` : 'Synchronizing local clock...'}
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setUse24Hour(true)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                use24Hour ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24h
            </button>
            <button
              type="button"
              onClick={() => setUse24Hour(false)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                !use24Hour ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12h
            </button>
          </div>
        </div>

        {isLoading && !timezone ? (
          <div className="h-44 bg-slate-100 rounded-lg animate-pulse" />
        ) : timezone ? (
          <>
            <div className="py-4 border-y border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                <span>
                  {liveClock.day} · {liveClock.date}
                </span>
              </div>
              <p className="font-mono text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums tracking-tight">
                {liveClock.time}
              </p>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-2 flex items-center justify-between gap-4">
                <dt className="text-xs text-slate-500">IANA Timezone</dt>
                <dd className="font-mono text-xs font-medium text-slate-900 truncate">
                  {timezone.zoneName}
                </dd>
              </div>
              <div className="py-2 flex items-center justify-between gap-4">
                <dt className="text-xs text-slate-500">UTC Offset</dt>
                <dd className="font-mono text-xs font-medium text-slate-900 tabular-nums">
                  {timezone.gmtOffsetLabel} ({timezone.abbreviation})
                </dd>
              </div>
              <div className="py-2 flex items-center justify-between gap-4">
                <dt className="text-xs text-slate-500">Daylight Saving</dt>
                <dd className="text-xs font-medium text-slate-900">
                  {timezone.dst ? 'Active (DST)' : 'Standard Time'}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-slate-500">Timezone data unavailable.</p>
        )}
      </div>
    </section>
  );
};
