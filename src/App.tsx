import { useCallback, useEffect, useState } from 'react';
import { CountryOverview } from './components/CountryOverview';
import { CurrencyConverter } from './components/CurrencyConverter';
import { Header, type NavSection } from './components/Header';
import { NewsSection } from './components/NewsSection';
import { PhotoGallery } from './components/PhotoGallery';
import { Sidebar } from './components/Sidebar';
import { WeatherAndTime } from './components/WeatherAndTime';
import type {
  CountryData,
  NewsData,
  PhotosData,
  TimezoneData,
  WeatherData,
} from './types/travel';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('Kenya');
  const [activeSection, setActiveSection] = useState<NavSection>('overview');

  const [country, setCountry] = useState<CountryData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [timezone, setTimezone] = useState<TimezoneData | null>(null);
  const [photosData, setPhotosData] = useState<PhotosData | null>(null);
  const [newsData, setNewsData] = useState<NewsData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDestination = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) return;

    setSearchQuery(query);
    setIsLoading(true);
    setError(null);

    try {
      const countryRes = await fetch(`/api/country/${encodeURIComponent(query)}`);
      const countryJson = await countryRes.json();
      if (!countryRes.ok) {
        throw new Error(countryJson.error || `No destination found for "${query}".`);
      }

      const resolvedCountry = countryJson as CountryData;
      setCountry(resolvedCountry);

      const weatherPromise = fetch(
        `/api/weather/${encodeURIComponent(resolvedCountry.capital || resolvedCountry.name)}`
      )
        .then(async (res) => {
          if (!res.ok) throw new Error('Weather failed');
          return (await res.json()) as WeatherData;
        })
        .then((wData) => {
          setWeather(wData);
          return wData;
        })
        .catch(() => {
          setWeather(null);
          return null;
        });

      const photosPromise = fetch(
        `/api/photos/${encodeURIComponent(resolvedCountry.name)}`
      )
        .then(async (res) => {
          if (!res.ok) throw new Error('Photos failed');
          return (await res.json()) as PhotosData;
        })
        .then((pData) => {
          setPhotosData(pData);
        })
        .catch(() => {
          setPhotosData(null);
        });

      const newsPromise = fetch(
        `/api/news?q=${encodeURIComponent(resolvedCountry.name)}`
      )
        .then(async (res) => {
          if (!res.ok) throw new Error('News failed');
          return (await res.json()) as NewsData;
        })
        .then((nData) => {
          setNewsData(nData);
        })
        .catch(() => {
          setNewsData(null);
        });

      const weatherResult = await weatherPromise;
      const targetZone =
        weatherResult?.timezoneName && weatherResult.timezoneName !== 'UTC'
          ? weatherResult.timezoneName
          : resolvedCountry.ianaTimezone || 'UTC';

      const timezonePromise = fetch(`/api/timezone/${targetZone}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Timezone failed');
          return (await res.json()) as TimezoneData;
        })
        .then((tData) => {
          setTimezone(tData);
        })
        .catch(() => {
          setTimezone(null);
        });

      await Promise.all([photosPromise, newsPromise, timezonePromise]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load destination data.');
      setCountry(null);
      setWeather(null);
      setTimezone(null);
      setPhotosData(null);
      setNewsData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDestination('Kenya');
  }, [loadDestination]);

  const handleNavigate = (section: NavSection) => {
    setActiveSection(section);
    const targetId = `section-${section}`;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFocusSearch = () => {
    const inputEl = document.getElementById('sidebar-destination-search') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        inputEl.focus();
        inputEl.select();
      }, 150);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onFocusSearch={handleFocusSearch}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <Sidebar
            currentQuery={searchQuery}
            country={country}
            isLoading={isLoading}
            onSearch={loadDestination}
          />

          <div className="flex-1 min-w-0 w-full space-y-6">
            <CountryOverview
              country={country}
              weather={weather}
              timezone={timezone}
              heroPhoto={photosData?.photos?.[0] ?? null}
              isLoading={isLoading}
              error={error}
              onRetry={() => loadDestination('Kenya')}
            />

            <WeatherAndTime
              weather={weather}
              timezone={timezone}
              isLoading={isLoading}
            />

            <CurrencyConverter
              defaultTargetCurrency={country?.primaryCurrencyCode || 'KES'}
            />

            <PhotoGallery
              photosData={photosData}
              countryName={country?.name || searchQuery}
              isLoading={isLoading}
            />

            <NewsSection
              newsData={newsData}
              countryName={country?.name || searchQuery}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>Wayfinder Travel Dashboard</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('overview')}
              className="hover:text-slate-900 transition-colors"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('weather')}
              className="hover:text-slate-900 transition-colors"
            >
              Weather
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('currency')}
              className="hover:text-slate-900 transition-colors"
            >
              Currency
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('gallery')}
              className="hover:text-slate-900 transition-colors"
            >
              Gallery
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('news')}
              className="hover:text-slate-900 transition-colors"
            >
              News
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
