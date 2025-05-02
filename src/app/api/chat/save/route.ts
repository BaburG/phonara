import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getChatMessagesCollection, getChatSessionsCollection } from '@/lib/mongodb';
import { ConversationMessage } from '@/lib/translation-store';
import { StoredConversationMessage } from '@/lib/types';
import { ObjectId } from 'mongodb'; // Keep for creating new ObjectIds

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

    // Optional: Validate sessionId format
    // if (!ObjectId.isValid(sessionId)) {
    //     return NextResponse.json({ error: 'Invalid Session ID format' }, { status: 400 });
    // }

    const messagesCollection = await getChatMessagesCollection();
    const sessionsCollection = await getChatSessionsCollection();
    const now = new Date();

    // 1. Verify the session exists and belongs to the user before saving the message
    const chatSession = await sessionsCollection.findOne({
      _id: sessionId, // Query with string ID
      userId: userId
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // 2. Create the stored message object
    // Generate a new ObjectId for the message itself and convert it to string for storage
    const newMessageId = new ObjectId().toString();
    const storedMessage: StoredConversationMessage = {
      ...message, // Spread the base message properties (role, content, timestamp)
      _id: newMessageId,
      sessionId: sessionId,
      userId: userId, // Denormalize userId for easier querying/filtering if needed
      createdAt: now, // Set creation timestamp for the stored message
    };

    // 3. Insert the new message
    const insertResult = await messagesCollection.insertOne(storedMessage as any); // Cast might be needed depending on exact driver/type setup

    if (!insertResult.acknowledged || !insertResult.insertedId) {
        throw new Error("Failed to insert the chat message.");
    }

    // 4. Update the session's lastUpdatedAt timestamp
    await sessionsCollection.updateOne(
      { _id: sessionId }, // Filter by string ID
      { $set: { lastUpdatedAt: now } }
    );

    // Return the newly saved message (with its generated _id)
    return NextResponse.json(storedMessage);

  } catch (error) {
    console.error("Error saving chat message:", error);
    // Handle potential ObjectId conversion errors if validation is added
    // if (error instanceof Error && error.message.includes(...)) { ... }
    return NextResponse.json({ error: 'Failed to save chat message' }, { status: 500 });
  }
} 