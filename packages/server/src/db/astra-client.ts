import { DataAPIClient, Db, Collection } from '@datastax/astra-db-ts';
import { config } from '../config';
import { Presentation, PageResponseBatch, Page } from '@presentx/shared';

let dbInstance: Db | null = null;

// Define collection types explicitly for better type safety
export type PresentationsCollection = Collection<Presentation>;
export type PageResponsesCollection = Collection<PageResponseBatch>;

// Define User type (adjust based on your actual User structure in DB)
export interface UserDocument {
  _id: string; // Astra typically uses _id
  email: string;
  password: string; // Added for login check
  name?: string; // Optional name
  // Add other user fields like name, passwordHash, etc.
}
export type UsersCollection = Collection<UserDocument>;

export async function connectToDatabase() {
  if (dbInstance) {
    console.log('Reusing existing Astra DB connection');
    return dbInstance;
  }

  console.log('Initializing Astra DB connection...');
  try {
    // Use DataAPIClient from the new library
    const client = new DataAPIClient(config.astraDbToken);

    dbInstance = client.db(config.astraDbApiEndpoint);

    // --- Ensure Collections Exist ---
    console.log(`Ensuring collection '${config.presentationsCollectionName}' exists...`);
    await dbInstance.createCollection(config.presentationsCollectionName, {
        // Add options if needed later, e.g., for vector search:
        // vector: { dimension: 1536, metric: 'cosine' }
    });

    console.log(`Ensuring collection '${config.responsesCollectionName}' exists...`);
    await dbInstance.createCollection(config.responsesCollectionName);
    // --- End Ensure Collections Exist ---

    console.log(`Ensuring collection '${config.usersCollectionName}' exists...`);
    await dbInstance.createCollection(config.usersCollectionName || 'users');

    console.log('Astra DB connection initialized and collections ensured.');
    return dbInstance;
  } catch (error) {
    console.error('Failed to connect to Astra DB:', error);
    throw new Error('Could not connect to the database.');
  }
}

export function getDb(): Db {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized. Call connectToDatabase first.'
    );
  }
  return dbInstance;
}

// Convenience functions to get typed collections
export function getPresentationsCollection(): PresentationsCollection {
    return getDb().collection<Presentation>(config.presentationsCollectionName);
}

export function getPageResponsesCollection(): PageResponsesCollection {
    return getDb().collection<PageResponseBatch>(config.responsesCollectionName);
}

// Convenience function to get typed users collection
export function getUsersCollection(): UsersCollection {
    // Ensure you have a config variable for the users collection name
    // For example: config.usersCollectionName
    // If not, replace 'users' with your actual collection name
    return getDb().collection<UserDocument>(config.usersCollectionName || 'users');
} 