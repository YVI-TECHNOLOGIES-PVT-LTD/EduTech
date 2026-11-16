import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Film, Music, Play, Volume2 } from 'lucide-react';
import { formatFileSize } from './LearningActivityBadges';

interface MediaPreviewPlayerProps {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  downloadUrl: string;
}

export const MediaPreviewPlayer: React.FC<MediaPreviewPlayerProps> = ({
  fileName,
  mimeType,
  fileSizeBytes,
  downloadUrl,
}) => {
  const isVideo =
    mimeType.startsWith('video/') ||
    fileName.endsWith('.mp4') ||
    fileName.endsWith('.webm') ||
    fileName.endsWith('.mov');

  const isAudio =
    mimeType.startsWith('audio/') ||
    fileName.endsWith('.mp3') ||
    fileName.endsWith('.wav') ||
    fileName.endsWith('.m4a') ||
    fileName.endsWith('.webm') ||
    fileName.endsWith('.ogg');

  return (
    <Card className="overflow-hidden border border-slate-200 bg-slate-50/50 dark:border-border">
      {isVideo && (
        <div className="bg-black">
          <video
            controls
            preload="metadata"
            src={downloadUrl}
            className="max-h-[320px] w-full object-contain"
          >
            Your browser does not support inline video playback.
          </video>
        </div>
      )}

      {isAudio && (
        <div className="flex items-center gap-3 border-b bg-cyan-50/60 p-3">
          <Volume2 className="h-5 w-5 text-cyan-800" />
          <audio controls preload="metadata" src={downloadUrl} className="h-8 flex-1">
            Your browser does not support inline audio playback.
          </audio>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
        <div className="flex items-center gap-2">
          {isVideo ? (
            <Film className="h-4 w-4 text-rose-600" />
          ) : isAudio ? (
            <Music className="h-4 w-4 text-cyan-700" />
          ) : null}
          <span className="font-medium text-foreground">{fileName}</span>
          <span className="text-muted-foreground">({formatFileSize(fileSizeBytes)})</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => window.open(downloadUrl, '_blank', 'noopener,noreferrer')}
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      </div>
    </Card>
  );
};
