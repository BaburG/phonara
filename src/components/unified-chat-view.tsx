"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Loader2, MessageSquare, UserCog, UserRound, AlertCircle } from "lucide-react"
import { useTranslationStore } from "@/lib/translation-store"
import { cn } from "@/lib/utils"
import { transcribeAudioWithGemini, isGeminiConfigured } from "@/lib/gemini"
import { toast } from "@/hooks/use-toast"

const languages = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "zh", label: "Chinese", flag: "🇨🇳" },
  { value: "ar", label: "Arabic", flag: "🇸🇦" },
  { value: "ru", label: "Russian", flag: "🇷🇺" },
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
    console.log(`Translating text to ${to}: "${text}"`);
    
    // Create a prompt for Gemini to translate the text
    const prompt = `
    Translate the following text to ${getLanguageNameFromCode(to)}:

    "${text}"
    
    Please detect the source language automatically. Provide ONLY the translated text without any explanations, notes, or quotes. Do not include information about the source language or any additional commentary.
    `;
    
    // Use the same model-fetching logic as in transcribeAudioWithGemini
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const API_KEY = process.env.GOOGLE_AI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Try with the faster model first
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });
      
      console.log("Using Gemini 2.0 Flash model for translation");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text();
      
      console.log(`Translation result: "${translatedText}"`);
      return translatedText.trim();
    } catch (error) {
      console.warn("Gemini 2.0 Flash failed, trying Gemini 1.5 Pro for translation:", error);
      
      // Fallback to the more capable model
      const fallbackModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
      });
      
      const fallbackResult = await fallbackModel.generateContent(prompt);
      const fallbackResponse = await fallbackResult.response;
      const fallbackText = fallbackResponse.text();
      
      console.log(`Fallback translation result: "${fallbackText}"`);
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

export default function UnifiedChatView() {
  const [doctorLanguage, setDoctorLanguage] = useState("en")
  const [patientLanguage, setPatientLanguage] = useState("es")

  const [isRecordingDoctor, setIsRecordingDoctor] = useState(false)
  const [isRecordingPatient, setIsRecordingPatient] = useState(false)
  const [recordingText, setRecordingText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [activeRecordingRole, setActiveRecordingRole] = useState<"doctor" | "patient" | null>(null)
  
  // New states for real audio recording
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [geminiConfigured, setGeminiConfigured] = useState(false)
  
  // Added to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { conversations, addConversation } = useTranslationStore()

  // Initialize and check if Gemini is configured
  useEffect(() => {
    setGeminiConfigured(isGeminiConfigured())
  }, [])
  
  // Update the useEffect to also handle mounting state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use this separate useEffect for scroll behavior to avoid mixing concerns
  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversations.length, mounted])

  // Cleanup effect for MediaRecorder when component unmounts
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
        description: "Using simulated recording. Add GOOGLE_AI_API_KEY to your .env.local file for real transcription.",
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
          ja: "昨日から頭痛と熱があります。",
        },
      }

      const language = role === "doctor" ? doctorLanguage : patientLanguage

      // Use the sample text for the selected language, or fall back to English
      setRecordingText(sampleTexts[role][language as keyof (typeof sampleTexts)[typeof role]] || sampleTexts[role].en)
    }, 1500)
  }

  const stopRecording = async (role: "doctor" | "patient") => {
    console.log(`Stopping recording for ${role}...`);
    
    // Immediately update UI state to show recording is stopping
    if (role === "doctor") {
      setIsRecordingDoctor(false)
    } else {
      setIsRecordingPatient(false)
    }
    
    // Immediately clear the active recording role to update UI
    setActiveRecordingRole(null);

    // Handle real recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try {
        console.log("Stopping MediaRecorder...");
        setIsTranscribing(true);  // Show transcribing state immediately
        
        // Create a promise that will resolve when we get the final data
        const dataAvailablePromise = new Promise<void>((resolve) => {
          const originalDataAvailableHandler = mediaRecorder.ondataavailable;
          
          // Override the ondataavailable handler temporarily
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setAudioChunks((chunks) => [...chunks, event.data]);
            }
            
            // Restore original handler if there was one
            if (originalDataAvailableHandler) {
              // @ts-ignore - TypeScript doesn't like this assignment
              mediaRecorder.ondataavailable = originalDataAvailableHandler;
            }
            
            resolve();
          };
        });
        
        // Stop the recorder
        mediaRecorder.stop();
        
        // Stop the audio tracks to make sure microphone is released
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => {
            console.log("Stopping track:", track.kind, track.id);
            track.stop();
          });
        }
        
        // Wait for the final data
        await dataAvailablePromise;
        
        // Now process the recorded audio
        if (audioChunks.length > 0) {
          try {
            // Create a blob from the audio chunks
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            console.log(`Created audio blob of size: ${audioBlob.size} bytes`);
            
            // Convert to ArrayBuffer for Gemini API
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Transcribe using Gemini
            const transcription = await transcribeAudioWithGemini(arrayBuffer);
            console.log("Received transcription from Gemini:", transcription);
            
            // Parse the transcription (Handle the format returned by Gemini)
            const extractedResult = extractTranscription(transcription, role === "doctor" ? doctorLanguage : patientLanguage);
            console.log("Extracted text that will be set:", extractedResult.text);
            
            // Set the recordingText state with the transcribed text
            setRecordingText(extractedResult.text);
            
            // Important: Continue directly to translation if we have text
            if (extractedResult.text.trim()) {
              // Wait a short time to ensure the UI updates before proceeding
              setTimeout(() => {
                console.log("Processing extracted text for translation:", extractedResult.text);
                processTranslation(role, extractedResult.text, extractedResult.detectedLanguage);
              }, 500);
            }
          } catch (error) {
            console.error("Transcription error:", error);
            
            toast({
              title: "Transcription failed",
              description: "Could not transcribe audio. Falling back to simulation.",
              variant: "destructive",
            });
            
            // Fall back to simulated text
            simulateRecording(role);
          } finally {
            // Make sure we always update the UI state
            setIsTranscribing(false);
          }
        } else {
          console.log("No audio chunks recorded");
          setIsTranscribing(false);
        }
      } catch (error) {
        console.error("Error stopping recording:", error);
        // Make sure UI state is reset in case of error
        setIsTranscribing(false);
      }
    } else {
      // For simulation mode or if mediaRecorder isn't active
      
      // If we're in simulation mode, the recordingText should be set by simulateRecording
      // Wait for it to complete before proceeding with translation
      if (recordingText.trim()) {
        setTimeout(() => {
          processTranslation(role, recordingText);
        }, 500);
      }
    }
  }

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
    
    // If no language detected or simple format, just return the text with default language
    console.log("Using raw transcription as fallback with default language");
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
      "Japanese": "ja"
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

  // Create a separate function to handle the translation part
  const processTranslation = async (role: "doctor" | "patient", text: string, detectedLanguage?: string) => {
    if (!text || !text.trim()) {
      console.log("No text to translate, skipping translation")
      return
    }
    
    console.log("Starting translation for text:", text)
    setIsTranslating(true)

    // Get the other role and their language
    const otherRole = role === "doctor" ? "patient" : "doctor"
    // Use detected language if provided, otherwise use the selected language
    const fromLanguage = detectedLanguage || (role === "doctor" ? doctorLanguage : patientLanguage)
    const toLanguage = role === "doctor" ? patientLanguage : doctorLanguage

    // Use Gemini for actual translation
    const translatedText = await translateText(text, fromLanguage, toLanguage)

    // Add to conversation store
    addConversation({
      role,
      targetRole: otherRole,
      language: fromLanguage,
      original: text,
      translated: translatedText,
      timestamp: new Date().toLocaleTimeString(),
    })

    setRecordingText("")
    setIsTranslating(false)
    console.log("Translation completed and added to conversation")
  }

  // Skip rendering the dynamic parts if not mounted yet
  if (!mounted) {
    return (
      <Card className="overflow-hidden shadow-lg border-none bg-white">
        <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-200">
          <CardTitle className="flex justify-between items-center">
            <span className="text-slate-700">Translation Chat</span>
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
        <CardContent className="h-[50vh] overflow-y-auto p-6 space-y-4">
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">Loading conversation...</h3>
          </div>
        </CardContent>
        <CardFooter className="border-t p-0">
          {/* Simplified footer for server-rendered version */}
          <div className="w-full p-4">Loading controls...</div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden shadow-lg border-none bg-white">
      <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-200">
        <CardTitle className="flex justify-between items-center">
          <span className="text-slate-700">Translation Chat</span>
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

      <CardContent className="h-[50vh] overflow-y-auto p-6 space-y-4">
        {conversations.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="max-w-xs">Use the listening buttons below to start a conversation in any language.</p>
          </div>
        )}

        {conversations.map((message, index) => {
          const isDoctor = message.role === "doctor"

          return (
            <div
              key={index}
              className={cn(
                "message-bubble p-4 max-w-[85%] animate-in fade-in-50 duration-300",
                isDoctor ? "received mr-auto doctor-message" : "sent ml-auto patient-message",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium ${isDoctor ? "text-blue-100" : "text-emerald-100"}`}>
                  {isDoctor ? "Doctor" : "Patient"}
                </span>
                <span className="text-xs opacity-80">{message.timestamp}</span>
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
          )
        })}

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
            <p>Translating...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

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
                  disabled={isRecordingPatient}
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
                  disabled={isRecordingDoctor}
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
  )
} 