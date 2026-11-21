import React, { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import type { PhotoItem, PhotosData } from '../types/travel';

interface PhotoGalleryProps {
  photosData: PhotosData | null;
  countryName: string;
  isLoading: boolean;
}

const FALLBACK_IMAGES = [
  '/src/assets/images/travel_kenya_savanna_1795246231430.jpg',
  '/src/assets/images/travel_japan_kyoto_1795246231422.jpg',
  '/src/assets/images/travel_france_paris_1795246231628.jpg',
  '/src/assets/images/travel_iceland_coast_1795246231566.jpg',
];

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photosData,
  countryName,
  isLoading,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFailedIds({});
  }, [photosData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const photos = photosData?.photos ?? [];

  return (
    <section
      id="section-gallery"
      className="bg-white border border-slate-200 rounded-xl p-6"
      aria-label="Tourist photography gallery"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-slate-200">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Destination Photography
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual highlights across {countryName}
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {photos.length} photographs
        </span>
      </div>

      {isLoading && photos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="py-12 text-center">
          <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-slate-600">No photographs available for {countryName}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {photos.map((photo, idx) => {
            const hasFailed = failedIds[photo.id];
            const safeSrc = hasFailed
              ? FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]
              : photo.thumbUrl || photo.url;

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() =>
                  setSelectedPhoto({
                    ...photo,
                    url: hasFailed ? safeSrc : photo.url,
                  })
                }
                className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <img
                  src={safeSrc}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedIds((prev) => ({
                      ...prev,
                      [photo.id]: true,
                    }))
                  }
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-3 text-white">
                  <p className="text-xs font-medium line-clamp-1">{photo.title}</p>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    {photo.photographer}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.title}
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl overflow-hidden max-w-4xl w-full border border-slate-200"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedPhoto.title}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedPhoto.photographer} · {selectedPhoto.sourceName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Close photo preview"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="bg-slate-950 max-h-[72vh] flex items-center justify-center">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-[72vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
