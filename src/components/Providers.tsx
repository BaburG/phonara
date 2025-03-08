"use client";

import { Toaster } from '@/components/ui/sonner';
import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <Toaster />
    </>
  );
} 