"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Mic } from "lucide-react"
import UnifiedChatView from "@/components/unified-chat-view"
import Footer from "@/components/Footer"
import { ApiKeyWarning } from '@/components/ApiKeyWarning'
import { Recorder } from '@/components/Recorder';
import { TranscriptionDisplay } from '@/components/TranscriptionDisplay';
import { ApiKeyWarning } from '@/components/ApiKeyWarning';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="animated-bg bloom-gradient" />

      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center">
                <Mic className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-emerald-500">
                  Phonara
                </h1>
                <p className="text-sm text-muted-foreground">Medical Translation Assistant</p>
              </div>
            </div>
            <Link href="/transcript">
              <Button variant="outline" className="gap-2 transition-all hover:shadow-md">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">View Transcript</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <ApiKeyWarning />
          <UnifiedChatView />
        </div>
      </main>
      <Footer />
      <Analytics />
      <SpeedInsights />
    </div>
  )
}
