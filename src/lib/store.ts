"use client";

import { create } from 'zustand';

interface TranscriptionState {
  isRecording: boolean;
  audioBlob: Blob | null;
  transcription: string;
  isProcessing: boolean;
  error: string | null;
  setIsRecording: (isRecording: boolean) => void;
  setAudioBlob: (audioBlob: Blob | null) => void;
  setTranscription: (transcription: string) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
  isRecording: false,
  audioBlob: null,
  transcription: '',
  isProcessing: false,
  error: null,
  setIsRecording: (isRecording) => set({ isRecording }),
  setAudioBlob: (audioBlob) => set({ audioBlob }),
  setTranscription: (transcription) => set({ transcription }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  reset: () => set({
    isRecording: false,
    audioBlob: null,
    transcription: '',
    isProcessing: false,
    error: null,
  }),
})); 