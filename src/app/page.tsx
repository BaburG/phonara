"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Mic } from "lucide-react"
import UnifiedChatView from "@/components/unified-chat-view"
import Footer from "@/components/Footer"
import { ApiKeyWarning } from '@/components/ApiKeyWarning'
import Header from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="animated-bg bloom-gradient" />

      <Header />

      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <ApiKeyWarning />
          <UnifiedChatView />
        </div>
      </main>

      <Footer />
    </div>
  )
}
