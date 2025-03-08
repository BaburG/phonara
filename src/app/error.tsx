'use client';

import { Button } from '@/components/ui/button';
import { RefreshCwIcon, HomeIcon } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Phonara</h1>
          <p className="text-muted-foreground">Voice transcription made simple</p>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong</h2>
          <p className="text-gray-700 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={reset} className="flex items-center gap-2">
              <RefreshCwIcon size={16} />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" className="flex items-center gap-2">
                <HomeIcon size={16} />
                Go Home
              </Link>
            </Button>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Phonara - Voice Transcription App</p>
        </div>
      </footer>
    </div>
  );
} 