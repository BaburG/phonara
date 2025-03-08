"use client";

/**
 * Utility functions for handling audio recording and processing
 */

/**
 * Checks if the browser supports audio recording
 * @returns True if the browser supports audio recording, false otherwise
 */
export function isBrowserSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
}

/**
 * Creates a MediaRecorder with the specified options
 * @param stream - The media stream to record
 * @param options - MediaRecorder options
 * @returns A new MediaRecorder instance
 */
export function createMediaRecorder(
  stream: MediaStream,
  options?: MediaRecorderOptions
): MediaRecorder {
  return new MediaRecorder(stream, options);
}

/**
 * Converts a Blob to an ArrayBuffer
 * @param blob - The Blob to convert
 * @returns A Promise that resolves to an ArrayBuffer
 */
export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert Blob to ArrayBuffer'));
      }
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Formats a time in seconds to a MM:SS string
 * @param seconds - The time in seconds
 * @returns A formatted time string (MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Debounces a function call
 * @param func - The function to debounce
 * @param wait - The debounce wait time in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
} 