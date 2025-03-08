'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';

export function ApiKeyWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if API key is configured
    const apiKey = process.env.NEXT_PUBLIC_HAS_API_KEY === 'true';
    setIsVisible(!apiKey);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto border-amber-200 bg-amber-50 mb-8">
      <CardHeader className="text-amber-800">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangleIcon size={20} />
          API Key Not Configured
        </CardTitle>
      </CardHeader>
      <CardContent className="text-amber-700">
        <p className="mb-4">
          The Google AI API key is not configured. The application will not be able to transcribe audio without a valid API key.
        </p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Create a <Link href="https://ai.google.dev/" className="underline" target="_blank" rel="noopener noreferrer">Google AI API key</Link></li>
          <li>Create a <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code> file in the root directory</li>
          <li>Add <code className="bg-amber-100 px-1 py-0.5 rounded">GOOGLE_AI_API_KEY=your_api_key_here</code> to the file</li>
          <li>Restart the development server</li>
        </ol>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild>
          <Link href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <ExternalLinkIcon size={16} />
            Get API Key
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 