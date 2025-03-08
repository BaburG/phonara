"use client";

import { Toaster } from '@/components/ui/sonner';
import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <Toaster />
    </ThemeProvider>
  );
} 