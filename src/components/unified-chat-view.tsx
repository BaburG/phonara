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

// Helper function to get language name from code (remains client-side for UI)
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
  const [recordingText, setRecordingText] = useState("") // Used for displaying interim text
  const [isProcessingAudio, setIsProcessingAudio] = useState(false) // Combined transcribing/translating state
  const [activeRecordingRole, setActiveRecordingRole] = useState<"doctor" | "patient" | null>(null)
  
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  // audioChunks is now handled within stopRecording
  
  // State for managing fetched messages
  const [messages, setMessages] = useState<StoredConversationMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Effects ---
  
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
      setMessages([]) 
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
  }, [sessionId]) 

  // Scroll to bottom when new messages are added or history loads
  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length, mounted]) 

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

  // --- Recording & Processing Logic --- 

  // Define helper functions first
  const getLanguageCodeFromName = useCallback((languageName: string): string => {
      const languageMap: Record<string, string> = {
        "English": "en", "Spanish": "es", "French": "fr", "German": "de", 
        "Chinese": "zh", "Arabic": "ar", "Russian": "ru", "Japanese": "ja", "Turkish": "tr",
      };
      const cleanName = languageName.trim().toLowerCase();
      for (const [name, code] of Object.entries(languageMap)) {
        if (cleanName.includes(name.toLowerCase())) return code;
      }
      return "en";
  }, []);

  const extractTranscription = useCallback((transcription: string, language: string): { text: string; detectedLanguage: string } => {
     console.log("Raw transcription from backend:", transcription);
     // ... (keep existing extraction logic) ...
    if (transcription.includes("Language:")) {
      const lines = transcription.split('\n').filter(line => !!line.trim());
      console.log("Parsed transcription lines:", lines);
      const languageLine = lines[0];
      const detectedLanguageName = languageLine.replace("Language:", "").trim();
      const detectedLanguageCode = getLanguageCodeFromName(detectedLanguageName);
      console.log(`Detected language: ${detectedLanguageName} (${detectedLanguageCode})`);
      if (lines.length >= 2) {
        const transcribedText = lines[1].replace(/^"/, '').replace(/"$/, '').trim();
        console.log("Extracted transcribed text:", transcribedText);
        return { text: transcribedText, detectedLanguage: detectedLanguageCode };
      }
    }
    console.log("Transcription format unexpected, attempting fallback extraction.");
    const originalMarker = "**Original:** ";
    const originalIndex = transcription.indexOf(originalMarker);
    if (originalIndex !== -1) {
      const englishMarker = "**English:**";
      const englishIndex = transcription.indexOf(englishMarker, originalIndex);
      let extractedText = "";
      if (englishIndex !== -1) {
        extractedText = transcription.substring(originalIndex + originalMarker.length, englishIndex).trim();
      } else {
        extractedText = transcription.substring(originalIndex + originalMarker.length).trim();
      }
      extractedText = extractedText.replace(/^"/, '').replace(/"$/, '').trim(); 
      console.log("Extracted text using fallback marker:", extractedText);
      return { text: extractedText, detectedLanguage: language };
    }
    console.log("Fallback marker not found, using raw transcription.");
    return { text: transcription.trim(), detectedLanguage: language };
  }, [getLanguageCodeFromName]); // Add dependency

  const processTranslation = useCallback(async (role: "doctor" | "patient", text: string, detectedLanguage?: string) => {
    if (!text || !text.trim() || !sessionId) {
      console.log("No text/session ID, skipping translation/saving");
      setIsProcessingAudio(false); // Ensure processing state is reset
      setRecordingText(""); 
      return;
    }
    
    console.log(`Starting translation/saving for session ${sessionId}, text:`, text);
    // Processing indicator is already active from stopRecording
    setRecordingText("Translating..."); // Update indicator text

    const otherRole = role === "doctor" ? "patient" : "doctor";
    const fromLanguage = detectedLanguage || (role === "doctor" ? doctorLanguage : patientLanguage);
    const toLanguage = role === "doctor" ? patientLanguage : doctorLanguage;

    try {
      // --- Call Backend API for Translation ---
       console.log(`Sending text to /api/translate: ${text.substring(0,50)}...`);
       const translateResponse = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, sourceLanguage: fromLanguage, targetLanguage: toLanguage }),
       });

       if (!translateResponse.ok) {
           const errorData = await translateResponse.json().catch(() => ({}));
           throw new Error(errorData.error || `Translation API failed: ${translateResponse.statusText}`);
       }
       const { translatedText } = await translateResponse.json();
       console.log("Received translated text from backend:", translatedText);
      // ---------------------------------------

      const messagePayload: ConversationMessage = {
      role,
      targetRole: otherRole,
      language: fromLanguage,
      original: text,
      translated: translatedText,
        timestamp: new Date().toISOString(), 
      };

      // Optimistic Update
      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: StoredConversationMessage = {
          ...messagePayload,
          _id: tempId, 
          sessionId: sessionId,
          userId: 'optimistic-user', 
          createdAt: new Date(), 
      };
      setMessages(prev => [...prev, optimisticMessage]);
      setRecordingText("Saving..."); // Update indicator

      // Save to API
      console.log("Sending message to /api/chat/save:", messagePayload);
      const saveResponse = await fetch('/api/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messagePayload, sessionId }),
      });

      if (!saveResponse.ok) {
        setMessages(prev => prev.filter(msg => msg._id !== tempId)); // Rollback
        const errorData = await saveResponse.json().catch(() => ({ error: 'Failed to save message' }));
        throw new Error(errorData.error || `Failed to save message: ${saveResponse.statusText}`);
      }

      const savedMessage: StoredConversationMessage = await saveResponse.json();
      console.log("Message saved successfully:", savedMessage);
      setMessages(prev => prev.map(msg => msg._id === tempId ? savedMessage : msg)); // Update with real data

    } catch (error: any) {
        console.error("Error during translation or saving:", error);
        toast({ title: "Error Processing Message", description: error.message, variant: "destructive" });
        // Attempt rollback just in case it failed before save call
        setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp_'))); 
    } finally {
        setIsProcessingAudio(false); // Indicate all processing finished
        setRecordingText(""); // Clear indicator text
    }
  }, [sessionId, doctorLanguage, patientLanguage]);

  // Now define stopRecording, which uses the above functions
  const stopRecording = useCallback(async (role: "doctor" | "patient") => {
    console.log(`Stopping recording for ${role}...`);
    
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      console.warn('Stop recording called but recorder was not active.');
      // Reset UI just in case
      if (role === "doctor") setIsRecordingDoctor(false);
      else setIsRecordingPatient(false);
      setActiveRecordingRole(null);
      return;
    }

    // Immediately update UI state
    if (role === "doctor") setIsRecordingDoctor(false);
    else setIsRecordingPatient(false);
    setActiveRecordingRole(null); 
    setIsProcessingAudio(true); // Show processing indicator
    setRecordingText("Processing audio...") // Indicate processing step

    // Wrap recorder stop logic in a promise to get the blob
    const blob = await new Promise<Blob | null>((resolve) => {
        let recordedChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
            console.log("MediaRecorder stopped event triggered");
            const audioBlob = recordedChunks.length > 0 ? new Blob(recordedChunks, { type: 'audio/webm' }) : null;
            mediaRecorder.stream?.getTracks().forEach(track => track.stop());
            resolve(audioBlob);
        };
        // Check state before stopping again
        if (mediaRecorder.state === 'recording') {
           mediaRecorder.stop();
        }
    });

    if (blob) {
      try {
        console.log(`Created audio blob of size: ${blob.size} bytes`);
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        const base64Audio = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
                const base64Data = reader.result as string;
                // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
                resolve(base64Data.split(',', 2)[1]); 
            };
            reader.onerror = (error) => reject(error);
        });

        console.log(`Sending Base64 audio (length: ${base64Audio.length}) to /api/transcribe`);
        // --- Call Backend API for Transcription ---
        const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioData: base64Audio }),
        });

        if (!transcribeResponse.ok) {
            const errorData = await transcribeResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Transcription API failed: ${transcribeResponse.statusText}`);
        }

        const { transcription } = await transcribeResponse.json();
        console.log("Received transcription from backend:", transcription);
        // ------------------------------------------

        // Call useCallback version
        const { text, detectedLanguage } = extractTranscription(transcription, role === "doctor" ? doctorLanguage : patientLanguage);
        console.log("Extracted text:", text);
        setRecordingText(text); // Update UI temporarily

        if (text.trim()) {
          // Call useCallback version
          await processTranslation(role, text, detectedLanguage); 
        }
      } catch (error: any) {
        console.error("Transcription or processing error:", error);
        toast({ title: "Audio Processing Failed", description: error.message || "Could not process audio.", variant: "destructive" });
      } finally {
        setIsProcessingAudio(false);
        setRecordingText(""); // Clear processing text
      }
    } else {
      console.log("No audio blob created after stopping.");
      setIsProcessingAudio(false);
      setRecordingText(""); // Clear processing text
    }
  }, [mediaRecorder, doctorLanguage, patientLanguage, extractTranscription, processTranslation]); 

  const handleRecording = (role: "doctor" | "patient") => {
    if (role === "doctor") {
      if (isRecordingDoctor) stopRecording(role);
      else startRecording(role);
    } else {
      if (isRecordingPatient) stopRecording(role);
      else startRecording(role);
    }
  }

  const startRecording = async (role: "doctor" | "patient") => {
    if (isRecordingDoctor || isRecordingPatient) return; // Prevent simultaneous recording

    setActiveRecordingRole(role)
    if (role === "doctor") setIsRecordingDoctor(true);
    else setIsRecordingPatient(true);
    setRecordingText("") // Clear any previous temp text

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }) // Specify mimeType
      setMediaRecorder(recorder)
      
      // Start immediately, collect chunks in stopRecording
      recorder.start()
      
      toast({
        title: "Listening started",
        description: `Now listening to ${role}. Stop when finished.`,
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({ title: "Recording failed", description: "Could not access microphone.", variant: "destructive" })
      if (role === "doctor") setIsRecordingDoctor(false);
      else setIsRecordingPatient(false);
      setActiveRecordingRole(null);
    }
  }

  // --- Rendering ---

  if (!mounted) {
    // Static skeleton
    return (
      <Card className="overflow-hidden shadow-lg border-none bg-white">
         <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-200"><CardTitle>Loading Chat...</CardTitle></CardHeader>
         <CardContent className="h-[50vh] overflow-y-auto p-6">
            <div className="space-y-3">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-3/4 ml-auto" />
                <Skeleton className="h-16 w-3/4" />
          </div>
        </CardContent>
         <CardFooter className="border-t p-0"><div className="w-full p-4">Loading controls...</div></CardFooter>
      </Card>
    );
  }

  if (!sessionId) {
     // Prompt to select a chat
     return (
       <Card className="overflow-hidden shadow-lg border-none bg-white flex flex-col h-full">
          <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-200"><CardTitle className="text-slate-700">Translation Chat</CardTitle></CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
             <div className="text-center text-muted-foreground"><MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Please select a chat or start a new one.</p></div>
          </CardContent>
          <CardFooter className="border-t p-4 text-center text-sm text-muted-foreground">Controls disabled.</CardFooter>
       </Card>
     );
  }

  // Main component render
  return (
    <Card className="overflow-hidden shadow-lg border-none bg-white flex flex-col h-full">
      {/* Header */} 
      <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-emerald-50 border-slate-200">
        <CardTitle className="flex justify-between items-center">
           <span className="text-slate-700">Chat ({sessionId.substring(0,6)}...)</span>
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Dr: {languages.find((l) => l.value === doctorLanguage)?.flag}</Badge>
             <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Pt: {languages.find((l) => l.value === patientLanguage)?.flag}</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      {/* Message display area */} 
      <CardContent className="flex-1 h-[50vh] overflow-y-auto p-6 space-y-4">
        {/* Loading State */}
        {isLoadingHistory && (
            <div className="space-y-3">
                <Skeleton className="h-16 w-3/4" /><Skeleton className="h-16 w-3/4 ml-auto" /><Skeleton className="h-16 w-3/4" />
            </div>
        )}
        {/* Error State */}
        {fetchError && !isLoadingHistory && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-destructive">
                <AlertCircle className="h-12 w-12 mb-4 opacity-50" /><h3 className="text-lg font-medium mb-2">Error Loading Chat</h3><p className="max-w-xs">{fetchError}</p>
            </div>
        )}
        {/* Empty State */}
        {!isLoadingHistory && !fetchError && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" /><h3 className="text-lg font-medium mb-2">No messages yet</h3><p className="max-w-xs">Use listening buttons below.</p>
          </div>
        )}
        {/* Message List */}
        {!isLoadingHistory && !fetchError && messages.map((message) => { 
          const isDoctor = message.role === "doctor";
          return (
            <div key={message._id} className={cn("message-bubble p-4 max-w-[85%] animate-in fade-in-50 duration-300", isDoctor ? "received mr-auto doctor-message" : "sent ml-auto patient-message", message._id.startsWith('temp_') ? 'opacity-70' : '' )}>
              <div className="flex items-center gap-2 mb-1">
                 <span className={`font-medium ${isDoctor ? "text-blue-100" : "text-emerald-100"}`}>{isDoctor ? "Doctor" : "Patient"}</span>
                 <span className="text-xs opacity-80">{new Date(message.createdAt || message.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="space-y-3">
                 <div><p className="font-medium text-sm opacity-80">Original ({getLanguageNameFromCode(message.language)}):</p><p>{message.original}</p></div>
                 <div className={`p-2 rounded-md ${isDoctor ? "bg-blue-600/20" : "bg-emerald-600/20"}`}><p className="font-medium text-sm opacity-80">Translation ({getLanguageNameFromCode(isDoctor ? patientLanguage : doctorLanguage)}):</p><p>{message.translated}</p></div>
              </div>
            </div>
          );
        })}
        {/* Recording/Processing Indicator */}
         {(isRecordingDoctor || isRecordingPatient || isProcessingAudio) && (
          <div className={`message-bubble p-4 ${ isProcessingAudio ? 'mx-auto bg-muted text-muted-foreground' : (activeRecordingRole === "doctor" ? "received mr-auto doctor-message" : "sent ml-auto patient-message") }`}>
            <div className="flex items-center gap-2 mb-1">
               <span className={`font-medium ${isProcessingAudio ? '' : (activeRecordingRole === "doctor" ? "text-blue-100" : "text-emerald-100") }`}>
                   {isProcessingAudio ? 'System' : (activeRecordingRole === "doctor" ? "Doctor" : "Patient")}</span>
               {(isRecordingDoctor || isRecordingPatient) && !isProcessingAudio && (
              <div className="flex items-center text-xs opacity-80">
                     <span className="mr-2">Listening</span>
                     <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
          </div>
        )}
                {isProcessingAudio && <Loader2 className="h-4 w-4 animate-spin" />}
             </div>
             <p>{recordingText || (isRecordingDoctor || isRecordingPatient ? "Listening..." : "Processing...")}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Footer Controls */} 
      <CardFooter className="border-t p-0">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          {/* Doctor Controls */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
               <div className="flex items-center gap-2 text-blue-700 font-medium"><UserCog className="h-5 w-5" /><span>Doctor</span></div>
              <div className="flex flex-1 gap-2 w-full sm:w-auto">
                 <Select value={doctorLanguage} onValueChange={setDoctorLanguage} disabled={isProcessingAudio || isRecordingDoctor || isRecordingPatient}>
                   <SelectTrigger className="w-full sm:w-[140px] border-blue-200 focus:ring-blue-200"><SelectValue placeholder="Lang" /></SelectTrigger>
                   <SelectContent>{languages.map((l) => (<SelectItem key={l.value} value={l.value}><div className="flex items-center gap-2"><span>{l.flag}</span><span>{l.label}</span></div></SelectItem>))}</SelectContent>
                </Select>
                 <Button className={cn("flex-1 gap-2", "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700", isRecordingDoctor && "animate-pulse-recording")} onClick={() => handleRecording("doctor")} disabled={isProcessingAudio || isRecordingPatient}>{isRecordingDoctor ? (<><MicOff className="h-4 w-4" /> Stop</>) : (<><Mic className="h-4 w-4" /> Listen</>)}</Button>
              </div>
            </div>
          </div>
          {/* Patient Controls */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
               <div className="flex items-center gap-2 text-emerald-700 font-medium"><UserRound className="h-5 w-5" /><span>Patient</span></div>
              <div className="flex flex-1 gap-2 w-full sm:w-auto">
                 <Select value={patientLanguage} onValueChange={setPatientLanguage} disabled={isProcessingAudio || isRecordingDoctor || isRecordingPatient}>
                   <SelectTrigger className="w-full sm:w-[140px] border-emerald-200 focus:ring-emerald-200"><SelectValue placeholder="Lang" /></SelectTrigger>
                   <SelectContent>{languages.map((l) => (<SelectItem key={l.value} value={l.value}><div className="flex items-center gap-2"><span>{l.flag}</span><span>{l.label}</span></div></SelectItem>))}</SelectContent>
                </Select>
                 <Button className={cn("flex-1 gap-2", "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700", isRecordingPatient && "animate-pulse-recording")} onClick={() => handleRecording("patient")} disabled={isProcessingAudio || isRecordingDoctor}>{isRecordingPatient ? (<><MicOff className="h-4 w-4" /> Stop</>) : (<><Mic className="h-4 w-4" /> Listen</>)}</Button>
              </div>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
} 