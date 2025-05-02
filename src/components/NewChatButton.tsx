'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "./ui/button"; // Assuming shadcn/ui Button
import { PlusCircle } from 'lucide-react';
import { ChatSession } from '@/lib/types'; // Import type

export function NewChatButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create new chat session');
      }

      const newSession: ChatSession = await response.json();
      // Navigate to the new chat session page
      router.push(`/chat/${newSession._id}`);
      // Optionally refresh router or trigger state update if needed
      router.refresh(); 

    } catch (error) {
      console.error("Error creating new chat:", error);
      // TODO: Show error feedback to user (e.g., toast notification)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleNewChat} 
      disabled={isLoading}
      className="w-full justify-start gap-2"
    >
      <PlusCircle className="h-4 w-4" />
      {isLoading ? 'Creating...' : 'New Chat'}
    </Button>
  );
} 