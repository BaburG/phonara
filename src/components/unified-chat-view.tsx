"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Loader2, MessageSquare, UserCog, UserRound, AlertCircle } from "lucide-react"
import { ConversationMessage } from "@/lib/translation-store"
import { StoredConversationMessage } from "@/lib/types"
import { cn } from "@/lib/utils"
import { transcribeAudioWithGemini, isGeminiConfigured } from "@/lib/gemini"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "./ui/skeleton"

const languages = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "zh", label: "Chinese", flag: "🇨🇳" },
  { value: "ar", label: "Arabic", flag: "🇸🇦" },
  { value: "ru", label: "Russian", flag: "🇷🇺" },
  { value: "tr", label: "Turkish", flag: "🇹🇷" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
]

// Replace mock translation with real Gemini translation
const translateText = async (text: string, from: string, to: string): Promise<string> => {
  if (!isGeminiConfigured()) {
    console.log("Gemini not configured, using mock translation");
    // Return a mock translation for demo purposes
    return `[Translated from ${from} to ${to}]: ${text}`;
  }
  
  try {
    console.log(`Translating text to ${to}: \"${text}\"`);
    
    // Create a prompt for Gemini to translate the text
    const prompt = `
    Translate the following text to ${getLanguageNameFromCode(to)}:

    \"${text}\"
    
    Please detect the source language automatically. Provide ONLY the translated text without any explanations, notes, or quotes. Do not include information about the source language or any additional commentary.
    `;
    
    // Use the same model-fetching logic as in transcribeAudioWithGemini
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || ''; // Use NEXT_PUBLIC_ prefix for client-side access
    if (!API_KEY) {
        console.error("GOOGLE_AI_API_KEY is not defined. Translation will use mock.");
        return `[Mock Translation for ${to}]: ${text}`;
    }
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Try with the faster model first
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash', // Updated model name
      });
      
      console.log("Using Gemini 1.5 Flash model for translation");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text();
      
      console.log(`Translation result: \"${translatedText}\"`);
      return translatedText.trim();
    } catch (error) {
      console.warn("Gemini 1.5 Flash failed, trying Gemini 1.5 Pro for translation:", error);
      
      // Fallback to the more capable model
      const fallbackModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
      });
      
      const fallbackResult = await fallbackModel.generateContent(prompt);
      const fallbackResponse = await fallbackResult.response;
      const fallbackText = fallbackResponse.text();
      
      console.log(`Fallback translation result: \"${fallbackText}\"`);
      return fallbackText.trim();
    }
  } catch (error) {
    console.error("Translation error:", error);
    // Fallback to simple mock translation if anything fails
    return `[Translated from ${from} to ${to}]: ${text}`;
  }
}

// Helper function to get language name from code
const getLanguageNameFromCode = (code: string): string => {
  const language = languages.find(lang => lang.value === code);
  return language ? language.label : "Unknown";
}

// --- Component Definition ---
interface UnifiedChatViewProps {
    sessionId: string | null; // Accept sessionId as a prop
}

export default function UnifiedChatView({ sessionId }: UnifiedChatViewProps) {
  // --- State Variables ---
  const [doctorLanguage, setDoctorLanguage] = useState("en")
  const [patientLanguage, setPatientLanguage] = useState("es")

  const [isRecordingDoctor, setIsRecordingDoctor] = useState(false)
  const [isRecordingPatient, setIsRecordingPatient] = useState(false)
  const [recordingText, setRecordingText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [activeRecordingRole, setActiveRecordingRole] = useState<"doctor" | "patient" | null>(null)
  
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [geminiConfigured, setGeminiConfigured] = useState(false)
  
  // State for managing fetched messages
  const [messages, setMessages] = useState<StoredConversationMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Effects ---

  // Check Gemini config on mount
  useEffect(() => {
    setGeminiConfigured(isGeminiConfigured())
  }, [])
  
  // Handle mounting state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch chat history when sessionId changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!sessionId) {
        setMessages([])
        setIsLoadingHistory(false)
        setFetchError("No chat session selected.")
        return
      }

      console.log(`Fetching history for session: ${sessionId}`)
      setIsLoadingHistory(true)
      setFetchError(null)
      setMessages([]) // Clear previous messages

      try {
        const response = await fetch(`/api/chat/history/${sessionId}`)
        if (response.status === 404) {
          setFetchError("Chat session not found or access denied.")
        } else if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        } else {
          const data: StoredConversationMessage[] = await response.json()
          setMessages(data)
        }
      } catch (err: any) {
        console.error("Failed to fetch chat history:", err)
        setFetchError(err.message || "Failed to load chat history.")
      } finally {
        setIsLoadingHistory(false)
      }
    }

    fetchChatHistory()
  }, [sessionId]) // Dependency on sessionId

  // Scroll to bottom when new messages are added or history loads
  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length, mounted]) // Depend on local messages state

  // Cleanup effect for MediaRecorder
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error("Error cleaning up media recorder:", error);
        }
      }
    };
  }, [mediaRecorder]);

  // --- Recording & Processing Logic (largely unchanged, but update saving) ---

  const handleRecording = (role: "doctor" | "patient") => {
    if (role === "doctor") {
      if (isRecordingDoctor) {
        stopRecording(role)
      } else {
        startRecording(role)
      }
    } else {
      if (isRecordingPatient) {
        stopRecording(role)
      } else {
        startRecording(role)
      }
    }
  }

  const startRecording = async (role: "doctor" | "patient") => {
    // Don't allow recording from both roles simultaneously
    if (isRecordingDoctor || isRecordingPatient) {
      return
    }

    setActiveRecordingRole(role)

    if (role === "doctor") {
      setIsRecordingDoctor(true)
    } else {
      setIsRecordingPatient(true)
    }

    // Clear any previous recording data
    setAudioChunks([])
    setRecordingText("")

    // Check if Gemini API is configured
    if (!geminiConfigured) {
      // If Gemini is not configured, fall back to the simulated recording
      toast({
        title: "Gemini API not configured",
        description: "Using simulated recording. Add NEXT_PUBLIC_GOOGLE_AI_API_KEY to your .env.local file for real transcription.",
        variant: "destructive",
      })
      
      simulateRecording(role)
      return
    }

    try {
      // Request access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create a new MediaRecorder instance
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      
      // Set up event listeners
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, event.data])
        }
      }
      
      // Make sure we stop properly when the recording is complete
      recorder.onstop = () => {
        console.log("MediaRecorder stopped");
        // Stop all tracks from the stream
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Start recording
      recorder.start(100) // Collect data every 100ms
      
      // Visual feedback that recording has started
      toast({
        title: "Listening started",
        description: `Now listening to ${role === "doctor" ? "doctor" : "patient"} speech - any language will be detected automatically`,
        variant: "default",
      })
      
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Check permissions and try again.",
        variant: "destructive",
      })
      
      // Reset recording state
      if (role === "doctor") {
        setIsRecordingDoctor(false)
      } else {
        setIsRecordingPatient(false)
      }
      setActiveRecordingRole(null)
      
      // Fall back to simulated recording
      simulateRecording(role)
    }
  }

  // Function to simulate recording (used as fallback if real recording fails)
  const simulateRecording = (role: "doctor" | "patient") => {
    // This is the original simulation code
    setTimeout(() => {
      const sampleTexts = {
        doctor: {
          en: "Could you describe your symptoms?",
          es: "¿Podría describir sus síntomas?",
          fr: "Pourriez-vous décrire vos symptômes?",
          de: "Könnten Sie Ihre Symptome beschreiben?",
          zh: "您能描述一下您的症状吗？",
          ar: "هل يمكنك وصف الأعراض التي تعاني منها؟",
          ru: "Не могли бы вы описать свои симптомы?",
          tr: "Belirtilen belirtilerinizi açıklayabilir misiniz?",
          ja: "症状を説明していただけますか？",
        },
        patient: {
          en: "I have a headache and fever since yesterday.",
          es: "Tengo dolor de cabeza y fiebre desde ayer.",
          fr: "J'ai mal à la tête et de la fièvre depuis hier.",
          de: "Ich habe seit gestern Kopfschmerzen und Fieber.",
          zh: "我从昨天开始头痛和发烧。",
          ar: "أعاني من صداع وحمى منذ الأمس.",
          ru: "У меня болит голова и жар со вчерашнего дня.",
          tr: "Dün yapılan belirtilerinizi açıklayabilir misiniz?",
          ja: "昨日から頭痛と熱があります。",
        },
      }

      const language = role === "doctor" ? doctorLanguage : patientLanguage

      // Use the sample text for the selected language, or fall back to English
      setRecordingText(sampleTexts[role][language as keyof (typeof sampleTexts)[typeof role]] || sampleTexts[role].en)
    }, 1500)
  }

  // stopRecording: Needs to call processTranslation with the final text
  const stopRecording = useCallback(async (role: "doctor" | "patient") => {
    console.log(`Stopping recording for ${role}...`);
    
    // Immediately update UI state
    if (role === "doctor") setIsRecordingDoctor(false);
    else setIsRecordingPatient(false);
    setActiveRecordingRole(null);

    // Handle real recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      setIsTranscribing(true); // Show transcribing state

      // Wrap recorder stop logic in a promise to ensure blob creation
      const blob = await new Promise<Blob | null>((resolve) => {
          let recordedChunks: Blob[] = [];
          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  recordedChunks.push(event.data);
              }
          };
          mediaRecorder.onstop = () => {
              console.log("MediaRecorder stopped event triggered");
              const audioBlob = recordedChunks.length > 0 ? new Blob(recordedChunks, { type: 'audio/webm' }) : null;
              // Ensure microphone tracks are stopped
              mediaRecorder.stream?.getTracks().forEach(track => track.stop());
              resolve(audioBlob);
              setAudioChunks([]); // Clear state chunks
              recordedChunks = []; // Clear local chunks
          };
          mediaRecorder.stop();
      });


      if (blob) {
        try {
          console.log(`Created audio blob of size: ${blob.size} bytes`);
          const arrayBuffer = await blob.arrayBuffer();
          const transcription = await transcribeAudioWithGemini(arrayBuffer);
          console.log("Received transcription from Gemini:", transcription);
          const { text, detectedLanguage } = extractTranscription(transcription, role === "doctor" ? doctorLanguage : patientLanguage);
          console.log("Extracted text:", text);
          setRecordingText(text); // Update UI temporarily

          if (text.trim()) {
            // Use setTimeout to allow UI repaint before potentially heavy translation
            setTimeout(() => processTranslation(role, text, detectedLanguage), 100);
          }
        } catch (error) {
          console.error("Transcription or processing error:", error);
          toast({ title: "Transcription failed", description: "Could not process audio.", variant: "destructive" });
          simulateRecording(role); // Fallback to simulation on error
        } finally {
          setIsTranscribing(false);
        }
      } else {
        console.log("No audio blob created after stopping.");
        setIsTranscribing(false);
        // Optionally handle the case of no audio recorded
      }
    } else { // Handle simulation or inactive recorder
        if (recordingText.trim()) {
            console.log("Processing simulated/existing text:", recordingText);
             // Use setTimeout to allow UI repaint before potentially heavy translation
            setTimeout(() => processTranslation(role, recordingText), 100);
        } else {
            console.log("Stop recording called, but no recording text (likely simulation hadn't finished).");
        }
    }
  // Add dependencies for useCallback
  }, [mediaRecorder, recordingText, doctorLanguage, patientLanguage, geminiConfigured]); 


  // extractTranscription, getLanguageCodeFromName remain the same
  // ... (keep extractTranscription, getLanguageCodeFromName) ...
    // Update the extractTranscription function to return both text and detected language
  const extractTranscription = (transcription: string, language: string): { text: string; detectedLanguage: string } => {
    console.log("Raw transcription from Gemini:", transcription);
    
    // The format should now always include "Language:" prefix
    if (transcription.includes("Language:")) {
      const lines = transcription.split('\n').filter(line => !!line.trim());
      console.log("Parsed transcription lines:", lines);
      
      // Format is now always:
      // Line 1: "Language: X"
      // Line 2: Original text in detected language
      // Line 3: "English Translation: ..."
      
      // Extract the detected language
      const languageLine = lines[0];
      const detectedLanguageName = languageLine.replace("Language:", "").trim();
      const detectedLanguageCode = getLanguageCodeFromName(detectedLanguageName);
      console.log(`Detected language: ${detectedLanguageName} (${detectedLanguageCode})`);
      
      // Check if available and get the transcribed text (line after language detection)
      if (lines.length >= 2) {
        // Remove quotes if present
        const transcribedText = lines[1].replace(/^"/, '').replace(/"$/, '').trim();
        console.log("Extracted transcribed text:", transcribedText);
        return { text: transcribedText, detectedLanguage: detectedLanguageCode };
      }
    }
    
    // Fallback: Handle unexpected formats, including the observed one
    console.log("Transcription format unexpected, attempting fallback extraction.");
    
    // Try extracting text after "**Original:** "
    const originalMarker = "**Original:** ";
    const originalIndex = transcription.indexOf(originalMarker);
    if (originalIndex !== -1) {
      // Find the end of the original text (often before "**English:**" or end of string)
      const englishMarker = "**English:**";
      const englishIndex = transcription.indexOf(englishMarker, originalIndex);
      let extractedText = "";
      if (englishIndex !== -1) {
        extractedText = transcription.substring(originalIndex + originalMarker.length, englishIndex).trim();
      } else {
        extractedText = transcription.substring(originalIndex + originalMarker.length).trim();
      }
      // Remove potential trailing quotes or formatting
      extractedText = extractedText.replace(/^"/, '').replace(/"$/, '').trim(); 
      console.log("Extracted text using fallback marker:", extractedText);
      // We don't know the language for sure in this fallback, use the provided default
      return { text: extractedText, detectedLanguage: language };
    }

    // If marker not found, return the whole trimmed transcription as last resort
    console.log("Fallback marker not found, using raw transcription.");
    return { text: transcription.trim(), detectedLanguage: language };
  }

  // Helper function to convert language name to language code
  const getLanguageCodeFromName = (languageName: string): string => {
    const languageMap: Record<string, string> = {
      "English": "en",
      "Spanish": "es",
      "French": "fr",
      "German": "de",
      "Chinese": "zh",
      "Arabic": "ar",
      "Russian": "ru",
      "Japanese": "ja",
      "Turkish": "tr", // Added Turkish based on languages array
    };
    
    // Clean up the language name and try to find a match
    const cleanName = languageName.trim().toLowerCase();
    
    for (const [name, code] of Object.entries(languageMap)) {
      if (cleanName.includes(name.toLowerCase())) {
        return code;
      }
    }
    
    // Default to English if no match found
    return "en";
  }


  // *** UPDATED processTranslation to save via API ***
  const processTranslation = useCallback(async (role: "doctor" | "patient", text: string, detectedLanguage?: string) => {
    if (!text || !text.trim() || !sessionId) { // Also check for valid sessionId
      console.log("No text to translate or no session ID, skipping translation/saving");
      setIsTranslating(false); // Ensure translating state is reset
      setRecordingText(""); // Clear any temporary text
      return;
    }
    
    console.log(`Starting translation/saving for session ${sessionId}, text:`, text);
    setIsTranslating(true); // Indicate processing starts

    const otherRole = role === "doctor" ? "patient" : "doctor";
    const fromLanguage = detectedLanguage || (role === "doctor" ? doctorLanguage : patientLanguage);
    const toLanguage = role === "doctor" ? patientLanguage : doctorLanguage;

    try {
      const translatedText = await translateText(text, fromLanguage, toLanguage);

      // Construct the message payload for saving (similar to ConversationMessage but without DB fields initially)
      const messagePayload: ConversationMessage = {
        role,
        targetRole: otherRole,
        language: fromLanguage,
        original: text,
        translated: translatedText,
        timestamp: new Date().toISOString(), // Use ISO string for consistency
      };

      // --- Optimistic Update ---
      // Create a temporary message object for immediate UI update
      // Note: _id, createdAt, userId will be set by the backend
      const tempId = `temp_${Date.now()}`; // Simple temporary ID
      const optimisticMessage: StoredConversationMessage = {
          ...messagePayload,
          _id: tempId, 
          sessionId: sessionId,
          userId: 'optimistic-user', // Placeholder, backend will set correct user
          createdAt: new Date(), // Use local date for optimistic display
      };
      setMessages(prev => [...prev, optimisticMessage]);
      setRecordingText(""); // Clear input/recording indicator text

      // --- Save to API ---
      console.log("Sending message to API:", messagePayload);
      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messagePayload, sessionId }),
      });

      if (!response.ok) {
        // Rollback optimistic update on failure
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        const errorData = await response.json().catch(() => ({ error: 'Failed to save message' }));
        throw new Error(errorData.error || `Failed to save message: ${response.statusText}`);
      }

      const savedMessage: StoredConversationMessage = await response.json();
      console.log("Message saved successfully:", savedMessage);

      // Optional: Update the optimistic message with the real data from the server
      // This replaces the temporary message with the one having the correct _id, createdAt etc.
      setMessages(prev => prev.map(msg => msg._id === tempId ? savedMessage : msg));

    } catch (error: any) {
        console.error("Error during translation or saving:", error);
        toast({
            title: "Error Processing Message",
            description: error.message || "Could not translate or save the message.",
            variant: "destructive",
        });
         // Consider rolling back optimistic update here too if it wasn't already rolled back
        setMessages(prev => prev.filter(msg => msg._id !== `temp_${Date.now()}`)); // Be careful with temp ID matching here
    } finally {
        setIsTranslating(false); // Indicate processing finished
    }
  // Add dependencies for useCallback
  }, [sessionId, doctorLanguage, patientLanguage]);

  // --- Rendering ---

  // Handle case where component isn't mounted yet (avoids hydration errors)
  if (!mounted) {
    // Return a static skeleton matching the final layout
    return (
      <Card className="overflow-hidden shadow-lg border-none bg-white">
         <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-200">
            {/* Static header content */}
         </CardHeader>
         <CardContent className="h-[50vh] overflow-y-auto p-6">
            <div className="space-y-3">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
                <Skeleton className="h-16 w-3/4" />
            </div>
         </CardContent>
         <CardFooter className="border-t p-0">
             <div className="w-full p-4">Loading controls...</div>
         </CardFooter>
      </Card>
    );
  }

  // Handle invalid session ID state specifically after mount
  if (!sessionId) {
     return (
       <Card className="overflow-hidden shadow-lg border-none bg-white flex flex-col h-full">
          <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-200">
            <CardTitle className="text-slate-700">Translation Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
             <div className="text-center text-muted-foreground">
                 <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>Please select a chat from the sidebar or start a new one.</p>
             </div>
          </CardContent>
          {/* Optionally disable footer or show minimal version */}
          <CardFooter className="border-t p-4 text-center text-sm text-muted-foreground">
             Controls disabled. Select a chat.
          </CardFooter>
       </Card>
     );
  }


  // Main component render when mounted and sessionId is valid
  return (
    <Card className="overflow-hidden shadow-lg border-none bg-white flex flex-col h-full">
      {/* Header remains mostly the same */}
      <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-200">
         <CardTitle className="flex justify-between items-center">
           <span className="text-slate-700">Translation Chat ({sessionId.substring(0,6)}...)</span>
           {/* Badges remain the same */}
           <div className="flex items-center gap-2">
             <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
               Doctor: {languages.find((lang) => lang.value === doctorLanguage)?.flag}
             </Badge>
             <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
               Patient: {languages.find((lang) => lang.value === patientLanguage)?.flag}
             </Badge>
             {!geminiConfigured && (
               <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                 <AlertCircle className="h-3 w-3" /> Demo Mode
               </Badge>
             )}
           </div>
         </CardTitle>
       </CardHeader>

      {/* Message display area - Use local state 'messages' */}
      <CardContent className="flex-1 h-[50vh] overflow-y-auto p-6 space-y-4">
        {isLoadingHistory && (
            <div className="space-y-3">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
                <Skeleton className="h-16 w-3/4" />
            </div>
        )}
        {fetchError && !isLoadingHistory && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-destructive">
                <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Error Loading Chat</h3>
                <p className="max-w-xs">{fetchError}</p>
            </div>
        )}
        {!isLoadingHistory && !fetchError && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="max-w-xs">Use the listening buttons below to start the conversation.</p>
          </div>
        )}

        {/* Map over local 'messages' state */}
        {!isLoadingHistory && !fetchError && messages.map((message) => { 
          const isDoctor = message.role === "doctor";
          // Use message._id as key (make sure it's unique - handled by API/optimistic update)
          return (
            <div
              key={message._id} 
              className={cn(
                "message-bubble p-4 max-w-[85%] animate-in fade-in-50 duration-300",
                isDoctor ? "received mr-auto doctor-message" : "sent ml-auto patient-message",
                // Add class for optimistic messages if needed for styling/debugging
                message._id.startsWith('temp_') ? 'optimistic' : '' 
              )}
            >
              {/* Message content rendering remains the same */}
               <div className="flex items-center gap-2 mb-1">
                 <span className={`font-medium ${isDoctor ? "text-blue-100" : "text-emerald-100"}`}>
                   {isDoctor ? "Doctor" : "Patient"}
                 </span>
                 {/* Use createdAt for stored messages, fallback to timestamp for older format? */}
                 <span className="text-xs opacity-80">{new Date(message.createdAt || message.timestamp).toLocaleTimeString()}</span>
               </div>

               <div className="space-y-3">
                 <div>
                   <p className="font-medium text-sm opacity-80">
                     Original ({languages.find((lang) => lang.value === message.language)?.label || "Unknown"}):
                   </p>
                   <p>{message.original}</p>
                 </div>

                 <div className={`p-2 rounded-md ${isDoctor ? "bg-blue-600/20" : "bg-emerald-600/20"}`}>
                   <p className="font-medium text-sm opacity-80">
                     Translation (
                     {languages.find((lang) => lang.value === (isDoctor ? patientLanguage : doctorLanguage))?.label}):
                   </p>
                   <p>{message.translated}</p>
                 </div>
               </div>
            </div>
          );
        })}

        {/* Recording/Transcribing/Translating indicators remain the same */}
         {(isRecordingDoctor || isRecordingPatient || isTranscribing) && (
          <div
            className={`message-bubble p-4 animate-pulse-recording ${
              isRecordingDoctor || (isTranscribing && activeRecordingRole === "doctor") 
                ? "received mr-auto doctor-message" 
                : "sent ml-auto patient-message"
            }`}
          >
             <div className="flex items-center gap-2 mb-1">
               <span
                 className={`font-medium ${
                   isRecordingDoctor || (isTranscribing && activeRecordingRole === "doctor") 
                     ? "text-blue-100" 
                     : "text-emerald-100"
                 }`}
               >
                 {isRecordingDoctor || (isTranscribing && activeRecordingRole === "doctor") ? "Doctor" : "Patient"}
               </span>
               <div className="flex items-center text-xs opacity-80">
                 <span className="mr-2">{isTranscribing ? "Transcribing" : "Listening"}</span>
                 <span className="flex h-2 w-2 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                 </span>
               </div>
             </div>
             <p>{recordingText || (isTranscribing ? "Transcribing audio..." : "Listening...")}</p>
           </div>
         )}
        
         {isTranslating && (
           <div className="message-bubble received p-4 mx-auto received-message flex items-center gap-2 bg-white text-slate-700 max-w-[50%]">
             <Loader2 className="h-4 w-4 animate-spin" />
             <p>Translating & Saving...</p> {/* Updated text */}
           </div>
         )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Footer controls remain the same */}
      <CardFooter className="border-t p-0">
         <div className="w-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
           {/* Doctor Controls */}
           <div className="p-4">
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
               <div className="flex items-center gap-2 text-blue-700 font-medium">
                 <UserCog className="h-5 w-5" />
                 <span>Doctor</span>
               </div>

               <div className="flex flex-1 gap-2 w-full sm:w-auto">
                 <Select value={doctorLanguage} onValueChange={setDoctorLanguage}>
                   <SelectTrigger className="w-full sm:w-[140px] border-blue-200 focus:ring-blue-200">
                     <SelectValue placeholder="Language" />
                   </SelectTrigger>
                   <SelectContent>
                     {languages.map((lang) => (
                       <SelectItem key={lang.value} value={lang.value}>
                         <div className="flex items-center gap-2">
                           <span>{lang.flag}</span>
                           <span>{lang.label}</span>
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>

                 <Button
                   className={cn(
                     "flex-1 gap-2 text-white shadow-md transition-all duration-300 hover:shadow-lg",
                     "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                     isRecordingDoctor && "animate-pulse-recording",
                   )}
                   onClick={() => handleRecording("doctor")}
                   disabled={isRecordingPatient} // Keep disabled logic
                 >
                   {isRecordingDoctor ? (
                     <>
                       <MicOff className="h-4 w-4" /> Stop
                     </>
                   ) : (
                     <>
                       <Mic className="h-4 w-4" /> Listen
                     </>
                   )}
                 </Button>
               </div>
             </div>
           </div>

           {/* Patient Controls */}
           <div className="p-4">
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
               <div className="flex items-center gap-2 text-emerald-700 font-medium">
                 <UserRound className="h-5 w-5" />
                 <span>Patient</span>
               </div>

               <div className="flex flex-1 gap-2 w-full sm:w-auto">
                 <Select value={patientLanguage} onValueChange={setPatientLanguage}>
                   <SelectTrigger className="w-full sm:w-[140px] border-emerald-200 focus:ring-emerald-200">
                     <SelectValue placeholder="Language" />
                   </SelectTrigger>
                   <SelectContent>
                     {languages.map((lang) => (
                       <SelectItem key={lang.value} value={lang.value}>
                         <div className="flex items-center gap-2">
                           <span>{lang.flag}</span>
                           <span>{lang.label}</span>
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>

                 <Button
                   className={cn(
                     "flex-1 gap-2 text-white shadow-md transition-all duration-300 hover:shadow-lg",
                     "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
                     isRecordingPatient && "animate-pulse-recording",
                   )}
                   onClick={() => handleRecording("patient")}
                   disabled={isRecordingDoctor} // Keep disabled logic
                 >
                   {isRecordingPatient ? (
                     <>
                       <MicOff className="h-4 w-4" /> Stop
                     </>
                   ) : (
                     <>
                       <Mic className="h-4 w-4" /> Listen
                     </>
                   )}
                 </Button>
               </div>
             </div>
           </div>
         </div>
       </CardFooter>
    </Card>
  );
} 