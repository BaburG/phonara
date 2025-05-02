// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { FileText, Mic } from "lucide-react"
// import UnifiedChatView from "@/components/unified-chat-view"
// import Footer from "@/components/Footer"
// import { ApiKeyWarning } from '@/components/ApiKeyWarning'
// import Header from '@/components/Header'
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getChatSessionsCollection } from '@/lib/mongodb';

// This is the ROOT page (e.g., accessed via "/")
// It is now a Server Component
export default async function RootPage() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        // Not logged in, redirect to NextAuth sign-in page
        redirect('/api/auth/signin');
    }

    // Logged in, try to find the latest session
    let latestSessionId: string | null = null;
    try {
        const sessionsCollection = await getChatSessionsCollection();
        const latestSession = await sessionsCollection.findOne(
            { userId: userId },
            { sort: { lastUpdatedAt: -1 } } // Get the most recently updated
        );
        if (latestSession) {
            latestSessionId = latestSession._id.toString();
        }
    } catch (error) {
        console.error("Error fetching latest session from root page:", error);
        // Don't redirect to chat on error, fall through to welcome redirect
    }

    if (latestSessionId) {
        // Found a session, redirect to the chat page (which is inside (app))
        redirect(`/chat/${latestSessionId}`);
    } else {
        // No sessions found, redirect to the welcome page (which is inside (app))
        redirect('/welcome');
    }

    // This part should technically not be reached due to redirects
    // return null; 
}
