"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useTranslationStore } from "@/lib/translation-store"
import { ArrowLeft, Download, FileText, Search, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Footer from "@/components/Footer"

export default function TranscriptPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { conversations } = useTranslationStore()
  const [showTranslations, setShowTranslations] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredConversations = searchTerm
    ? conversations.filter(
        (msg) =>
          msg.original.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.translated.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : conversations

  const exportToPDF = () => {
    // In a real implementation, we would generate a PDF here
    // For this demo, we'll just show a toast
    toast({
      title: "PDF Export Started",
      description: "Your transcript is being exported as a PDF.",
      duration: 3000,
    })

    // Simulate PDF generation completion
    setTimeout(() => {
      toast({
        title: "PDF Export Complete",
        description: "Your transcript has been exported successfully.",
        duration: 3000,
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bloom-gradient flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className="h-10 w-10 rounded-full hover:bg-blue-50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-emerald-500">
                    Transcript
                  </h1>
                  <p className="text-sm text-muted-foreground">Complete conversation history</p>
                </div>
              </div>
            </div>
            <Button
              onClick={exportToPDF}
              className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Download className="mr-2 h-4 w-4" /> Export PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4">
        <Card className="mb-6 overflow-hidden border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-4">
            <CardTitle className="text-lg font-medium">Transcript Controls</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-translations"
                  checked={showTranslations}
                  onCheckedChange={setShowTranslations}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="show-translations" className="font-medium">
                  Show translations
                </Label>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transcript..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-4 flex flex-row justify-between items-center">
            <CardTitle className="text-lg font-medium">Conversation</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredConversations.length > 0 ? (
              <div className="divide-y">
                {filteredConversations.map((message, index) => (
                  <div key={index} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-16 sm:w-24 flex-shrink-0 font-medium ${
                          message.role === "doctor" ? "text-blue-600" : "text-emerald-600"
                        }`}
                      >
                        {message.role === "doctor" ? "Doctor" : "Patient"}
                      </div>
                      <div className="flex-1">
                        <p className="mb-1">{message.original}</p>
                        {showTranslations && message.translated && (
                          <p className="text-sm text-muted-foreground italic mt-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-md border-l-2 border-blue-500">
                            {message.translated}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground w-20 text-right">{message.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No conversation history</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchTerm
                    ? "No results match your search. Try different keywords."
                    : "Start a conversation to see the transcript."}
                </p>
                {searchTerm && (
                  <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
} 