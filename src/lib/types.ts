import { ConversationMessage } from './translation-store'; // Reuse base interface

// Interface for a chat session entry (metadata)
export interface ChatSession {
  _id: string; // MongoDB ObjectId as string
  userId: string; // ID of the user who owns the session
  title: string; // e.g., "Chat from May 1, 2025" or first message preview
  createdAt: Date;
  lastUpdatedAt: Date;
}

// Interface for a stored message, linked to a session
export interface StoredConversationMessage extends ConversationMessage {
   _id: string; // MongoDB ObjectId as string
   sessionId: string; // Link to the ChatSession _id
   userId: string; // Denormalize or verify ownership via session
   createdAt: Date;
}

// Interface for language configuration (for Phase 3)
 export interface LanguageConfig {
   _id?: string; // Optional MongoDB ID
   code: string;
   label: string;
   flag: string;
   isEnabled: boolean; // Control availability
 } 