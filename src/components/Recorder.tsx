"use client";

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatTime } from '@/lib/audio-utils';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { MicIcon, StopCircleIcon } from 'lucide-react';

export function Recorder() {
  const {
    isRecording,
    isRequestingPermission,
    isBrowserCompatible,
    recordingTime,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  // If browser is not compatible, show a message
  if (!isBrowserCompatible) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <h3 className="font-semibold mb-2">Browser Not Supported</h3>
        <p>Your browser does not support audio recording. Please try using a modern browser like Chrome, Firefox, or Edge.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {isRecording && (
        <div className="w-full max-w-md mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Recording</span>
            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          </div>
          <Progress value={Math.min(recordingTime / 120 * 100, 100)} className="h-2" />
          {recordingTime >= 120 && (
            <p className="text-xs text-amber-600 mt-1">
              Recording will automatically stop at 2 minutes for optimal processing
            </p>
          )}
        </div>
      )}
      
      <div className="flex gap-4">
        {!isRecording ? (
          <Button 
            onClick={startRecording} 
            disabled={isRequestingPermission}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
          >
            <MicIcon size={18} />
            {isRequestingPermission ? 'Requesting Mic...' : 'Start Recording'}
          </Button>
        ) : (
          <Button 
            onClick={stopRecording}
            variant="outline"
            className="flex items-center gap-2"
          >
            <StopCircleIcon size={18} />
            Stop Recording
          </Button>
        )}
      </div>
    </div>
  );
} 