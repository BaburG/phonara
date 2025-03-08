"use client";

/**
 * API client for interacting with the backend and Google Gemini API
 */
import { debounce } from '@/lib/audio-utils';

/**
 * Sends audio data to the backend for transcription
 * @param audioBlob - The audio blob to transcribe
 * @returns The transcription result
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to transcribe audio');
    }

    const data = await response.json();
    return data.transcription;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Debounced version of transcribeAudio to prevent multiple API calls
 * @param audioBlob - The audio blob to transcribe
 * @returns A Promise that resolves to the transcription result
 */
export const debouncedTranscribeAudio = debounce(
  (audioBlob: Blob, callback: (result: string | Error) => void) => {
    transcribeAudio(audioBlob)
      .then((result) => callback(result))
      .catch((error) => callback(error));
  },
  500
); 