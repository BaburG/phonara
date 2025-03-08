"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Loader2, MessageSquare, UserCog, UserRound } from "lucide-react"
import { useTranslationStore } from "@/lib/translation-store"
import { cn } from "@/lib/utils"

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

// Mock translation function (in a real app, this would call a translation API)
const translateText = async (text: string, from: string, to: string) => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simple mock translation - in a real app, this would use a translation service
  return `[Translated from ${from} to ${to}]: ${text}`
}

export default function UnifiedChatView() {
  const [doctorLanguage, setDoctorLanguage] = useState("en")
  const [patientLanguage, setPatientLanguage] = useState("es")

  const [isRecordingDoctor, setIsRecordingDoctor] = useState(false)
  const [isRecordingPatient, setIsRecordingPatient] = useState(false)
  const [recordingText, setRecordingText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [activeRecordingRole, setActiveRecordingRole] = useState<"doctor" | "patient" | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { conversations, addConversation } = useTranslationStore()

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

  const startRecording = (role: "doctor" | "patient") => {
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

    // In a real app, we would start recording audio here
    // For this demo, we'll simulate typing after a delay
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
    if (role === "doctor") {
      setIsRecordingDoctor(false)
    } else {
      setIsRecordingPatient(false)
    }

    setActiveRecordingRole(null)

    if (recordingText.trim()) {
      setIsTranslating(true)

      // Get the other role and their language
      const otherRole = role === "doctor" ? "patient" : "doctor"
      const fromLanguage = role === "doctor" ? doctorLanguage : patientLanguage
      const toLanguage = role === "doctor" ? patientLanguage : doctorLanguage

      // Simulate translation
      const translatedText = await translateText(recordingText, fromLanguage, toLanguage)

      // Add to conversation store
      addConversation({
        role,
        targetRole: otherRole,
        language: fromLanguage,
        original: recordingText,
        translated: translatedText,
        timestamp: new Date().toLocaleTimeString(),
      })

      setRecordingText("")
      setIsTranslating(false)
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversations.length])

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
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[50vh] overflow-y-auto p-6 space-y-4">
        {conversations.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="max-w-xs">Use the recording buttons below to start a conversation.</p>
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
                    Original ({languages.find((lang) => lang.value === message.language)?.label}):
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

        {activeRecordingRole && (
          <div
            className={`message-bubble p-4 animate-pulse-recording ${
              activeRecordingRole === "doctor" ? "received mr-auto doctor-message" : "sent ml-auto patient-message"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-medium ${activeRecordingRole === "doctor" ? "text-blue-100" : "text-emerald-100"}`}
              >
                {activeRecordingRole === "doctor" ? "Doctor" : "Patient"}
              </span>
              <div className="flex items-center text-xs opacity-80">
                <span className="mr-2">Recording</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
            </div>
            <p>{recordingText || "Recording..."}</p>
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
                      <Mic className="h-4 w-4" /> Record
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
                      <Mic className="h-4 w-4" /> Record
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