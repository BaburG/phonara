import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioWithGemini, isGeminiConfigured } from '@/lib/gemini';

export const maxDuration = 60; // Set max duration to 60 seconds for Edge function

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API is configured
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'Google AI API key is not configured. Set GOOGLE_AI_API_KEY in your .env.local file.' },
        { status: 500 }
      );
    }

    // Check if the request is a FormData request
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    // Validate the audio file
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Check if the audio file is empty
    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: 'Audio file is empty' },
        { status: 400 }
      );
    }

    // Log audio file details for debugging
    console.log('Audio file details:', {
      name: audioFile.name,
      type: audioFile.type,
      size: `${(audioFile.size / 1024).toFixed(2)} KB`,
      lastModified: new Date(audioFile.lastModified).toISOString()
    });

    try {
      // Convert the file to ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      console.log(`Converted audio to ArrayBuffer of size: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);

      // Transcribe the audio using Google Gemini
      console.log('Starting transcription with Gemini...');
      const transcription = await transcribeAudioWithGemini(arrayBuffer);
      
      if (!transcription || transcription.trim() === '') {
        console.warn('Received empty transcription from Gemini');
        return NextResponse.json(
          { error: 'Received empty transcription. Please try again with a clearer audio recording.' },
          { status: 500 }
        );
      }
      
      console.log('Transcription completed successfully');
      console.log(`Transcription length: ${transcription.length} characters`);

      // Return the transcription
      return NextResponse.json({ transcription });
    } catch (transcribeError: any) {
      console.error('Transcription API error:', transcribeError);
      
      return NextResponse.json(
        { 
          error: transcribeError instanceof Error 
            ? transcribeError.message 
            : 'An error occurred during transcription',
          details: {
            message: transcribeError?.message || 'Unknown error',
            status: transcribeError?.status,
            statusText: transcribeError?.statusText
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in transcribe API:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'An error occurred during transcription' 
      },
      { status: 500 }
    );
  }
}

// Configure the API route as an Edge Function for lower latency
export const config = {
  runtime: 'edge',
}; 