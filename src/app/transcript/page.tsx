import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link'; // For linking sessions
import { ArrowLeft, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/authOptions';
import { getChatSessionsCollection } from '@/lib/mongodb';
import { ChatSession } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

// This is now a Server Component
export default async function TranscriptPage() {
    const authSession = await getServerSession(authOptions);
    const userId = authSession?.user?.id;

    if (!userId) {
        redirect('/api/auth/signin');
    }

    let sessions: ChatSession[] = [];
    let fetchError: string | null = null;

    try {
        const sessionsCollection = await getChatSessionsCollection();
        sessions = await sessionsCollection
            .find({ userId: userId })
            .sort({ lastUpdatedAt: -1 })
            .toArray();
        
        // Convert ObjectIds to strings if needed for the component (though ChatSession type already defines _id as string)
        // sessions = sessions.map(s => ({ ...s, _id: s._id.toString() }));

    } catch (error: any) {
        console.error("Error fetching sessions for transcript page:", error);
        fetchError = "Failed to load session history.";
    }

    return (
        <div className="min-h-screen flex flex-col bg-muted/50">
             {/* Simplified Header - can use AppLayout's header if moved to (app) group */}
             <header className="sticky top-0 z-10 bg-background border-b">
                 <div className="container mx-auto py-4">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                             <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-full">
                                 <Link href="/"><ArrowLeft className="h-5 w-5" /></Link>
                             </Button>
                             <h1 className="text-xl font-semibold">Session History</h1>
                         </div>
                         {/* Removed PDF Export Button */}
                     </div>
                 </div>
             </header>

            <main className="flex-1 container mx-auto py-6 px-4">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Your Conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {fetchError && (
                            <p className="text-center text-destructive py-8">{fetchError}</p>
                        )}
                        {!fetchError && sessions.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No chat sessions found.</p>
                            </div>
                        )}
                        {!fetchError && sessions.length > 0 && (
                            <ul className="divide-y">
                                {sessions.map((session) => (
                                    <li key={session._id} className="py-3">
                                        <Link href={`/chat/${session._id}`} className="flex justify-between items-center hover:bg-accent/50 p-2 rounded-md">
                                            <div>
                                                <p className="font-medium truncate">{session.title || 'Untitled Chat'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Last updated: {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {/* Optional: Add an indicator or chevron */}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </main>
            {/* Consider removing Footer if using AppLayout */}
            {/* <Footer /> */}
        </div>
    );
} 