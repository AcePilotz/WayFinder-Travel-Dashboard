import React, { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { CurrencyData } from '../types/travel';

interface CurrencyConverterProps {
  defaultTargetCurrency: string;
}

const FALLBACK_CODES = ['USD', 'EUR', 'GBP', 'JPY', 'KES', 'CAD', 'AUD', 'CHF', 'INR', 'ZAR', 'ISK', 'BRL'];

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  defaultTargetCurrency,
}) => {
  const [base, setBase] = useState('USD');
  const [target, setTarget] = useState(defaultTargetCurrency || 'KES');
  const [amountInput, setAmountInput] = useState('100');
  const [data, setData] = useState<CurrencyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTargetCurrency && /^[A-Z]{3}$/.test(defaultTargetCurrency)) {
      setTarget(defaultTargetCurrency === base ? 'EUR' : defaultTargetCurrency);
    }
  }, [defaultTargetCurrency]);

  useEffect(() => {
    let active = true;
    const numericAmount = Math.max(0, Number(amountInput) || 0);

    const fetchRates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/currency?base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}&amount=${encodeURIComponent(String(numericAmount))}`
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch currency rates');
        }
        if (active) {
          setData(json as CurrencyData);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load exchange rates.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    const timer = window.setTimeout(fetchRates, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [base, target, amountInput]);

  const handleSwap = () => {
    setBase(target);
    setTarget(base);
  };

  const currencyCodes =
    data?.availableCodes && data.availableCodes.length > 0 ? data.availableCodes : FALLBACK_CODES;

  return (
    <section
      id="section-currency"
      className="bg-white border border-slate-200 rounded-xl p-6"
      aria-label="Currency converter"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-slate-200">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Currency Exchange & Rates
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {data ? `Live mid-market rates · Updated ${data.lastUpdatedUtc}` : 'Live global exchange rates'}
          </p>
        </div>
        {data && (
          <span className="font-mono text-xs font-medium text-slate-600 tabular-nums whitespace-nowrap">
            1 {data.base} = {data.rate.toFixed(4)} {data.target}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Converter Form */}
        <div className="lg:col-span-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label htmlFor="currency-amount" className="block text-xs font-medium text-slate-600 mb-1.5">
                Amount
              </label>
              <input
                id="currency-amount"
                type="number"
                min="0"
                step="any"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="currency-base" className="block text-xs font-medium text-slate-600 mb-1.5">
                From
              </label>
              <select
                id="currency-base"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {currencyCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap currencies"
                className="w-full sm:w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="currency-target" className="block text-xs font-medium text-slate-600 mb-1.5">
                To
              </label>
              <select
                id="currency-target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {currencyCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500">Converted Value</p>
              <p className="mt-1 font-mono text-3xl font-bold text-slate-900 tabular-nums">
                {isLoading && !data
                  ? 'Calculating...'
                  : data
                  ? `${data.convertedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} ${data.target}`
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                {data ? `${data.amount.toLocaleString()} ${data.base} at mid-market spot rate` : ''}
              </p>
            </div>
          )}
        </div>

        {/* Popular Cross-Rates Table */}
        <div className="lg:col-span-6 lg:border-l lg:border-slate-200 lg:pl-8">
          <p className="text-xs font-semibold text-slate-700 mb-3">
            Reference Cross-Rates (Base: 1 {base})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 font-medium">Currency</th>
                  <th className="py-2 font-medium text-right">Spot Rate</th>
                  <th className="py-2 font-medium text-right">
                    For {Number(amountInput || 0).toLocaleString()} {base}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.popularRates ?? []).slice(0, 6).map((entry) => {
                  const total = (Number(amountInput) || 0) * entry.rate;
                  return (
                    <tr
                      key={entry.code}
                      onClick={() => setTarget(entry.code)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-2 font-mono font-medium text-slate-900">{entry.code}</td>
                      <td className="py-2 font-mono text-right text-slate-600 tabular-nums">
                        {entry.rate.toFixed(4)}
                      </td>
                      <td className="py-2 font-mono text-right font-medium text-slate-900 tabular-nums">
                        {total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
