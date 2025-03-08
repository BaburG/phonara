import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
// Note: In production, you should use environment variables for API keys
const API_KEY = process.env.GOOGLE_AI_API_KEY || '';

// Check if API key is available and log a warning if not
if (!API_KEY) {
  console.warn('Google AI API key is not configured. Set GOOGLE_AI_API_KEY in your .env.local file.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Transcribes audio using Google Gemini AI
 * 
 * @param audioBuffer - The audio buffer to transcribe
 * @returns The transcription result
 */
export async function transcribeAudioWithGemini(audioBuffer: ArrayBuffer): Promise<string> {
  try {
    // Ensure API key is available
    if (!API_KEY) {
      throw new Error('Google AI API key is not configured. Set GOOGLE_AI_API_KEY in your .env.local file.');
    }
    
    // Log the audio buffer size
    console.log(`Processing audio buffer of size: ${audioBuffer.byteLength} bytes`);
    
    // Validate audio buffer
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Empty audio buffer received');
    }
    
    // Convert ArrayBuffer to Base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    console.log(`Converted to base64 string of length: ${base64Audio.length}`);
    
    // Get the Gemini model for transcription
    console.log('Initializing Gemini model');
    
    // Try with Gemini 2.0 Flash first (as per documentation)
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });
      
      console.log('Using Gemini 2.0 Flash model for transcription');
      console.log('Preparing API request with audio data');
      
      // Generate content using the audio data
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: base64Audio
          }
        },
        { text: `
    Your task is to transcribe the speech in the provided audio file **accurately**, regardless of the language spoken. Follow these rules:

    1. **If the audio is in English** → Transcribe the speech exactly as spoken, without any modifications.
    2. **If the audio is in a language other than English** →  
       - First, **detect the language** and state it at the beginning (e.g., "Language: Spanish").  
       - Then, **transcribe the original speech** in its native language.  
       - Finally, **provide an English translation** of the transcribed text directly below it.

    **Example Output:**

    // If the audio is in French:
    Language: French  
    "Bonjour, comment allez-vous aujourd’hui ?"  
    **English Translation:** "Hello, how are you today?"

    Ensure the transcription is **verbatim**—do not summarize or omit any words.  
    The translation should be **clear and natural**, preserving the original meaning.
    ` },
      ]);
      
      console.log('Received response from Gemini API');
      const response = await result.response;
      const text = response.text();
      
      // Log a preview of the transcription
      console.log(`Transcription preview: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      return text;
    } catch (error) {
      // If Gemini 2.0 Flash fails, try with Gemini 1.5 Pro as fallback
      console.warn('Gemini 2.0 Flash failed, trying Gemini 1.5 Pro as fallback:', error);
      
      const fallbackModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
      });
      
      console.log('Using Gemini 1.5 Pro model for transcription (fallback)');
      
      // Try with a different request format for the fallback model
      const fallbackResult = await fallbackModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: base64Audio
                }
              },
              {
                text: "Transcribe this audio accurately."
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
        }
      });
      
      console.log('Received response from fallback Gemini API');
      const fallbackResponse = await fallbackResult.response;
      const fallbackText = fallbackResponse.text();
      
      // Log a preview of the transcription
      console.log(`Fallback transcription preview: ${fallbackText.substring(0, 100)}${fallbackText.length > 100 ? '...' : ''}`);
      
      return fallbackText;
    }
  } catch (error) {
    console.error('Error with Gemini transcription:', error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Checks if the Gemini API is properly configured
 * @returns True if the API is configured, false otherwise
 */
export function isGeminiConfigured(): boolean {
  return !!API_KEY;
} 