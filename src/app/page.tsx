import { Recorder } from '@/components/Recorder';
import { TranscriptionDisplay } from '@/components/TranscriptionDisplay';
import { ApiKeyWarning } from '@/components/ApiKeyWarning';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Phonara</h1>
          <p className="text-muted-foreground">Voice transcription made simple</p>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <ApiKeyWarning />
          
          <section>
            <h2 className="text-xl font-semibold mb-4">Record Your Voice</h2>
            <Recorder />
          </section>
          
          <section>
            <TranscriptionDisplay />
          </section>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Phonara - Voice Transcription App</p>
        </div>
      </footer>

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
