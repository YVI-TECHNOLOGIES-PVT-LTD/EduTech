import React, { useState } from 'react';
import { FeedAttachment } from '../types';
import { FeedImageViewerModal } from './FeedImageViewerModal';
import { ImageOff } from 'lucide-react';

interface FeedImageGalleryProps {
  attachments: FeedAttachment[];
  postTitle?: string | null;
}

export const FeedImageGallery: React.FC<FeedImageGalleryProps> = ({ attachments, postTitle }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (!attachments || attachments.length === 0) return null;

  const handleOpenViewer = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const renderImageItem = (
    att: FeedAttachment,
    index: number,
    className: string = '',
    containerClassName: string = '',
  ) => {
    const isFailed = failedImages[att.attachmentId];
    const imageUrl = att.signedUrl || att.storagePath;

    return (
      <div
        key={att.attachmentId || index}
        onClick={(e) => handleOpenViewer(index, e)}
        className={`relative overflow-hidden cursor-pointer group bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 ${containerClassName}`}
      >
        {isFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-400 dark:text-slate-500">
            <ImageOff className="w-6 h-6 mb-1" />
            <span className="text-[11px] font-medium">Image unavailable</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={att.caption || postTitle || `Attachment ${index + 1}`}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-102 ${className}`}
            loading="lazy"
            onError={() => handleImageError(att.attachmentId)}
          />
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />

        {att.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-[11px] font-medium truncate pointer-events-none">
            {att.caption}
          </div>
        )}
      </div>
    );
  };

  const count = attachments.length;

  return (
    <>
      <div className="mt-2 mb-3 px-4 sm:px-5">
        {/* 1 Image Layout */}
        {count === 1 && (
          <div className="rounded-2xl overflow-hidden max-h-[460px]">
            {renderImageItem(
              attachments[0],
              0,
              'w-full max-h-[460px] object-cover',
              'rounded-2xl max-h-[460px] w-full',
            )}
          </div>
        )}

        {/* 2 Images Layout */}
        {count === 2 && (
          <div className="grid grid-cols-2 gap-2 h-64 sm:h-80 rounded-2xl overflow-hidden">
            {attachments.map((att, idx) =>
              renderImageItem(att, idx, 'h-full', 'rounded-xl h-full w-full'),
            )}
          </div>
        )}

        {/* 3 Images Layout: 1 large left, 2 stacked right */}
        {count === 3 && (
          <div className="grid grid-cols-3 gap-2 h-64 sm:h-80 rounded-2xl overflow-hidden">
            <div className="col-span-2 h-full">
              {renderImageItem(attachments[0], 0, 'h-full', 'rounded-xl h-full w-full')}
            </div>
            <div className="col-span-1 flex flex-col gap-2 h-full">
              <div className="h-[calc(50%-4px)]">
                {renderImageItem(attachments[1], 1, 'h-full', 'rounded-xl h-full w-full')}
              </div>
              <div className="h-[calc(50%-4px)]">
                {renderImageItem(attachments[2], 2, 'h-full', 'rounded-xl h-full w-full')}
              </div>
            </div>
          </div>
        )}

        {/* 4 Images Layout: 2x2 grid */}
        {count === 4 && (
          <div className="grid grid-cols-2 gap-2 h-72 sm:h-84 rounded-2xl overflow-hidden">
            {attachments.map((att, idx) =>
              renderImageItem(att, idx, 'h-full', 'rounded-xl h-36 sm:h-40 w-full'),
            )}
          </div>
        )}

        {/* 5 Images Layout: 2 top (span 3), 3 bottom (span 2) */}
        {count >= 5 && (
          <div className="grid grid-cols-6 gap-2 rounded-2xl overflow-hidden">
            {/* Top 2 */}
            <div className="col-span-3 h-40 sm:h-48">
              {renderImageItem(attachments[0], 0, 'h-full', 'rounded-xl h-full w-full')}
            </div>
            <div className="col-span-3 h-40 sm:h-48">
              {renderImageItem(attachments[1], 1, 'h-full', 'rounded-xl h-full w-full')}
            </div>
            {/* Bottom 3 */}
            <div className="col-span-2 h-32 sm:h-36">
              {renderImageItem(attachments[2], 2, 'h-full', 'rounded-xl h-full w-full')}
            </div>
            <div className="col-span-2 h-32 sm:h-36">
              {renderImageItem(attachments[3], 3, 'h-full', 'rounded-xl h-full w-full')}
            </div>
            <div className="col-span-2 h-32 sm:h-36">
              {renderImageItem(attachments[4], 4, 'h-full', 'rounded-xl h-full w-full')}
            </div>
          </div>
        )}
      </div>

      {/* Full-screen Lightbox Modal */}
      <FeedImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        attachments={attachments}
        initialIndex={selectedIndex}
      />
    </>
  );
};
