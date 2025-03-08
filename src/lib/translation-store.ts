"use client"

import { useState, useEffect } from "react"

export interface ConversationMessage {
  role: "doctor" | "patient"
  targetRole: "doctor" | "patient"
  language: string
  original: string
  translated: string
  timestamp: string
}

// Create a simple store with event emitter pattern
const STORAGE_KEY = "phonara-conversations"

// Event system for store updates
type Listener = () => void
const listeners: Set<Listener> = new Set()

// Initial state
let conversations: ConversationMessage[] = []

// Try to load from localStorage on initialization
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      conversations = JSON.parse(saved)
    }
  } catch (e) {
    console.error("Failed to load conversations from localStorage", e)
  }
}

// Save to localStorage and notify listeners
const updateStore = (newConversations: ConversationMessage[]) => {
  conversations = newConversations

  // Save to localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    } catch (e) {
      console.error("Failed to save conversations to localStorage", e)
    }
  }

  // Notify all listeners
  listeners.forEach((listener) => listener())
}

// Custom hook to replace Zustand
export function useTranslationStore() {
  const [state, setState] = useState<ConversationMessage[]>(conversations)

  // Subscribe to store changes
  useEffect(() => {
    // Create listener function
    const handleChange = () => {
      setState([...conversations]) // Create new array reference to trigger re-render
    }

    // Add listener
    listeners.add(handleChange)

    // Initial state sync
    handleChange()

    // Cleanup: remove listener on unmount
    return () => {
      listeners.delete(handleChange)
    }
  }, [])

  // Add a conversation
  const addConversation = (message: ConversationMessage) => {
    updateStore([...conversations, message])
  }

  // Clear all conversations
  const clearConversations = () => {
    updateStore([])
  }

  return {
    conversations: state,
    addConversation,
    clearConversations,
  }
} 