import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.CLOUDFLARE_GEMINI_GATEWAY_URL; // Use a specific var for the gateway
const API_KEY = process.env.GOOGLE_AI_API_KEY; // Server-side key

// Helper function to get language name from code (can be shared or defined here)
const getLanguageNameFromCode = (code: string): string => {
    // Example: maintain a simple map or import from shared util
    const langMap: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', zh: 'Chinese', ar: 'Arabic', ru: 'Russian', tr: 'Turkish', ja: 'Japanese' };
    return langMap[code] || code; // Fallback to code if name not found
};

export async function POST(request: NextRequest) {
    if (!GATEWAY_URL || !API_KEY) {
        // console.error('Translation Service Not Configured: Missing Gateway URL or API Key');
        return NextResponse.json({ error: 'Translation service not configured.' }, { status: 500 });
    }

    try {
        const { text, sourceLanguage, targetLanguage } = await request.json();

        if (!text || !targetLanguage) {
            return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
        }

        const model = 'gemini-2.0-flash-lite'; // Consistent model
        const providerPath = 'google-ai-studio/v1/models';
        const fullGatewayUrl = `${GATEWAY_URL.replace(/\/$/, '')}/${providerPath}/${model}:generateContent`;

        // Construct the prompt for translation
        const targetLangName = getLanguageNameFromCode(targetLanguage);
        const sourceLangName = sourceLanguage ? getLanguageNameFromCode(sourceLanguage) : 'the source language';
        const prompt = `
Translate the following text to ${targetLangName}${sourceLanguage ? ` (it is in ${sourceLangName})` : ' (auto-detect source language)'}:

"${text}"

Provide ONLY the translated text without any explanations, notes, or quotes.
`;

        const payload = {
            contents: [
                {
                    role: "user", // Use role as in user's example
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            // Optional: Add generationConfig (e.g., temperature: 0 for more deterministic translation)
        };

        // console.log(`[API Translate] Sending request to ${fullGatewayUrl}`);
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
            // console.error(`[API Translate] Gemini API Error: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(`Gemini API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

         if (!translatedText) {
             // console.warn('[API Translate] No translation text found in Gemini response:', JSON.stringify(data));
             // Fallback or error? Return original text for now?
             // For now, let's return an error state indication
             throw new Error('Translation failed: Empty response from API.');
        }

        // console.log(`[API Translate] Received translation length: ${translatedText.length}`);

        return NextResponse.json({ translatedText });

    } catch (error: any) {
        // console.error('[API Translate] Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to translate text' }, { status: 500 });
    }
} 