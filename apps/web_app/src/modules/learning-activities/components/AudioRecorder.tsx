import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check, Mic, Pause, Play, RotateCcw, Square, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingReady: (file: File) => void;
  maxDurationSeconds?: number;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingReady,
  maxDurationSeconds = 300, // 5 minutes max
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(
        'Audio recording is not supported in this browser. Please use Chrome, Edge, or Firefox.',
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks on the microphone stream to release hardware
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // Emit chunk every 250ms
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDurationSeconds) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(
          'Microphone access denied. Please permit microphone access in your browser settings to record audio.',
        );
      } else {
        setError(`Failed to initialize microphone: ${err?.message || 'Unknown error'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setError(null);
  };

  const handleAttach = () => {
    if (!audioBlob) return;
    const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
    const fileName = `oral_submission_${Date.now()}.${ext}`;
    const file = new File([audioBlob], fileName, { type: audioBlob.type });
    onRecordingReady(file);
    resetRecording();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <Card className="border-dashed border-cyan-300 bg-cyan-50/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isRecording ? 'animate-pulse bg-rose-600 text-white' : 'bg-cyan-100 text-cyan-800'
            }`}
          >
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-cyan-950">
              In-Browser Voice & Speech Recorder
            </h4>
            <p className="text-[11px] text-cyan-800">
              Record oral presentations, pronunciations, or spoken reflections directly
            </p>
          </div>
        </div>
        <div className="font-mono text-sm font-bold text-cyan-950">{formatTimer(duration)}</div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-1.5 rounded bg-rose-50 p-2 text-xs text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!isRecording && !audioUrl && (
          <Button
            size="sm"
            onClick={startRecording}
            className="gap-1.5 bg-cyan-700 hover:bg-cyan-800"
          >
            <Mic className="h-3.5 w-3.5" />
            Start Voice Recording
          </Button>
        )}

        {isRecording && (
          <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-1.5">
            <Square className="h-3.5 w-3.5" />
            Stop & Preview ({formatTimer(duration)})
          </Button>
        )}

        {audioUrl && (
          <div className="w-full space-y-3 pt-2">
            <audio src={audioUrl} controls className="h-9 w-full rounded" />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAttach}
                className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
              >
                <Check className="h-3.5 w-3.5" />
                Attach Audio to Submission
              </Button>
              <Button size="sm" variant="outline" onClick={resetRecording} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Re-record
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
