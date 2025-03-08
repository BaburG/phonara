"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranscriptionStore } from '@/lib/store';
import { transcribeAudio } from '@/lib/api';
import { toast } from 'sonner';

// Maximum recording time in seconds
const MAX_RECORDING_TIME = 120; // 2 minutes

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isRequestingPermission: boolean;
  isBrowserCompatible: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const {
    isRecording,
    setIsRecording,
    setAudioBlob,
    setTranscription,
    setIsProcessing,
    setError,
  } = useTranscriptionStore();
  
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isBrowserCompatible, setIsBrowserCompatible] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    const isSupported = typeof window !== 'undefined' && 
                        navigator.mediaDevices && 
                        typeof navigator.mediaDevices.getUserMedia === 'function' && 
                        typeof window.MediaRecorder === 'function';
    setIsBrowserCompatible(!!isSupported);
    
    if (!isSupported) {
      console.warn('MediaRecorder is not supported in this browser');
    }
  }, []);

  // Define stopRecording function first
  const stopRecording = useCallback(() => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop the media recorder if it's recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping MediaRecorder...');
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    setIsRecording(false);
  }, [setIsRecording]);

  // Auto-stop recording when reaching the maximum time
  useEffect(() => {
    if (isRecording && recordingTime >= MAX_RECORDING_TIME) {
      stopRecording();
      toast.info(`Recording automatically stopped after ${MAX_RECORDING_TIME / 60} minutes`);
    }
  }, [isRecording, recordingTime, stopRecording]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Reset any previous state
      setError(null);
      audioChunksRef.current = [];
      
      setIsRequestingPermission(true);
      console.log('Requesting microphone permission...');
      
      // Get user media with basic audio settings
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log('Microphone access granted');
      
      // Determine supported mime types
      const mimeType = getSupportedMimeType();
      console.log(`Using mime type: ${mimeType}`);
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data available handler
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Received audio chunk: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        } else {
          console.warn('Received empty audio chunk');
        }
      };
      
      // Set up error handler
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Error recording audio');
        stopRecording();
      };
      
      // Set up stop handler
      mediaRecorder.onstop = () => {
        console.log(`Recording stopped. Total chunks: ${audioChunksRef.current.length}`);
        
        if (audioChunksRef.current.length === 0) {
          console.error('No audio chunks recorded');
          setError('No audio data captured. Please try again.');
          toast.error('No audio data captured. Please try again.');
          return;
        }
        
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log(`Audio blob created: ${audioBlob.size} bytes`);
        
        if (audioBlob.size === 0) {
          console.error('Empty audio blob created');
          setError('Empty audio recording. Please try again.');
          toast.error('Empty audio recording. Please try again.');
          return;
        }
        
        setAudioBlob(audioBlob);
        
        // Process the recording
        setIsProcessing(true);
        console.log('Sending audio for transcription...');
        
        transcribeAudio(audioBlob)
          .then((transcription) => {
            setTranscription(transcription);
            toast.success('Transcription complete!');
          })
          .catch((error) => {
            console.error('Transcription error:', error);
            setError(error instanceof Error ? error.message : 'Failed to transcribe audio');
            toast.error('Failed to transcribe audio. Please try again.');
          })
          .finally(() => {
            setIsProcessing(false);
          });
      };
      
      // Start recording
      console.log('Starting MediaRecorder...');
      mediaRecorder.start(1000); // Request data every second
      setIsRecording(true);
      setIsRequestingPermission(false);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRequestingPermission(false);
      setError(error instanceof Error ? error.message : 'Failed to access microphone');
      toast.error('Failed to access microphone. Please check your permissions.');
    }
  }, [setAudioBlob, setError, setIsProcessing, setIsRecording, setTranscription, stopRecording]);

  // Helper function to get supported mime type
  function getSupportedMimeType(): string {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    console.warn('None of the preferred mime types are supported, using default');
    return 'audio/webm'; // Default fallback
  }

  return {
    isRecording,
    isRequestingPermission,
    isBrowserCompatible,
    recordingTime,
    startRecording,
    stopRecording,
  };
} 