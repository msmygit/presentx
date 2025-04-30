import { v4 as uuidv4 } from 'uuid';
import {
  getPresentationsCollection,
  PresentationsCollection,
} from '../db/astra-client';
import {
  CreatePresentationRequest,
  Presentation,
  Page,
  AddPageRequest,
  PageType,
  AudienceSummary,
  OpenTextSummary,
  MultiChoiceSummary,
  WordCloudSummary,
  RatingSummary,
  QnASummary,
} from '@presentx/shared';
import { broadcastPageChange } from '../utils/socket';

// Simple random code generator (replace with something more robust if needed)
function generateAccessCode(length = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  // TODO: Add check to ensure code uniqueness in DB
  return result;
}

function getDefaultSummary(pageType: PageType): AudienceSummary {
    switch (pageType) {
        case 'multi-choice':
        case 'poll':
            return {} as MultiChoiceSummary;
        case 'rating':
            return { counts: {}, average: 0 } as RatingSummary;
        case 'word-cloud':
            return { top_words: {} } as WordCloudSummary;
        case 'q&a':
            return { question_count: 0 } as QnASummary;
        case 'open-text':
        default:
            return {} as OpenTextSummary;
    }
}

export async function createPresentation(
  input: CreatePresentationRequest
): Promise<Presentation> {
  const collection = getPresentationsCollection();
  const now = new Date().toISOString();
  const newPresentationId = uuidv4();

  const newPresentation: Omit<Presentation, '_id'> = {
    presentation_id: newPresentationId,
    title: input.title,
    description: input.description || '',
    presenter_id: input.presenter_id, // In real app, get from authenticated user
    access_code: generateAccessCode(), // Generate unique access code
    state: 'draft', // Initial state
    current_page_id: null,
    created_at: now,
    updated_at: now,
    ended_at: null,
    pages: [], // Start with no pages
  };

  const result = await collection.insertOne(newPresentation);
  if (!result.insertedId) {
    throw new Error('Failed to create presentation.');
  }

  // Fetch and return the created presentation
   const createdDoc = await collection.findOne({ _id: result.insertedId });
   if (!createdDoc) {
       throw new Error('Failed to retrieve created presentation');
   }
   return createdDoc;
}

export async function findPresentationById(
  presentationId: string
): Promise<Presentation | null> {
  console.log(`[Service findPresentationById] Searching for _id: ${presentationId}`);
  const collection = getPresentationsCollection();
  const result = await collection.findOne({ _id: presentationId });
  console.log(`[Service findPresentationById] Query result: ${result ? 'Found' : 'Not Found'}`);
  return result;
}

export async function findPresentationByAccessCode(
  accessCode: string
): Promise<Presentation | null> {
  console.log(`[Service findPresentationByAccessCode] Searching for code: ${accessCode}`);
  const collection = getPresentationsCollection();
  const query = { access_code: accessCode, state: 'active' };
  console.log(`[Service findPresentationByAccessCode] Executing query: ${JSON.stringify(query)}`);
  const result = await collection.findOne(query);
  console.log(`[Service findPresentationByAccessCode] Query result: ${result ? `Found ID ${result._id}` : 'Not Found'}`);
  return result;
}

export async function addPageToPresentation(
  presentationId: string,
  pageInput: AddPageRequest
): Promise<Presentation | null> {
  const collection = getPresentationsCollection();
  const presentation = await findPresentationById(presentationId);

  if (!presentation) {
    throw new Error('Presentation not found.');
  }

  // Basic validation
  if (presentation.state !== 'draft') {
      throw new Error('Can only add pages to presentations in draft state.');
  }

  const newPage: Page = {
    page_id: uuidv4(),
    page_order: pageInput.page_order,
    page_type: pageInput.page_type,
    page_title: pageInput.page_title || '',
    page_config: pageInput.page_config,
    audience_response_count: 0,
    audience_summary: getDefaultSummary(pageInput.page_type), // Initialize with default empty summary
  };

  // --- Step 1: Push the new page --- 
  const pushResult = await collection.findOneAndUpdate(
    { _id: presentation._id },
    {
      $push: { pages: newPage }, // Only push, no $each or $sort needed for single item
      $set: { updated_at: new Date().toISOString() },
    },
    { returnDocument: 'after' } // Get the doc with the new page added (unsorted)
  );

  if (!pushResult) {
      // Should not happen if presentation was found initially
      throw new Error('Failed to push page update.');
  }

  // --- Step 2: Sort the pages array in application code ---
  const sortedPages = [...pushResult.pages].sort((a: Page, b: Page) => a.page_order - b.page_order);

  // --- Step 3: Set the sorted array back to the database ---
  const setResult = await collection.findOneAndUpdate(
      { _id: pushResult._id }, // Target the same document
      {
          $set: { pages: sortedPages, updated_at: new Date().toISOString() }
      },
      { returnDocument: 'after' } // Return the final document with sorted pages
  );

  return setResult;
}

// Function to update presentation state (e.g., start, end)
export async function updatePresentationState(
  presentationId: string, // This ID is expected to be the _id
  newState: 'draft' | 'active' | 'completed'
): Promise<Presentation | null> {
  const collection = getPresentationsCollection();
  const now = new Date().toISOString();
  let updateData: Partial<Presentation> = { state: newState, updated_at: now };
  let firstPageId: string | null = null;

  if (newState === 'active') {
    // Find the first page to set as current when activating
    // Query using _id now
    const presentation = await collection.findOne({ _id: presentationId }); 
    if (!presentation) throw new Error('Presentation not found');
    if (!presentation.pages || presentation.pages.length === 0) {
        throw new Error('Cannot activate a presentation with no pages.');
    }
    // Ensure pages are sorted by page_order (though addPageToPresentation should handle this)
    presentation.pages.sort((a: Page, b: Page) => a.page_order - b.page_order);
    firstPageId = presentation.pages[0].page_id;
    updateData.current_page_id = firstPageId;
  } else if (newState === 'completed') {
    updateData.ended_at = now;
    updateData.current_page_id = null; // Clear current page when completed
  }

  const result = await collection.findOneAndUpdate(
    { _id: presentationId }, // Use _id for matching
    { $set: updateData },
    { returnDocument: 'after' }
  );

  // Broadcast page change if activating or completing
  if (result && (newState === 'active' || newState === 'completed')) {
      // Pass the correct presentation ID (_id) to broadcast
      broadcastPageChange(presentationId, updateData.current_page_id ?? null);
  }

  return result;
}

// Function for presenter to change the current page
export async function setCurrentPage(
  presentationId: string,
  pageId: string | null // Allow setting to null (e.g., before start/after end)
): Promise<Presentation | null> {
  const collection = getPresentationsCollection();

  // Optional: Validate pageId exists within the presentation
  if (pageId) {
      const presentation = await collection.findOne({
          presentation_id: presentationId,
          'pages.page_id': pageId
      });
      if (!presentation) {
          throw new Error(`Page ${pageId} not found in presentation ${presentationId}`);
      }
  }

  const result = await collection.findOneAndUpdate(
    { presentation_id: presentationId },
    {
      $set: {
        current_page_id: pageId,
        updated_at: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' }
  );

  // Broadcast the change
  if (result) {
    broadcastPageChange(presentationId, pageId);
  }

  return result;
}

// --- New Service: Delete Page ---
export async function deletePageFromPresentation(
    presentationId: string, 
    pageId: string, 
    userId: string // Pass userId for ownership check
): Promise<Presentation | null> {
    const collection = getPresentationsCollection();

    // 1. Find the presentation
    const presentation = await collection.findOne({ _id: presentationId });
    if (!presentation) {
        throw new Error('Presentation not found.');
    }

    // 2. Check ownership and state
    if (presentation.presenter_id !== userId) {
        throw new Error('Forbidden: User does not own this presentation.');
    }
    if (presentation.state !== 'draft') {
        throw new Error('Cannot delete pages unless presentation is in draft state.');
    }

    // 3. Check if page exists before attempting pull
    const pageExists = presentation.pages.some((p: Page) => p.page_id === pageId);
    if (!pageExists) {
        // Don't throw an error, maybe just return current state? Or 404 from route?
        // Let's return null to indicate no change/page not found for deletion.
        console.warn(`Page ${pageId} not found in presentation ${presentationId} for deletion.`);
        return null; // Indicate page wasn't found to delete
    }

    // 4. Use findOneAndUpdate with $pull to remove the page
    //    Also recalculate page_order for remaining pages
    
    // Filter out the page to be deleted
    const remainingPages = presentation.pages.filter((p: Page) => p.page_id !== pageId);
    
    // Recalculate page_order for the remaining pages
    const updatedSortedPages = remainingPages
        .sort((a: Page, b: Page) => a.page_order - b.page_order) // Ensure sorted first
        .map((page: Page, index: number) => ({ ...page, page_order: index })); // Assign new order

    const updateResult = await collection.findOneAndUpdate(
        { _id: presentationId },
        { $set: { pages: updatedSortedPages, updated_at: new Date().toISOString() } },
        { returnDocument: 'after' } // Return the updated document
    );
    
    // findOneAndUpdate returns null if no document matched the filter, 
    // but we already found it, so this shouldn't happen unless there's a race condition.
    if (!updateResult) {
        throw new Error('Failed to update presentation after page deletion.');
    }

    return updateResult; 
}

// --- New Service: Update Page ---
// Define the structure for the update payload
export interface UpdatePageData {
    page_title?: string;
    page_config?: any; // Keep any for now, could be more specific
}

export async function updatePageInPresentation(
    presentationId: string,
    pageId: string,
    userId: string, // For ownership check
    updateData: UpdatePageData
): Promise<Presentation | null> {
    const collection = getPresentationsCollection();

    // 1. Find the presentation
    const presentation = await collection.findOne({ _id: presentationId });
    if (!presentation) {
        throw new Error('Presentation not found.');
    }

    // 2. Check ownership and state
    if (presentation.presenter_id !== userId) {
        throw new Error('Forbidden: User does not own this presentation.');
    }
    if (presentation.state !== 'draft') {
        throw new Error('Cannot edit pages unless presentation is in draft state.');
    }

    // 3. Find the index of the page to update
    const pageIndex = presentation.pages.findIndex((p: Page) => p.page_id === pageId);
    if (pageIndex === -1) {
        throw new Error('Page not found within the presentation.');
    }

    // 4. Create the updated pages array
    const updatedPages = [...presentation.pages];
    const currentPage = updatedPages[pageIndex];

    // Apply updates - only update fields provided in updateData
    updatedPages[pageIndex] = {
        ...currentPage,
        ...(updateData.page_title !== undefined && { page_title: updateData.page_title }),
        ...(updateData.page_config !== undefined && { page_config: updateData.page_config }),
    };

    console.log(`[Service updatePageInPresentation] Updating page ${pageId} at index ${pageIndex}. New page data:`, JSON.stringify(updatedPages[pageIndex], null, 2));
    console.log(`[Service updatePageInPresentation] Attempting to set entire pages array:`, JSON.stringify(updatedPages, null, 2));

    // 5. Update the presentation in the database
    const updateResult = await collection.findOneAndUpdate(
        { _id: presentationId },
        { $set: { pages: updatedPages, updated_at: new Date().toISOString() } },
        { returnDocument: 'after' } // Return the updated document
    );

    if (!updateResult) {
        // Should not happen if presentation was found initially
        throw new Error('Failed to update presentation after page update.');
    }

    return updateResult;
} 