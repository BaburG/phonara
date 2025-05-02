import Link from 'next/link';
import { ChatSession } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns'; // For relative time
import { buttonVariants } from "./ui/button"; // Import button variants for styling
import { cn } from "@/lib/utils"; // Utility for class names
import { MessageSquare } from 'lucide-react';

interface ChatListProps {
  sessions: ChatSession[];
  activeSessionId?: string | null; // ID of the currently viewed chat
}

export function ChatList({ sessions, activeSessionId }: ChatListProps) {
  if (!sessions || sessions.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No chat history yet.</p>;
  }

  return (
    <nav className="flex flex-col gap-1 p-2">
      {sessions.map((session) => {
        const isActive = session._id === activeSessionId;
        return (
          <Link
            key={session._id}
            href={`/chat/${session._id}`}
            className={cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
              "justify-start gap-2 h-10 truncate"
            )}
          >
            <MessageSquare className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{session.title || 'Untitled Chat'}</span>
                <span className="text-xs text-muted-foreground truncate">
                    Updated {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
                </span>
            </div>

          </Link>
        );
      })}
    </nav>
  );
} 