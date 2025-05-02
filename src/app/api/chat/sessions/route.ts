import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Assuming authOptions are defined in this path, adjust if necessary
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getChatSessionsCollection } from '@/lib/mongodb';
import { ChatSession } from '@/lib/types'; // Import the type
import { ObjectId } from 'mongodb'; // Needed for potential ObjectId usage if not string

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // Use the standard user ID from the session
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionsCollection = await getChatSessionsCollection();
    const userSessions = await sessionsCollection
      .find({ userId: userId }) // Use the string userId directly
      .sort({ lastUpdatedAt: -1 }) // Show newest first
      .toArray();

    // The ChatSession interface defines _id as string, assuming conversion happens upstream
    return NextResponse.json(userSessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionsCollection = await getChatSessionsCollection();
    const now = new Date();

    // Create a new session document
    const newSessionData: Omit<ChatSession, '_id'> = {
      userId: userId,
      title: `Chat on ${now.toLocaleDateString()}`, // Default title
      createdAt: now,
      lastUpdatedAt: now,
    };

    const result = await sessionsCollection.insertOne(newSessionData as ChatSession);

    // MongoDB Node.js driver returns the inserted document with _id in result.ops[0] or via insertedId
    // Let's fetch the inserted document to be sure we return the full object
    const insertedSession = await sessionsCollection.findOne({ _id: result.insertedId });

    if (!insertedSession) {
        throw new Error("Failed to retrieve the newly created session.");
    }

    // Return the newly created session object (ensure _id is string)
    return NextResponse.json({ ...insertedSession, _id: insertedSession._id.toString() });

  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
} 