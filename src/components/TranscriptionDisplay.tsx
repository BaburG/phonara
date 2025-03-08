"use client";

import { useTranscriptionStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ClipboardIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';

export function TranscriptionDisplay() {
  const { transcription, isProcessing, error, reset } = useTranscriptionStore();

  const copyToClipboard = async () => {
    if (!transcription) return;
    
    try {
      await navigator.clipboard.writeText(transcription);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
      console.error('Failed to copy:', err);
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto border-red-200">
        <CardHeader className="text-red-700">
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={reset} className="flex items-center gap-2">
            <RefreshCwIcon size={16} />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show empty state if no transcription and not processing
  if (!transcription && !isProcessing) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground/50"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <p>Record audio to see the transcription here</p>
            <p className="text-sm mt-2">Click the &quot;Start Recording&quot; button above to begin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Transcription</CardTitle>
      </CardHeader>
      <CardContent>
        {isProcessing ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Processing your audio...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                <span>AI</span>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{transcription}</p>
                </div>
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {transcription && !isProcessing && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={reset}>
            New Recording
          </Button>
          <Button variant="secondary" onClick={copyToClipboard} className="flex items-center gap-2">
            <ClipboardIcon size={16} />
            Copy Text
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 