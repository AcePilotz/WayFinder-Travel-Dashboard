export interface CountryCurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface CountryData {
  source: string;
  mode: 'live' | 'fallback';
  name: string;
  officialName: string;
  cca2: string;
  cca3: string;
  capital: string;
  capitalLatLng: [number, number] | null;
  region: string;
  subregion: string;
  population: number;
  areaKm2: number;
  languages: string[];
  currencies: CountryCurrency[];
  primaryCurrencyCode: string;
  timezones: string[];
  ianaTimezone: string;
  flagUrl: string;
  flagAlt: string;
  coatOfArmsUrl: string | null;
  googleMapsUrl: string;
  borders: string[];
  drivingSide: string;
  callingCode: string;
}

export interface DailyForecastItem {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  condition: string;
  weatherCode: number;
}

export interface WeatherData {
  source: string;
  mode: 'live' | 'fallback';
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedKmh: number;
  pressureHpa: number;
  condition: string;
  description: string;
  weatherCode: number;
  timezoneName: string;
  utcOffsetSeconds: number;
  forecast: DailyForecastItem[];
}

export interface TimezoneData {
  source: string;
  mode: 'live' | 'fallback';
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
}

export interface CurrencyRateEntry {
  code: string;
  rate: number;
}

export interface CurrencyData {
  source: string;
  mode: 'live' | 'fallback';
  base: string;
  target: string;
  amount: number;
  rate: number;
  convertedAmount: number;
  lastUpdatedUtc: string;
  nextUpdateUtc: string;
  popularRates: CurrencyRateEntry[];
  availableCodes: string[];
}

export interface PhotoItem {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  sourceName: string;
  linkUrl: string;
  width: number;
  height: number;
}

export interface PhotosData {
  source: string;
  mode: 'live' | 'fallback';
  query: string;
  total: number;
  photos: PhotoItem[];
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
}

export interface NewsData {
  source: string;
  mode: 'live' | 'fallback';
  query: string;
  totalResults: number;
  articles: NewsArticle[];
}

export interface ApiStatusSummary {
  country: 'live' | 'fallback';
  weather: 'openweather' | 'open-meteo-fallback';
  currency: 'live';
  timezone: 'timezonedb' | 'iana-fallback';
  photos: 'unsplash' | 'wikimedia-fallback';
  news: 'newsapi' | 'google-news-fallback';
}
