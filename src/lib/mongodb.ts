import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { ChatSession, StoredConversationMessage, LanguageConfig } from './types'; // Import from your types file

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!dbName) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // @ts-ignore
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
    const client = await clientPromise;
    return client.db(dbName);
}

// Collection for individual messages
export async function getChatMessagesCollection(): Promise<Collection<StoredConversationMessage>> {
    const db = await getDb();
    return db.collection<StoredConversationMessage>('chatMessages'); // Use new interface
}

// Collection for session metadata
export async function getChatSessionsCollection(): Promise<Collection<ChatSession>> {
    const db = await getDb();
    return db.collection<ChatSession>('chatSessions');
}

 // Collection for languages (for Phase 3)
 export async function getLanguagesCollection(): Promise<Collection<LanguageConfig>> {
     const db = await getDb();
     return db.collection<LanguageConfig>('languages');
 }

 // Function to seed initial languages (for Phase 3) - Placeholder
 export async function seedLanguages() {
     console.log('Seeding languages - implementation pending...');
     // TODO: Add implementation from previous plan or define it here.
     // Example: Check if collection is empty, then insert initial languages.
     // const languagesCollection = await getLanguagesCollection();
     // const count = await languagesCollection.countDocuments();
     // if (count === 0) {
     //   const initialLanguages: Omit<LanguageConfig, '_id'>[] = [
     //     { code: 'en', label: 'English', flag: '🇺🇸', isEnabled: true },
     //     { code: 'es', label: 'Spanish', flag: '🇪🇸', isEnabled: true },
     //     // Add more languages
     //   ];
     //   await languagesCollection.insertMany(initialLanguages as any); // Cast needed if _id is not present
     //   console.log(`Seeded ${initialLanguages.length} languages.`);
     // } else {
     //   console.log('Languages collection already seeded.');
     // }
 }

export default clientPromise; 