'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // To get current session ID from URL
import { ChatSession } from '@/lib/types';
import { ChatList } from './ChatList';
import { NewChatButton } from './NewChatButton';
import { Skeleton } from "@/components/ui/skeleton"; // Corrected path for shadcn/ui

export function Sidebar() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the current session ID from the URL parameters
  const params = useParams();
  const activeSessionId = typeof params.sessionId === 'string' ? params.sessionId : null;

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/chat/sessions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ChatSession[] = await response.json();
        setSessions(data);
      } catch (err: any) {
        console.error("Failed to fetch chat sessions:", err);
        setError(err.message || 'Failed to load chat history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []); // Fetch on initial mount

  // Consider adding a dependency on something that changes when a new session is created
  // or using router.refresh() in NewChatButton to trigger data refetch if needed.

  return (
    <div className="flex flex-col h-full bg-muted/50 border-r">
        <div className="p-2 border-b">
             <NewChatButton />
        </div>
        <div className="flex-1 overflow-y-auto">
            {isLoading && (
                <div className="p-2 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            )}
            {error && <p className="p-4 text-sm text-destructive">Error: {error}</p>}
            {!isLoading && !error && (
                <ChatList sessions={sessions} activeSessionId={activeSessionId} />
            )}
        </div>
       {/* Optional Footer */}
       {/* <div className="mt-auto p-2 border-t">
            <p className="text-xs text-muted-foreground">User Info / Settings</p>
       </div> */}
    </div>
  );
} 