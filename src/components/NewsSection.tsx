import React from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import type { NewsData } from '../types/travel';

interface NewsSectionProps {
  newsData: NewsData | null;
  countryName: string;
  isLoading: boolean;
}

function isSafeExternalUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function formatPublishedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  newsData,
  countryName,
  isLoading,
}) => {
  const articles = newsData?.articles ?? [];

  return (
    <section
      id="section-news"
      className="bg-white border border-slate-200 rounded-xl p-6"
      aria-label="Latest destination news"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-slate-200">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Latest Travel & Regional News
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Recent headlines and regional dispatches for {countryName}
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {articles.length} articles
        </span>
      </div>

      {isLoading && articles.length === 0 ? (
        <div className="divide-y divide-slate-200 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-4 space-y-2 animate-pulse">
              <div className="h-3 w-40 bg-slate-200 rounded" />
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center">
          <Newspaper className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-slate-600">No recent news headlines found for {countryName}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 divide-y md:divide-y-0 divide-slate-200 pt-4">
          {articles.slice(0, 6).map((article) => {
            const safeHref = isSafeExternalUrl(article.url) ? article.url : '#';
            return (
              <article
                key={article.id}
                className="py-4 border-b border-slate-200 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span className="font-medium text-slate-700">{article.source}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={article.publishedAt} className="font-mono tabular-nums">
                      {formatPublishedDate(article.publishedAt)}
                    </time>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    {safeHref !== '#' ? (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-700 transition-colors inline-flex items-start gap-1.5"
                      >
                        <span>{article.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
                      </a>
                    ) : (
                      article.title
                    )}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {article.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
