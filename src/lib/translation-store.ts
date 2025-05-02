"use client"

// Interface definition is likely still used elsewhere.
export interface ConversationMessage {
  role: "doctor" | "patient"
  targetRole: "doctor" | "patient"
  language: string
  original: string
  translated: string
  timestamp: string // Keep as ISO string as used in save API
}

// Remove all state management, localStorage logic, and the custom hook.
// MongoDB is now the source of truth, managed via API routes and local component state.

// Removed code included:
// - STORAGE_KEY constant
// - listeners Set
// - conversations array
// - localStorage loading logic
// - updateStore function (with localStorage saving)
// - useTranslationStore hook 