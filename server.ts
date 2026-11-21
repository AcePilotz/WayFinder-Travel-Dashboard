import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const REQUEST_TIMEOUT_MS = 8500;

app.use(express.json());

const CURATED_DESTINATION_PHOTOS: Record<
  string,
  Array<{ title: string; url: string; photographer: string }>
> = {
  kenya: [
    {
      title: 'Nairobi skyline and Mount Kenya horizon at golden hour',
      url: '/src/assets/images/travel_kenya_savanna_1795246231430.jpg',
      photographer: 'Wayfinder Editorial Archive',
    },
  ],
  japan: [
    {
      title: 'Historic Kyoto pagoda and wooden street at dawn',
      url: '/src/assets/images/travel_japan_kyoto_1795246231422.jpg',
      photographer: 'Wayfinder Editorial Archive',
    },
  ],
  france: [
    {
      title: 'Haussmann limestone architecture along the Seine in Paris',
      url: '/src/assets/images/travel_france_paris_1795246231628.jpg',
      photographer: 'Wayfinder Editorial Archive',
    },
  ],
  iceland: [
    {
      title: 'Basalt sea cliffs and North Atlantic surf along the Icelandic coast',
      url: '/src/assets/images/travel_iceland_coast_1795246231566.jpg',
      photographer: 'Wayfinder Editorial Archive',
    },
  ],
};

const COUNTRY_TO_IANA: Record<string, string> = {
  KE: 'Africa/Nairobi',
  JP: 'Asia/Tokyo',
  FR: 'Europe/Paris',
  IS: 'Atlantic/Reykjavik',
  GB: 'Europe/London',
  US: 'America/New_York',
  CA: 'America/Toronto',
  BR: 'America/Sao_Paulo',
  DE: 'Europe/Berlin',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  AU: 'Australia/Sydney',
  IN: 'Asia/Kolkata',
  ZA: 'Africa/Johannesburg',
  EG: 'Africa/Cairo',
  MA: 'Africa/Casablanca',
  TH: 'Asia/Bangkok',
  SG: 'Asia/Singapore',
  AE: 'Asia/Dubai',
  CH: 'Europe/Zurich',
  NL: 'Europe/Amsterdam',
  PT: 'Europe/Lisbon',
  GR: 'Europe/Athens',
  TR: 'Europe/Istanbul',
  MX: 'America/Mexico_City',
  AR: 'America/Argentina/Buenos_Aires',
  NZ: 'Pacific/Auckland',
  KR: 'Asia/Seoul',
  CN: 'Asia/Shanghai',
  NO: 'Europe/Oslo',
  SE: 'Europe/Stockholm',
  TZ: 'Africa/Dar_es_Salaam',
  UG: 'Africa/Kampala',
  RW: 'Africa/Kigali',
  ET: 'Africa/Addis_Ababa',
  NG: 'Africa/Lagos',
  GH: 'Africa/Accra',
};

function sanitizeQueryParam(raw: unknown, maxLen = 80): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, maxLen);
}

function isValidSafeText(value: string): boolean {
  return value.length >= 1 && value.length <= 80 && /^[\p{L}\p{N}\s.,'\-()]+$/u.test(value);
}

function isValidHttpUrl(rawUrl: string): boolean {
  if (rawUrl.startsWith('/src/assets/images/')) return true;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function describeWmoWeatherCode(code: number): { condition: string; description: string } {
  if (code === 0) return { condition: 'Clear', description: 'Clear sky' };
  if (code <= 3) return { condition: 'Cloudy', description: 'Partly cloudy' };
  if (code === 45 || code === 48) return { condition: 'Fog', description: 'Misty or foggy' };
  if (code >= 51 && code <= 57) return { condition: 'Drizzle', description: 'Light drizzle' };
  if (code >= 61 && code <= 67) return { condition: 'Rain', description: 'Rain showers' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', description: 'Snowfall' };
  if (code >= 80 && code <= 82) return { condition: 'Showers', description: 'Passing rain showers' };
  if (code >= 95) return { condition: 'Thunderstorm', description: 'Thunderstorms' };
  return { condition: 'Fair', description: 'Fair conditions' };
}

function formatOffsetLabel(seconds: number): string {
  const sign = seconds >= 0 ? '+' : '-';
  const abs = Math.abs(seconds);
  const hours = String(Math.floor(abs / 3600)).padStart(2, '0');
  const mins = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  return `UTC${sign}${hours}:${mins}`;
}

function computeTimezoneSnapshot(zoneName: string): {
  zoneName: string;
  abbreviation: string;
  gmtOffsetSeconds: number;
  gmtOffsetLabel: string;
  dst: boolean;
  formatted: string;
  localDate: string;
  localTime24: string;
  localTime12: string;
  dayOfWeek: string;
  timestamp: number;
} {
  const now = new Date();
  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: zoneName,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'long',
    timeZoneName: 'short',
  });

  const parts = partsFormatter.formatToParts(now);
  const lookup = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const year = lookup('year');
  const month = lookup('month');
  const day = lookup('day');
  const hour = lookup('hour') === '24' ? '00' : lookup('hour');
  const minute = lookup('minute');
  const second = lookup('second');
  const dayOfWeek = lookup('weekday');
  const abbreviation = lookup('timeZoneName') || zoneName;

  const time12 = new Intl.DateTimeFormat('en-US', {
    timeZone: zoneName,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const localAsUtcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
  const gmtOffsetSeconds = Math.round((localAsUtcMs - now.getTime()) / 1000 / 60) * 60;

  const jan = new Date(now.getUTCFullYear(), 0, 1);
  const jul = new Date(now.getUTCFullYear(), 6, 1);
  const getOffsetMinutes = (d: Date) => {
    const str = d.toLocaleString('en-US', { timeZone: zoneName, timeZoneName: 'shortOffset' });
    const match = str.match(/GMT([+-]\d+)(?::(\d+))?/);
    if (!match) return 0;
    const h = Number(match[1]);
    const m = Number(match[2] || 0);
    return h * 60 + (h >= 0 ? m : -m);
  };
  const stdOffset = Math.min(getOffsetMinutes(jan), getOffsetMinutes(jul));
  const currentOffset = Math.round(gmtOffsetSeconds / 60);
  const dst = currentOffset > stdOffset;

  const localDate = `${year}-${month}-${day}`;
  const localTime24 = `${hour}:${minute}:${second}`;

  return {
    zoneName,
    abbreviation,
    gmtOffsetSeconds,
    gmtOffsetLabel: formatOffsetLabel(gmtOffsetSeconds),
    dst,
    formatted: `${localDate} ${localTime24}`,
    localDate,
    localTime24,
    localTime12: time12,
    dayOfWeek,
    timestamp: Math.floor(now.getTime() / 1000),
  };
}

// Health & API configuration status (exposes boolean flags only, never secrets)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Wayfinder Travel API Gateway',
    integrations: {
      country: 'restcountries',
      weather: process.env.OPENWEATHER_API_KEY ? 'openweather' : 'open-meteo-fallback',
      currency: 'open-er-api',
      timezone: process.env.TIMEZONEDB_API_KEY ? 'timezonedb' : 'iana-fallback',
      photos: process.env.PIXABAY_API_KEY ? 'pixabay' : 'wikimedia-fallback',
      news: process.env.NEWSAPI_KEY ? 'newsapi' : 'google-news-fallback',
    },
  });
});

// 1. GET /api/country/:name -> Country Information REST API (countries.dev / RestCountries-compatible)
app.get('/api/country/:name', async (req: Request, res: Response) => {
  const name = sanitizeQueryParam(req.params.name);
  if (!isValidSafeText(name)) {
    res.status(400).json({ error: 'Invalid country or city name provided.' });
    return;
  }

  try {
    let response = await fetch(
      `https://countries.dev/name/${encodeURIComponent(name)}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );

    if (!response.ok) {
      response = await fetch(
        `https://countries.dev/capital/${encodeURIComponent(name)}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      );
    }

    if (!response.ok) {
      res.status(404).json({ error: `No country found matching "${name}".` });
      return;
    }

    const payload = (await response.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(payload) || payload.length === 0) {
      res.status(404).json({ error: `No country found matching "${name}".` });
      return;
    }

    const lowerName = name.toLowerCase();
    const match =
      payload.find((entry) => {
        const common = typeof entry.name === 'string' ? entry.name : '';
        const native = typeof entry.nativeName === 'string' ? entry.nativeName : '';
        return common.toLowerCase() === lowerName || native.toLowerCase() === lowerName;
      }) ?? payload[0];

    const commonName = String(match.name ?? name);
    const nativeName = String(match.nativeName ?? commonName);
    const cca2 = String(match.alpha2Code ?? '');
    const cca3 = String(match.alpha3Code ?? '');
    const capital = String(match.capital ?? commonName);
    const capitalLatLng =
      Array.isArray(match.latlng) && match.latlng.length === 2
        ? ([Number(match.latlng[0]), Number(match.latlng[1])] as [number, number])
        : null;

    const currenciesRaw = Array.isArray(match.currencies)
      ? (match.currencies as Array<{ code?: string; name?: string; symbol?: string }>)
      : [];
    const currencies = currenciesRaw
      .filter((c) => c.code)
      .map((c) => ({
        code: String(c.code),
        name: String(c.name ?? c.code),
        symbol: String(c.symbol ?? c.code),
      }));

    const languagesRaw = Array.isArray(match.languages)
      ? (match.languages as Array<{ name?: string } | string>)
      : [];
    const languages = languagesRaw
      .map((l) => (typeof l === 'string' ? l : String(l.name ?? '')))
      .filter(Boolean);

    const flags = (match.flags as { svg?: string; png?: string }) ?? {};
    const callingCodes = Array.isArray(match.callingCodes) ? match.callingCodes.map(String) : [];
    const callingCode = callingCodes[0] ? `+${callingCodes[0].replace(/^\+/, '')}` : 'N/A';

    const timezones = Array.isArray(match.timezones) ? match.timezones.map(String) : ['UTC'];
    const ianaTimezone = COUNTRY_TO_IANA[cca2] ?? 'UTC';
    const leftHandCountries = new Set([
      'KE', 'GB', 'JP', 'AU', 'NZ', 'IN', 'ZA', 'TH', 'SG', 'MY', 'ID', 'IE', 'TZ', 'UG', 'ZW', 'ZM', 'BW', 'NA', 'MZ', 'MW',
    ]);

    res.json({
      source: 'Countries.dev REST API',
      mode: 'live',
      name: commonName,
      officialName: nativeName !== commonName ? `${commonName} (${nativeName})` : commonName,
      cca2,
      cca3,
      capital,
      capitalLatLng,
      region: String(match.region ?? 'Unknown'),
      subregion: String(match.subregion ?? match.region ?? 'Unknown'),
      population: Number(match.population ?? 0),
      areaKm2: Number(match.area ?? 0),
      languages,
      currencies,
      primaryCurrencyCode: currencies[0]?.code ?? 'USD',
      timezones,
      ianaTimezone,
      flagUrl: flags.svg || flags.png || '',
      flagAlt: `Flag of ${commonName}`,
      coatOfArmsUrl: null,
      googleMapsUrl: `https://www.google.com/maps/place/${encodeURIComponent(commonName)}`,
      borders: Array.isArray(match.borders) ? match.borders.map(String) : [],
      drivingSide: leftHandCountries.has(cca2) ? 'Left' : 'Right',
      callingCode,
    });
  } catch (err) {
    console.error('Error in /api/country/:name:', err);
    res.status(502).json({ error: 'Unable to retrieve country information.' });
  }
});

// 2. GET /api/weather/:city -> OpenWeather API (with Open-Meteo live fallback)
app.get('/api/weather/:city', async (req: Request, res: Response) => {
  const city = sanitizeQueryParam(req.params.city);
  if (!isValidSafeText(city)) {
    res.status(400).json({ error: 'Invalid city name provided.' });
    return;
  }

  const openWeatherKey = process.env.OPENWEATHER_API_KEY?.trim();

  try {
    if (openWeatherKey) {
      const owRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${encodeURIComponent(openWeatherKey)}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      );
      if (owRes.ok) {
        const ow = (await owRes.json()) as {
          name: string;
          sys?: { country?: string };
          coord?: { lat?: number; lon?: number };
          main?: { temp?: number; feels_like?: number; humidity?: number; pressure?: number };
          wind?: { speed?: number };
          weather?: Array<{ id?: number; main?: string; description?: string }>;
          timezone?: number;
        };

        const lat = Number(ow.coord?.lat ?? 0);
        const lon = Number(ow.coord?.lon ?? 0);
        let forecast: Array<{
          date: string;
          tempMaxC: number;
          tempMinC: number;
          condition: string;
          weatherCode: number;
        }> = [];
        let timezoneName = 'UTC';

        try {
          const omExtras = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=4`,
            { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
          );
          if (omExtras.ok) {
            const extra = (await omExtras.json()) as {
              timezone?: string;
              daily?: {
                time?: string[];
                temperature_2m_max?: number[];
                temperature_2m_min?: number[];
                weather_code?: number[];
              };
            };
            if (extra.timezone) timezoneName = extra.timezone;
            if (extra.daily?.time) {
              forecast = extra.daily.time.slice(0, 4).map((date, idx) => {
                const wCode = Number(extra.daily?.weather_code?.[idx] ?? 0);
                return {
                  date,
                  tempMaxC: Math.round(Number(extra.daily?.temperature_2m_max?.[idx] ?? 0)),
                  tempMinC: Math.round(Number(extra.daily?.temperature_2m_min?.[idx] ?? 0)),
                  condition: describeWmoWeatherCode(wCode).condition,
                  weatherCode: wCode,
                };
              });
            }
          }
        } catch {
          // Optional forecast enrichment failed; continue with OpenWeather current data
        }

        res.json({
          source: 'OpenWeather API',
          mode: 'live',
          city: ow.name || city,
          country: ow.sys?.country || '',
          coordinates: { lat, lon },
          temperatureC: Math.round(Number(ow.main?.temp ?? 0) * 10) / 10,
          feelsLikeC: Math.round(Number(ow.main?.feels_like ?? 0) * 10) / 10,
          humidity: Number(ow.main?.humidity ?? 0),
          windSpeedKmh: Math.round(Number(ow.wind?.speed ?? 0) * 3.6 * 10) / 10,
          pressureHpa: Number(ow.main?.pressure ?? 1013),
          condition: ow.weather?.[0]?.main || 'Clear',
          description: ow.weather?.[0]?.description || 'Clear sky',
          weatherCode: Number(ow.weather?.[0]?.id ?? 800),
          timezoneName,
          utcOffsetSeconds: Number(ow.timezone ?? 0),
          forecast,
        });
        return;
      }
    }

    // Live public fallback via Open-Meteo Geocoding + Forecast
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (!geoRes.ok) {
      res.status(502).json({ error: 'Weather geocoding service unavailable.' });
      return;
    }
    const geoData = (await geoRes.json()) as {
      results?: Array<{
        name: string;
        country?: string;
        latitude: number;
        longitude: number;
        timezone?: string;
      }>;
    };

    const place = geoData.results?.[0];
    if (!place) {
      res.status(404).json({ error: `Could not locate weather coordinates for "${city}".` });
      return;
    }

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=4`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (!forecastRes.ok) {
      res.status(502).json({ error: 'Weather forecast service unavailable.' });
      return;
    }
    const weatherJson = (await forecastRes.json()) as {
      timezone?: string;
      utc_offset_seconds?: number;
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        surface_pressure?: number;
      };
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        weather_code?: number[];
      };
    };

    const wCode = Number(weatherJson.current?.weather_code ?? 0);
    const described = describeWmoWeatherCode(wCode);

    const forecast = (weatherJson.daily?.time ?? []).slice(0, 4).map((date, idx) => {
      const dayCode = Number(weatherJson.daily?.weather_code?.[idx] ?? 0);
      return {
        date,
        tempMaxC: Math.round(Number(weatherJson.daily?.temperature_2m_max?.[idx] ?? 0)),
        tempMinC: Math.round(Number(weatherJson.daily?.temperature_2m_min?.[idx] ?? 0)),
        condition: describeWmoWeatherCode(dayCode).condition,
        weatherCode: dayCode,
      };
    });

    res.json({
      source: 'Open-Meteo API (OpenWeather key not configured)',
      mode: 'fallback',
      city: place.name,
      country: place.country || '',
      coordinates: { lat: place.latitude, lon: place.longitude },
      temperatureC: Math.round(Number(weatherJson.current?.temperature_2m ?? 0) * 10) / 10,
      feelsLikeC: Math.round(Number(weatherJson.current?.apparent_temperature ?? 0) * 10) / 10,
      humidity: Math.round(Number(weatherJson.current?.relative_humidity_2m ?? 0)),
      windSpeedKmh: Math.round(Number(weatherJson.current?.wind_speed_10m ?? 0) * 10) / 10,
      pressureHpa: Math.round(Number(weatherJson.current?.surface_pressure ?? 1013)),
      condition: described.condition,
      description: described.description,
      weatherCode: wCode,
      timezoneName: weatherJson.timezone || place.timezone || 'UTC',
      utcOffsetSeconds: Number(weatherJson.utc_offset_seconds ?? 0),
      forecast,
    });
  } catch (err) {
    console.error('Error in /api/weather/:city:', err);
    res.status(502).json({ error: 'Unable to retrieve weather data.' });
  }
});

// 3. GET /api/currency -> ExchangeRate API
app.get('/api/currency', async (req: Request, res: Response) => {
  const rawBase = sanitizeQueryParam(req.query.base ?? 'USD', 3).toUpperCase();
  const rawTarget = sanitizeQueryParam(req.query.target ?? 'KES', 3).toUpperCase();
  const rawAmount = Number(req.query.amount ?? 1);

  if (!/^[A-Z]{3}$/.test(rawBase) || !/^[A-Z]{3}$/.test(rawTarget)) {
    res.status(400).json({ error: 'Currency codes must be valid 3-letter ISO codes (e.g., USD, KES).' });
    return;
  }

  const amount = Number.isFinite(rawAmount) && rawAmount >= 0 ? rawAmount : 1;

  try {
    const erRes = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(rawBase)}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!erRes.ok) {
      res.status(502).json({ error: `ExchangeRate API failed for base currency ${rawBase}.` });
      return;
    }

    const data = (await erRes.json()) as {
      result?: string;
      base_code?: string;
      time_last_update_utc?: string;
      time_next_update_utc?: string;
      rates?: Record<string, number>;
    };

    if (data.result !== 'success' || !data.rates) {
      res.status(404).json({ error: `Currency "${rawBase}" is not supported by ExchangeRate API.` });
      return;
    }

    const rate = data.rates[rawTarget];
    if (typeof rate !== 'number') {
      res.status(404).json({ error: `Target currency "${rawTarget}" not found.` });
      return;
    }

    const popularCodes = ['USD', 'EUR', 'GBP', 'JPY', 'KES', 'CAD', 'AUD', 'CHF', 'INR', 'ZAR'];
    const popularRates = popularCodes
      .filter((code) => typeof data.rates?.[code] === 'number')
      .map((code) => ({
        code,
        rate: Number(data.rates![code]),
      }));

    res.json({
      source: 'ExchangeRate API (open.er-api.com)',
      mode: 'live',
      base: rawBase,
      target: rawTarget,
      amount,
      rate,
      convertedAmount: Math.round(amount * rate * 10000) / 10000,
      lastUpdatedUtc: data.time_last_update_utc || new Date().toUTCString(),
      nextUpdateUtc: data.time_next_update_utc || '',
      popularRates,
      availableCodes: Object.keys(data.rates).sort(),
    });
  } catch (err) {
    console.error('Error in /api/currency:', err);
    res.status(502).json({ error: 'Unable to retrieve live exchange rates.' });
  }
});

// 4. GET /api/timezone/:zone (and /api/timezone/:region/:city or ?zone=) -> TimeZoneDB API
async function handleTimezoneRequest(req: Request, res: Response) {
  let zone = '';
  if (req.params.region && req.params.city) {
    zone = `${req.params.region}/${req.params.city}`;
  } else if (req.params.region && req.params.city && req.params.subcity) {
    zone = `${req.params.region}/${req.params.city}/${req.params.subcity}`;
  } else if (req.params.zone) {
    zone = req.params.zone;
  } else if (typeof req.query.zone === 'string') {
    zone = req.query.zone;
  } else {
    zone = 'Africa/Nairobi';
  }

  zone = decodeURIComponent(zone).trim();
  if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_\-+]+){0,2}$/.test(zone)) {
    res.status(400).json({ error: 'Invalid IANA timezone identifier (example: Africa/Nairobi).' });
    return;
  }

  const tzKey = process.env.TIMEZONEDB_API_KEY?.trim();

  try {
    if (tzKey) {
      const tzRes = await fetch(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=${encodeURIComponent(tzKey)}&format=json&by=zone&zone=${encodeURIComponent(zone)}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      );
      if (tzRes.ok) {
        const tz = (await tzRes.json()) as {
          status?: string;
          zoneName?: string;
          abbreviation?: string;
          gmtOffset?: number;
          dst?: string;
          formatted?: string;
          timestamp?: number;
        };
        if (tz.status === 'OK' && tz.formatted) {
          const [localDate, localTime24] = tz.formatted.split(' ');
          const snapshot = computeTimezoneSnapshot(tz.zoneName || zone);
          res.json({
            source: 'TimeZoneDB API',
            mode: 'live',
            zoneName: tz.zoneName || zone,
            abbreviation: tz.abbreviation || snapshot.abbreviation,
            gmtOffsetSeconds: Number(tz.gmtOffset ?? snapshot.gmtOffsetSeconds),
            gmtOffsetLabel: formatOffsetLabel(Number(tz.gmtOffset ?? snapshot.gmtOffsetSeconds)),
            dst: tz.dst === '1',
            formatted: tz.formatted,
            localDate: localDate || snapshot.localDate,
            localTime24: localTime24 || snapshot.localTime24,
            localTime12: snapshot.localTime12,
            dayOfWeek: snapshot.dayOfWeek,
            timestamp: Number(tz.timestamp ?? snapshot.timestamp),
          });
          return;
        }
      }
    }

    const snapshot = computeTimezoneSnapshot(zone);
    res.json({
      source: 'IANA Timezone Engine (TimeZoneDB key not configured)',
      mode: 'fallback',
      ...snapshot,
    });
  } catch (err) {
    console.error('Error in /api/timezone:', err);
    res.status(404).json({ error: `Unknown or unsupported timezone "${zone}".` });
  }
}

app.get('/api/timezone', handleTimezoneRequest);
app.get('/api/timezone/:zone', handleTimezoneRequest);
app.get('/api/timezone/:region/:city', handleTimezoneRequest);
app.get('/api/timezone/:region/:city/:subcity', handleTimezoneRequest);

// 5. GET /api/photos/:country -> Pixabay API (with Wikimedia Commons & curated archive fallback)
app.get('/api/photos/:country', async (req: Request, res: Response) => {
  const country = sanitizeQueryParam(req.params.country);
  if (!isValidSafeText(country)) {
    res.status(400).json({ error: 'Invalid destination name for photo search.' });
    return;
  }

  const pixabayKey = process.env.PIXABAY_API_KEY?.trim();

  try {
    if (pixabayKey) {
      let pRes = await fetch(
        `https://pixabay.com/api/?key=${encodeURIComponent(pixabayKey)}&q=${encodeURIComponent(`${country} travel landmark`)}&image_type=photo&orientation=horizontal&per_page=8&safesearch=true`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      );
      if (pRes.ok) {
        let pData = (await pRes.json()) as {
          totalHits?: number;
          hits?: Array<{
            id: number;
            tags?: string;
            pageURL?: string;
            webformatURL?: string;
            largeImageURL?: string;
            imageWidth?: number;
            imageHeight?: number;
            user?: string;
          }>;
        };

        if (!pData.hits || pData.hits.length === 0) {
          pRes = await fetch(
            `https://pixabay.com/api/?key=${encodeURIComponent(pixabayKey)}&q=${encodeURIComponent(country)}&image_type=photo&orientation=horizontal&per_page=8&safesearch=true`,
            { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
          );
          if (pRes.ok) {
            pData = (await pRes.json()) as typeof pData;
          }
        }

        const photos = (pData.hits ?? [])
          .filter((item) => {
            const imgUrl = item.largeImageURL || item.webformatURL;
            return Boolean(imgUrl && isValidHttpUrl(imgUrl));
          })
          .map((item) => {
            const fullUrl = item.largeImageURL || item.webformatURL || '';
            const thumbUrl = item.webformatURL || fullUrl;
            return {
              id: `pixabay-${item.id}`,
              title: item.tags
                ? item.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .slice(0, 4)
                    .join(' · ')
                : `${country} travel highlight`,
              url: fullUrl,
              thumbUrl,
              photographer: item.user || 'Pixabay Contributor',
              sourceName: 'Pixabay',
              linkUrl:
                item.pageURL && isValidHttpUrl(item.pageURL)
                  ? item.pageURL
                  : 'https://pixabay.com',
              width: Number(item.imageWidth ?? 1200),
              height: Number(item.imageHeight ?? 800),
            };
          });

        if (photos.length > 0) {
          res.json({
            source: 'Pixabay API',
            mode: 'live',
            query: country,
            total: Number(pData.totalHits ?? photos.length),
            photos,
          });
          return;
        }
      }
    }

    // Live Wikimedia Commons fallback + curated high-res local archive
    const curated = CURATED_DESTINATION_PHOTOS[country.toLowerCase()] ?? [];
    const fallbackPhotos: Array<{
      id: string;
      title: string;
      url: string;
      thumbUrl: string;
      photographer: string;
      sourceName: string;
      linkUrl: string;
      width: number;
      height: number;
    }> = curated.map((item, idx) => ({
      id: `curated-${country.toLowerCase()}-${idx}`,
      title: item.title,
      url: item.url,
      thumbUrl: item.url,
      photographer: item.photographer,
      sourceName: 'Wayfinder Archive',
      linkUrl: '',
      width: 1200,
      height: 800,
    }));

    try {
      const wikiRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`${country} landmark cityscape`)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1200&format=json&origin=*`,
        {
          headers: { 'User-Agent': 'WayfinderTravelDashboard/1.0 (student coursework demo)' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        }
      );

      if (wikiRes.ok) {
        const wikiJson = (await wikiRes.json()) as {
          query?: {
            pages?: Record<
              string,
              {
                pageid: number;
                title: string;
                imageinfo?: Array<{
                  thumburl?: string;
                  url?: string;
                  descriptionurl?: string;
                  width?: number;
                  height?: number;
                  extmetadata?: {
                    Artist?: { value?: string };
                    ImageDescription?: { value?: string };
                  };
                }>;
              }
            >;
          };
        };

        const pages = Object.values(wikiJson.query?.pages ?? {});
        for (const page of pages) {
          const info = page.imageinfo?.[0];
          const imgUrl = info?.thumburl || info?.url || '';
          const lower = imgUrl.toLowerCase();
          if (
            !imgUrl ||
            !isValidHttpUrl(imgUrl) ||
            lower.endsWith('.svg') ||
            lower.endsWith('.pdf') ||
            lower.endsWith('.tif')
          ) {
            continue;
          }
          const rawTitle =
            info?.extmetadata?.ImageDescription?.value ||
            page.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
          const rawArtist = info?.extmetadata?.Artist?.value || 'Wikimedia Commons';
          fallbackPhotos.push({
            id: `wiki-${page.pageid}`,
            title: decodeHtmlEntities(rawTitle).slice(0, 120) || `${country} landmark`,
            url: imgUrl,
            thumbUrl: imgUrl,
            photographer: decodeHtmlEntities(rawArtist).slice(0, 60) || 'Wikimedia Commons',
            sourceName: 'Wikimedia Commons',
            linkUrl:
              info?.descriptionurl && isValidHttpUrl(info.descriptionurl)
                ? info.descriptionurl
                : 'https://commons.wikimedia.org',
            width: Number(info?.width ?? 1200),
            height: Number(info?.height ?? 800),
          });
          if (fallbackPhotos.length >= 8) break;
        }
      }
    } catch {
      // Wikimedia fallback error; still return curated archive if present
    }

    if (fallbackPhotos.length === 0) {
      // Guaranteed non-empty fallback photos from local curated travel set
      const allCurated = Object.values(CURATED_DESTINATION_PHOTOS).flat();
      allCurated.forEach((item, idx) => {
        fallbackPhotos.push({
          id: `archive-${idx}`,
          title: `${country} travel reference — ${item.title}`,
          url: item.url,
          thumbUrl: item.url,
          photographer: item.photographer,
          sourceName: 'Wayfinder Archive',
          linkUrl: '',
          width: 1200,
          height: 800,
        });
      });
    }

    res.json({
      source: 'Wikimedia Commons & Wayfinder Archive (Pixabay key not configured)',
      mode: 'fallback',
      query: country,
      total: fallbackPhotos.length,
      photos: fallbackPhotos.slice(0, 8),
    });
  } catch (err) {
    console.error('Error in /api/photos/:country:', err);
    res.status(502).json({ error: 'Unable to retrieve destination photography.' });
  }
});

// 6. GET /api/news -> NewsAPI (with Google News RSS live fallback)
app.get('/api/news', async (req: Request, res: Response) => {
  const rawQuery = sanitizeQueryParam(req.query.q ?? req.query.country ?? 'travel');
  const query = isValidSafeText(rawQuery) ? rawQuery : 'travel';

  const newsApiKey = process.env.NEWSAPI_KEY?.trim();

  try {
    if (newsApiKey) {
      const nRes = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=8&apiKey=${encodeURIComponent(newsApiKey)}`,
        { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      );
      if (nRes.ok) {
        const nData = (await nRes.json()) as {
          status?: string;
          totalResults?: number;
          articles?: Array<{
            title?: string;
            description?: string | null;
            url?: string;
            publishedAt?: string;
            source?: { name?: string };
          }>;
        };
        if (nData.status === 'ok' && Array.isArray(nData.articles)) {
          const articles = nData.articles
            .filter((a) => a.title && a.url && isValidHttpUrl(a.url) && a.title !== '[Removed]')
            .slice(0, 8)
            .map((a, idx) => ({
              id: `newsapi-${idx}`,
              title: a.title!,
              description: a.description || 'Read the full dispatch from the publisher.',
              source: a.source?.name || 'NewsAPI',
              publishedAt: a.publishedAt || new Date().toISOString(),
              url: a.url!,
            }));

          res.json({
            source: 'NewsAPI',
            mode: 'live',
            query,
            totalResults: Number(nData.totalResults ?? articles.length),
            articles,
          });
          return;
        }
      }
    }

    // Live Google News RSS fallback (no key required)
    const rssQuery = query.toLowerCase() === 'travel' ? 'international travel tourism' : `${query} travel tourism`;
    const rssRes = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(rssQuery)}&hl=en-US&gl=US&ceid=US:en`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );

    const articles: Array<{
      id: string;
      title: string;
      description: string;
      source: string;
      publishedAt: string;
      url: string;
    }> = [];

    if (rssRes.ok) {
      const xml = await rssRes.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match: RegExpExecArray | null;
      let index = 0;

      while ((match = itemRegex.exec(xml)) !== null && articles.length < 8) {
        const block = match[1];
        const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
        const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
        const pubMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const srcMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/);

        const rawTitle = decodeHtmlEntities(titleMatch?.[1] || '');
        const rawLink = (linkMatch?.[1] || '').trim();
        const rawSource = decodeHtmlEntities(srcMatch?.[1] || 'Global Dispatch');
        const cleanTitle = rawSource ? rawTitle.replace(new RegExp(`\\s*-\\s*${rawSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '') : rawTitle;

        if (cleanTitle && rawLink && isValidHttpUrl(rawLink)) {
          articles.push({
            id: `gnews-${index++}`,
            title: cleanTitle,
            description: `Latest coverage regarding ${query} reported by ${rawSource}.`,
            source: rawSource,
            publishedAt: pubMatch?.[1] ? new Date(pubMatch[1]).toISOString() : new Date().toISOString(),
            url: rawLink,
          });
        }
      }
    }

    res.json({
      source: 'Google News RSS (NewsAPI key not configured)',
      mode: 'fallback',
      query,
      totalResults: articles.length,
      articles,
    });
  } catch (err) {
    console.error('Error in /api/news:', err);
    res.status(502).json({ error: 'Unable to retrieve travel news.' });
  }
});

// 7. GET /api/postman-collection -> Ready-to-import Postman Collection v2.1 JSON
app.get('/api/postman-collection', (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  const baseUrl = `${protocol}://${host}`;

  const testScript = [
    'pm.test("Status code is 200", function () {',
    '    pm.response.to.have.status(200);',
    '});',
    '',
    'pm.test("Response has data", function () {',
    '    var jsonData = pm.response.json();',
    '    pm.expect(jsonData).to.not.be.empty;',
    '});',
  ];

  const makeItem = (name: string, pathAndQuery: string) => ({
    name,
    event: [
      {
        listen: 'test',
        script: {
          exec: testScript,
          type: 'text/javascript',
        },
      },
    ],
    request: {
      method: 'GET',
      header: [{ key: 'Accept', value: 'application/json' }],
      url: `${baseUrl}${pathAndQuery}`,
    },
  });

  const collection = {
    info: {
      name: 'Travel Dashboard APIs',
      description:
        'Wayfinder Travel Dashboard Express API Collection covering RestCountries, Weather, ExchangeRate, News, Photos, and Timezone endpoints.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [
      makeItem('GET Country Data', '/api/country/kenya'),
      makeItem('GET Weather', '/api/weather/nairobi'),
      makeItem('GET Exchange Rates', '/api/currency?base=USD&target=KES&amount=100'),
      makeItem('GET News', '/api/news?q=kenya'),
      makeItem('GET Images', '/api/photos/kenya'),
      makeItem('GET Timezone', '/api/timezone/Africa/Nairobi'),
    ],
  };

  res.setHeader('Content-Disposition', 'attachment; filename="Travel_Dashboard_APIs.postman_collection.json"');
  res.json(collection);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wayfinder Travel Dashboard server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
