'use client';

import { useParams } from 'next/navigation';
import UnifiedChatView from '@/components/unified-chat-view'; // Import the component

// This page component primarily acts as a wrapper to extract the session ID
// from the URL and pass it down to the actual chat view component.
export default function ChatSessionPage() {
    const params = useParams();
    
    // Extract sessionId, ensuring it's a string or null
    const sessionId = typeof params.sessionId === 'string' ? params.sessionId : null;

    // Render the UnifiedChatView, passing the sessionId
    // UnifiedChatView will handle fetching data and displaying the UI based on the ID
    return (
        <UnifiedChatView sessionId={sessionId} />
    );
} 