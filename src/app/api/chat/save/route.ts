import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getChatMessagesCollection, getChatSessionsCollection } from '@/lib/mongodb';
import { ConversationMessage } from '@/lib/translation-store';
import { StoredConversationMessage } from '@/lib/types';
import { ObjectId } from 'mongodb'; // Import ObjectId for querying and validation

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, sessionId }: { message: ConversationMessage, sessionId: string } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message payload and sessionId are required' }, { status: 400 });
    }

    // --- Add ObjectId Validation --- 
    if (!ObjectId.isValid(sessionId)) {
        // console.log(`[API Save] Bad Request - Invalid Session ID format: ${sessionId}`);
        return NextResponse.json({ error: 'Invalid Session ID format' }, { status: 400 });
    }
    // -----------------------------

    const messagesCollection = await getChatMessagesCollection();
    const sessionsCollection = await getChatSessionsCollection();
    const now = new Date();

    // --- 1. Verify session using ObjectId query --- 
    const querySessionIdObject = new ObjectId(sessionId);
    const filter = { 
      _id: querySessionIdObject, // Use ObjectId
      userId: userId
    };
    // console.log(`[API Save] Verifying session existence with query:`, filter);
    // Use "as any" to bypass strict type checking for this specific query
    const chatSession = await sessionsCollection.findOne(filter as any);
    // -----------------------------------------------

    if (!chatSession) {
      // console.log(`[API Save] Session verification failed for query:`, filter);
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // 2. Create the stored message object
    const newMessageIdObject = new ObjectId(); // Generate ObjectId for the new message
    const storedMessage: StoredConversationMessage = {
      ...message, 
      _id: newMessageIdObject.toString(), // Store _id as string in the message document
      sessionId: sessionId, // Store sessionId as string (linking field)
      userId: userId, 
      createdAt: now, 
    };

    // 3. Insert the new message (pass the object matching the type)
    // console.log('[API Save] Inserting message:', storedMessage);
    const insertResult = await messagesCollection.insertOne(storedMessage);

    if (!insertResult.acknowledged || !insertResult.insertedId) {
        // console.error('[API Save] Failed to insert message, result:', insertResult);
        throw new Error("Failed to insert the chat message.");
    }
    // Ensure insertedId in the result matches our generated ID (as string)
    // Note: insertResult.insertedId is an ObjectId, convert to string for comparison/logging if needed
    // console.log(`[API Save] Message inserted with DB ObjectId: ${insertResult.insertedId}, App ObjectId: ${newMessageIdObject}`);
    

    // --- 4. Update session timestamp using ObjectId query --- 
    const updateFilter = { _id: querySessionIdObject }; // Filter by ObjectId
    // console.log(`[API Save] Updating session timestamp with filter:`, updateFilter);
    // Use "as any" to bypass strict type checking for updateOne filter as well
    await sessionsCollection.updateOne(
      updateFilter as any, 
      { $set: { lastUpdatedAt: now } }
    );
    // ------------------------------------------------------

    // Return the newly saved message (as it was inserted)
    return NextResponse.json(storedMessage);

  } catch (error: any) {
    // console.error("[API Save] Error saving chat message:", error);
    // Handle potential ObjectId conversion errors
    if (error.message.includes('Argument passed in must be a string')) {
        return NextResponse.json({ error: 'Invalid Session ID format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save chat message' }, { status: 500 });
  }
} 