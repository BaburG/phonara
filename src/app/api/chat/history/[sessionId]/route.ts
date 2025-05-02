import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getChatMessagesCollection, getChatSessionsCollection } from '@/lib/mongodb';
import { StoredConversationMessage } from '@/lib/types';
import { ObjectId } from 'mongodb'; // Re-import ObjectId

// Define params type - Note: The type definition might need adjustment
// if `params` itself is now a Promise, but let's try awaiting first.
// interface RouteParams { 
//   // params: Promise<{ sessionId: string }>; // Potential future type?
//   params: { sessionId: string };
// }

// Updated GET function signature - params is now a Promise
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ sessionId: string }> }
) {
  
  // Await the params Promise to resolve before accessing properties
  const { sessionId } = await params; // Destructure after awaiting

  // Now perform other async operations
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // --- Add Logging --- 
  // console.log(`[API History GET] Session ID from params: ${sessionId}`);
  // console.log(`[API History GET] User ID from session: ${userId}`);
  // ------------------

  if (!userId) {
    // console.log('[API History GET] Unauthorized - No User ID');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use the locally stored sessionId
  if (!sessionId) { 
    // console.log('[API History GET] Bad Request - No Session ID');
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // --- Add ObjectId Validation --- 
  if (!ObjectId.isValid(sessionId)) {
      // console.log(`[API History GET] Bad Request - Invalid Session ID format: ${sessionId}`);
      return NextResponse.json({ error: 'Invalid Session ID format' }, { status: 400 });
  }
  // -----------------------------

  try {
    // 1. Verify the session belongs to the user
    const sessionsCollection = await getChatSessionsCollection();
    // Use the locally stored sessionId in the query
    
    // --- Convert to ObjectId and use type assertion for the query --- 
    const querySessionIdObject = new ObjectId(sessionId);
    const filter = { 
      _id: querySessionIdObject, // Use the ObjectId
      userId: userId
    };
    // console.log(`[API History GET] Querying chatSessions collection with ObjectId:`, filter);
    
    // Use "as any" to bypass strict type checking for this specific query
    const chatSession = await sessionsCollection.findOne(filter as any); 
    // -------------------------------------------------------------------

    if (!chatSession) {
      // --- Add Logging --- 
      // console.log(`[API History GET] Session not found or userId mismatch for query:`, filter);
      // ------------------
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // --- Add Logging --- 
    // console.log(`[API History GET] Session found. Fetching messages for sessionId: ${sessionId}`);
    // ------------------

    // 2. Fetch messages for the validated session
    const messagesCollection = await getChatMessagesCollection();
    // Use the locally stored sessionId in the query
    const messages = await messagesCollection
      .find({ sessionId: sessionId }) 
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(messages);

  } catch (error) {
    // Use the locally stored sessionId in the error log
    // console.error(`[API History GET] Error fetching chat history for session ${sessionId}:`, error); 
    // Handle potential ObjectId conversion errors
    if (error instanceof Error && error.message.includes('Argument passed in must be a string of 12 bytes or a string of 24 hex characters')) {
        return NextResponse.json({ error: 'Invalid Session ID format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
} 