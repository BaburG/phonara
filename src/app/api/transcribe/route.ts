import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.CLOUDFLARE_GEMINI_GATEWAY_URL; // Use a specific var for the gateway
const API_KEY = process.env.GOOGLE_AI_API_KEY; // Server-side key

export async function POST(request: NextRequest) {
    if (!GATEWAY_URL || !API_KEY) {
        // console.error('Transcription Service Not Configured: Missing Gateway URL or API Key');
        return NextResponse.json({ error: 'Transcription service not configured.' }, { status: 500 });
    }

    try {
        const { audioData } = await request.json(); // Expecting { audioData: "base64string" }

        if (!audioData) {
            return NextResponse.json({ error: 'Missing audio data' }, { status: 400 });
        }

        const model = 'gemini-2.0-flash-lite';
        const providerPath = 'google-ai-studio/v1/models';
        const fullGatewayUrl = `${GATEWAY_URL.replace(/\/$/, '')}/${providerPath}/${model}:generateContent`;

        const transcriptionPrompt = `
Your task is to transcribe the speech in the provided audio file **accurately**. Follow these rules:

1. **First, detect the language being spoken** and state it at the beginning (e.g., "Language: Spanish").
2. **Transcribe the original speech** in its native language exactly as spoken, without any modifications.
3. **Provide an English translation** of the transcribed text directly below it.

**Example Output:**

Language: French
"Bonjour, comment allez-vous aujourd'hui ?"
**English Translation:** "Hello, how are you today?"

Ensure the transcription is **verbatim**—do not summarize or omit any words.
The translation should be **clear and natural**, preserving the original meaning.
`;

        const payload = {
            contents: [
                {
                    // Note: Role might not be needed/used by model for direct audio input
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'audio/webm', // Assuming webm format from MediaRecorder
                                data: audioData,
                            },
                        },
                        {
                            text: transcriptionPrompt,
                        },
                    ],
                },
            ],
            // Optional: Add generationConfig if needed (e.g., temperature: 0)
        };

        // console.log(`[API Transcribe] Sending request to ${fullGatewayUrl}`);
        const response = await fetch(fullGatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            // console.error(`[API Transcribe] Gemini API Error: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(`Gemini API request failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract the text from the response (structure might vary based on model/API version)
        const transcription = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!transcription) {
             // console.warn('[API Transcribe] No transcription text found in Gemini response:', JSON.stringify(data));
             // Attempt fallback extraction if needed, or return empty/error
        }

        // console.log(`[API Transcribe] Received transcription length: ${transcription.length}`);

        return NextResponse.json({ transcription });

    } catch (error: any) {
        // console.error('[API Transcribe] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to transcribe audio' }, { status: 500 });
    }
}

// Configure the API route as an Edge Function for lower latency
export const config = {
  runtime: 'edge',
}; 