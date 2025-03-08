import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Phonara</h1>
          <p className="text-muted-foreground">Voice transcription made simple</p>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Page Not Found</h2>
          <p className="text-gray-700 mb-6">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link href="/" className="flex items-center gap-2 justify-center">
              <HomeIcon size={16} />
              Go Home
            </Link>
          </Button>
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