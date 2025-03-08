"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, MicOff, Loader2, Globe, MessageSquare } from "lucide-react"
import { useTranslationStore } from "@/lib/translation-store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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

interface TranslationChatProps {
  role: "doctor" | "patient"
}

export default function TranslationChat({ role }: TranslationChatProps) {
  const [language, setLanguage] = useState(role === "doctor" ? "en" : "es")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingText, setRecordingText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { conversations, addConversation } = useTranslationStore()

  // Filter messages relevant to this chat (sent or received)
  const relevantMessages = conversations.filter((msg) => msg.role === role || msg.targetRole === role)

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false)

      if (recordingText.trim()) {
        setIsTranslating(true)

        // Get the other role and their language
        const otherRole = role === "doctor" ? "patient" : "doctor"
        const otherLanguage =
          conversations.find((msg) => msg.role === otherRole)?.language || (otherRole === "doctor" ? "en" : "es")

        // Simulate translation
        const translatedText = await translateText(recordingText, language, otherLanguage)

        // Add to conversation store
        addConversation({
          role,
          targetRole: otherRole,
          language,
          original: recordingText,
          translated: translatedText,
          timestamp: new Date().toLocaleTimeString(),
        })

        setRecordingText("")
        setIsTranslating(false)
      }
    } else {
      setIsRecording(true)
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

        // Use the sample text for the selected language, or fall back to English
        setRecordingText(sampleTexts[role][language as keyof (typeof sampleTexts)[typeof role]] || sampleTexts[role].en)
      }, 1500)
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [relevantMessages.length])

  // Get the current language flag
  const currentLanguageFlag = languages.find((lang) => lang.value === language)?.flag || "🌐"

  return (
    <Card
      className={cn(
        "flex flex-col h-[70vh] overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border-none",
        role === "doctor"
          ? "bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800"
          : "bg-gradient-to-br from-white to-emerald-50 dark:from-slate-900 dark:to-slate-800",
      )}
    >
      <CardHeader
        className={cn(
          "pb-2 border-b",
          role === "doctor"
            ? "bg-gradient-to-r from-blue-500 to-blue-600"
            : "bg-gradient-to-r from-emerald-500 to-emerald-600",
        )}
      >
        <CardTitle className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <span>{role === "doctor" ? "Doctor" : "Patient"}</span>
            <Badge variant="outline" className="text-xs font-normal bg-white/20 text-white border-white/30">
              {currentLanguageFlag} {languages.find((lang) => lang.value === language)?.label}
            </Badge>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white focus:ring-white/30">
              <SelectValue placeholder="Select language" />
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
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {relevantMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No messages yet</h3>
            <p className="max-w-xs">Press the record button below to start a conversation.</p>
          </div>
        )}

        {relevantMessages.map((message, index) => {
          const isSender = message.role === role

          return (
            <div
              key={index}
              className={cn(
                "message-bubble p-3 max-w-[85%] animate-in fade-in-50 duration-300",
                isSender
                  ? "sent ml-auto bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                  : "received mr-auto bg-white dark:bg-slate-800 border shadow-sm",
              )}
            >
              <p>{isSender ? message.original : message.translated}</p>
              <div className="flex items-center gap-2 text-xs opacity-80 mt-2">
                <span>{message.timestamp}</span>
                {isSender ? (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" /> {languages.find((lang) => lang.value === message.language)?.label}
                  </span>
                ) : (
                  <span className="font-medium">{message.role === "doctor" ? "Doctor" : "Patient"}</span>
                )}
              </div>
            </div>
          )
        })}

        {isRecording && (
          <div className="message-bubble sent p-3 ml-auto bg-gradient-to-br from-blue-500 to-blue-600 text-white animate-pulse-recording">
            <p>{recordingText || "Recording..."}</p>
            <div className="flex items-center text-xs opacity-80 mt-2">
              <span className="mr-2">Recording</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
          </div>
        )}

        {isTranslating && (
          <div className="message-bubble received p-3 mr-auto bg-white dark:bg-slate-800 border shadow-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Translating...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="border-t p-4">
        <Button
          className={cn(
            "w-full gap-2 text-white shadow-md transition-all duration-300 hover:shadow-lg",
            role === "doctor"
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
            isRecording && "animate-pulse-recording",
          )}
          onClick={toggleRecording}
        >
          {isRecording ? (
            <>
              <MicOff className="h-4 w-4" /> Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" /> Start Recording
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 