import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ImageOff } from 'lucide-react';
import { FeedAttachment } from '../types';

interface FeedImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: FeedAttachment[];
  initialIndex?: number;
}

export const FeedImageViewerModal: React.FC<FeedImageViewerModalProps> = ({
  isOpen,
  onClose,
  attachments,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setImageError(false);
    setLoading(true);
  }, [initialIndex, isOpen]);

  const currentAttachment = attachments[currentIndex];

  const handlePrev = useCallback(() => {
    if (attachments.length <= 1) return;
    setImageError(false);
    setLoading(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
  }, [attachments.length]);

  const handleNext = useCallback(() => {
    if (attachments.length <= 1) return;
    setImageError(false);
    setLoading(true);
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
  }, [attachments.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentAttachment) return null;

  const imageUrl = currentAttachment.signedUrl || currentAttachment.storagePath;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/70 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wide bg-white/10 px-3 py-1 rounded-full border border-white/20">
            {currentIndex + 1} of {attachments.length}
          </span>
          <span className="text-xs text-white/70 max-w-xs truncate hidden sm:inline">
            {currentAttachment.fileName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {imageUrl && !imageError && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Open original image"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div
        className="relative max-w-5xl max-h-[85vh] w-full mx-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {imageError ? (
          <div className="flex flex-col items-center justify-center text-white/70 p-8 bg-white/5 rounded-2xl border border-white/10">
            <ImageOff className="w-12 h-12 mb-3 text-white/40" />
            <p className="text-sm font-medium">Failed to load image</p>
            <p className="text-xs text-white/50 mt-1">
              The image link may have expired or is unavailable.
            </p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={currentAttachment.caption || currentAttachment.fileName || 'Attachment preview'}
            className={`max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-opacity duration-200 ${
              loading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setImageError(true);
            }}
          />
        )}

        {/* Caption Banner */}
        {currentAttachment.caption && (
          <div className="absolute bottom-2 left-4 right-4 bg-black/60 backdrop-blur-xs text-white text-xs py-2 px-4 rounded-lg text-center border border-white/10">
            {currentAttachment.caption}
          </div>
        )}
      </div>

      {/* Navigation Chevrons */}
      {attachments.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all hover:scale-105"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all hover:scale-105"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
};
