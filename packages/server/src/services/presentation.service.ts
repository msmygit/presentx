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
  OpenEndedSummary,
  MultiChoiceSummary,
  WordCloudSummary,
  ScalesSummary,
  QnASummary,
  IndividualResponse,
  PageResponseBatch,
  SubmitResponseRequest,
  RankingSummary,
  RankingConfig,
} from '@presentx/shared';
import { broadcastSummaryUpdate, broadcastPageChange } from '../utils/socket';
import { getPageResponsesCollection } from '../db/astra-client'; // <-- Import response collection getter

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
            return { } as MultiChoiceSummary;
        case 'scales':
            return { counts: {}, average: 0 } as ScalesSummary;
        case 'ranking':
             return { item_average_ranks: {}, most_common_rankings: [] } as RankingSummary;
        case 'word-cloud':
            return { top_words: {} } as WordCloudSummary; 
        case 'q&a':
            return { question_count: 0 } as QnASummary;
        case 'open-ended':
            return { response_count: 0, sample_responses: [] } as OpenEndedSummary;
        default:
             console.warn(`[getDefaultSummary] Unknown page type: ${pageType}, returning empty summary.`);
            return {};
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
  // Explicitly type the state property to match Presentation type
  const query: Partial<Presentation> = { access_code: accessCode, state: 'active' };
  console.log(`[Service findPresentationByAccessCode] Executing query: ${JSON.stringify(query)}`);
  // Use CollectionFilter<Presentation> for type safety if needed and available
  // const result = await collection.findOne(query as CollectionFilter<Presentation>);
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
    status: 'active', // Default new pages to active
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
      // Call the correct broadcast function with the correct payload
      broadcastPageChange(presentationId, updateData.current_page_id ?? null);
  }

  return result;
}

// Function for presenter to change the current page (audience view)
export async function setCurrentAudiencePage(
  presentationId: string,
  pageId: string | null // Allow setting to null
): Promise<Presentation | null> {
  const collection = getPresentationsCollection();

  // First check if the presentation exists and is active using the correct _id
  const presentationCheck = await collection.findOne({ _id: presentationId });
  if (!presentationCheck) {
    throw new Error(`Presentation ${presentationId} not found`);
  }
  
  if (presentationCheck.state !== 'active') {
    throw new Error(`Cannot change active page: Presentation must be in 'active' state (current: ${presentationCheck.state})`);
  }

  // Validate pageId exists within the presentation if it's not null
  if (pageId !== null) {
    const pageObject = presentationCheck.pages.find((page: Page) => page.page_id === pageId); // Find the actual page object
    if (!pageObject) { // Check if the object was found
      throw new Error(`Page ${pageId} not found in presentation ${presentationId}`);
    }
    // Now check the status on the found object
    if (pageObject.status === 'skipped') { 
        throw new Error(`Cannot set audience view to a skipped page (Page ID: ${pageId})`);
    }
  }

  const result = await collection.findOneAndUpdate(
    { _id: presentationId }, // Query using _id here as well
    {
      $set: {
        current_page_id: pageId,
        updated_at: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' }
  );

  // Broadcast the page change
  if (result) {
    // Call the correct broadcast function with the correct payload
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

    // 2. Check ownership and state (Allow deletion in active state as per new requirement)
    if (presentation.presenter_id !== userId) {
        throw new Error('Forbidden: User does not own this presentation.');
    }
    // Remove or modify the state check if deleting is now allowed in active state
    /*
    if (presentation.state !== 'draft') {
        throw new Error('Cannot delete pages unless presentation is in draft state.');
    }
    */

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

    // 2. Check ownership and state (Allow editing in active state as per new requirement)
    if (presentation.presenter_id !== userId) {
        throw new Error('Forbidden: User does not own this presentation.');
    }
    // Remove or modify the state check if editing is now allowed in active state
    /* 
    if (presentation.state !== 'draft') {
        throw new Error('Cannot edit pages unless presentation is in draft state.');
    }
    */

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

// --- New Service: Update Page Status ---
export async function updatePageStatus(
    presentationId: string,
    pageId: string,
    userId: string, // For ownership check
    newStatus: 'active' | 'skipped'
): Promise<Presentation | null> {
    const collection = getPresentationsCollection();

    // Find the presentation and check ownership
    const presentation = await collection.findOne({ _id: presentationId });
    if (!presentation) {
        throw new Error('Presentation not found.');
    }
    if (presentation.presenter_id !== userId) {
        throw new Error('Forbidden: User does not own this presentation.');
    }

    // Find the index of the page to update
    const pageIndex = presentation.pages.findIndex((p: Page) => p.page_id === pageId);
    if (pageIndex === -1) {
        throw new Error('Page not found within the presentation.');
    }

    // Update the status in the pages array
    const updatedPages = [...presentation.pages];
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], status: newStatus };

    // Update the document in the database
    const updateResult = await collection.findOneAndUpdate(
        { _id: presentationId },
        { $set: { pages: updatedPages, updated_at: new Date().toISOString() } },
        { returnDocument: 'after' } // Return the updated document
    );

    if (!updateResult) {
        throw new Error('Failed to update presentation after page status update.');
    }

    return updateResult;
}

// --- New Service: Set Status for All Pages ---
export async function setAllPagesStatus(
    presentationId: string,
    userId: string, // For ownership check
    newStatus: 'active' | 'skipped'
): Promise<Presentation | null> {
    const collection = getPresentationsCollection();

    // Find the presentation and check ownership
    const presentation = await collection.findOne({ _id: presentationId });
    if (!presentation) {
        throw new Error('Presentation not found.');
    }
    if (presentation.presenter_id !== userId) {
        throw new Error('Forbidden: User does not own this presentation.');
    }

    // Create the updated pages array with the new status
    const updatedPages = presentation.pages.map((p: Page) => ({ ...p, status: newStatus }));

    // Update the document in the database
    const updateResult = await collection.findOneAndUpdate(
        { _id: presentationId },
        { $set: { pages: updatedPages, updated_at: new Date().toISOString() } },
        { returnDocument: 'after' } // Return the updated document
    );

    if (!updateResult) {
        throw new Error('Failed to update presentation after setting all page statuses.');
    }

    return updateResult;
}

// --- Service to Recalculate and Broadcast Summary ---
// This function calculates the summary based on ALL responses for a page
export async function updateAndBroadcastSummary(
    presentationId: string, 
    pageId: string
): Promise<void> {
    console.log(`[updateAndBroadcastSummary] Starting for pId: ${presentationId}, pageId: ${pageId}`);
    const presentationsCollection = getPresentationsCollection();
    const responsesCollection = getPageResponsesCollection();

    try {
        // 1. Fetch the Presentation and the specific Page
        const presentation = await presentationsCollection.findOne({ _id: presentationId });
        if (!presentation) {
            console.error(`[updateAndBroadcastSummary] Presentation ${presentationId} not found.`);
            return;
        }
        const pageIndex = presentation.pages.findIndex((p: Page) => p.page_id === pageId);
        if (pageIndex === -1) {
            console.error(`[updateAndBroadcastSummary] Page ${pageId} not found in presentation ${presentationId}.`);
            return;
        }
        const currentPage = presentation.pages[pageIndex];
        const pageType = currentPage.page_type;
        const pageConfig = currentPage.page_config; // Needed for Ranking type

        // 2. Fetch ALL response batches for this page
        const responseBatches = await responsesCollection.find({
            presentation_id: presentationId,
            page_id: pageId
        }).toArray();

        // 3. Aggregate all individual responses
        const allResponses: IndividualResponse[] = responseBatches.flatMap(batch => batch.responses || []);
        const totalResponseCount = allResponses.length;

        console.log(`[updateAndBroadcastSummary] Found ${totalResponseCount} total responses for page ${pageId}.`);

        // 4. Calculate the new summary based on PageType and all responses
        let newSummary: AudienceSummary = {}; // Initialize empty

        switch (pageType) {
            case 'multi-choice':
            case 'poll': {
                const summary: MultiChoiceSummary = {};
                allResponses.forEach(resp => {
                    const choice = String(resp.response_data.choice); // Assuming response_data is { choice: "option" }
                    if (choice) {
                        summary[choice] = (summary[choice] || 0) + 1;
                    }
                });
                newSummary = summary;
                break;
            }
            case 'scales': {
                const summary: ScalesSummary = { counts: {}, average: 0 };
                let totalScore = 0;
                allResponses.forEach(resp => {
                    const value = parseInt(String(resp.response_data.value), 10); // Assuming { value: 3 }
                    if (!isNaN(value)) {
                        const key = String(value);
                        summary.counts[key] = (summary.counts[key] || 0) + 1;
                        totalScore += value;
                    }
                });
                summary.average = totalResponseCount > 0 ? parseFloat((totalScore / totalResponseCount).toFixed(2)) : 0;
                newSummary = summary;
                break;
            }
            case 'ranking': {
                 const config = pageConfig as RankingConfig;
                 const summary: RankingSummary = { item_average_ranks: {} }; // Initialize
                 const itemTotalRanks: Record<string, number> = {}; // Sum of ranks for each item
                 const itemCounts: Record<string, number> = {}; // Count of times each item was ranked

                 allResponses.forEach(resp => {
                     const ranking = resp.response_data.ranking as string[]; // Assuming { ranking: ["Item A", "Item B"] }
                     if (Array.isArray(ranking)) {
                         ranking.forEach((item, index) => {
                             const rank = index + 1; // 1-based rank
                             if (item) { // Ensure item exists
                                 itemTotalRanks[item] = (itemTotalRanks[item] || 0) + rank;
                                 itemCounts[item] = (itemCounts[item] || 0) + 1;
                             }
                         });
                     }
                 });

                 // Calculate average rank for each item defined in config
                 config.items.forEach((item: string) => {
                     if (itemCounts[item] > 0) {
                         summary.item_average_ranks![item] = parseFloat((itemTotalRanks[item] / itemCounts[item]).toFixed(2));
                     } else {
                         summary.item_average_ranks![item] = 0; // Or null/undefined if preferred
                     }
                 });
                 // TODO: Calculate most_common_rankings if needed (more complex)

                 newSummary = summary;
                 break;
            }
            case 'word-cloud': {
                const summary: WordCloudSummary = { top_words: {} };
                const wordCounts: Record<string, number> = {};
                const MAX_WORDS = 100; // Limit number of words in summary

                allResponses.forEach(resp => {
                    // Basic processing: lower case, trim, split by space
                    const text = String(resp.response_data.text || '').toLowerCase().trim();
                    const words = text.split(/\s+/).filter(w => w.length > 1); // Split and ignore single chars
                    
                    words.forEach(word => {
                        // Basic stop word check (can be expanded)
                        if (!['the', 'a', 'is', 'it', 'and', 'or', 'of'].includes(word)) {
                             wordCounts[word] = (wordCounts[word] || 0) + 1;
                        }
                    });
                });

                // Get top N words
                 const sortedWords = Object.entries(wordCounts)
                     .sort(([, countA], [, countB]) => countB - countA)
                     .slice(0, MAX_WORDS);

                 summary.top_words = Object.fromEntries(sortedWords);
                newSummary = summary;
                break;
            }
            case 'open-ended': {
                const summary: OpenEndedSummary = { response_count: totalResponseCount, sample_responses: [] };
                const MAX_SAMPLES = 5; // How many recent samples to store
                
                // Get the last N responses (assuming batches/responses are roughly chronological)
                summary.sample_responses = allResponses
                    .slice(-MAX_SAMPLES)
                    .map(resp => String(resp.response_data.text || '')) // Assuming { text: "..." }
                    .filter(text => text.length > 0); 

                newSummary = summary;
                break;
            }
             case 'q&a':
                 // Q&A might not have a typical summary object, maybe just count?
                 const qnaSummary: QnASummary = { question_count: totalResponseCount };
                 // Fetch top questions based on upvotes if implemented later
                 newSummary = qnaSummary;
                 break;
            default:
                console.warn(`[updateAndBroadcastSummary] No summary calculation logic for page type: ${pageType}`);
                newSummary = {}; // Default to empty if type not handled
        }

        console.log(`[updateAndBroadcastSummary] Calculated new summary for page ${pageId}:`, JSON.stringify(newSummary));

        // 5. Update the Presentation Document using Fetch-Modify-Replace with simple filter
        
        // Create the updated pages array (same as before)
        const updatedPages = presentation.pages.map((page: Page) => {
            if (page.page_id === pageId) {
                return { ...page, audience_summary: newSummary, audience_response_count: totalResponseCount };
            }
            return page;
        });
        
        // ---> ADD MORE DETAILED LOGGING BEFORE UPDATE <---
        console.log(`[updateAndBroadcastSummary] Re-confirming presentation _id before update: ID=${presentation._id}, Type=${typeof presentation._id}`);
        console.log(`[updateAndBroadcastSummary] Value of presentationId variable: ID=${presentationId}, Type=${typeof presentationId}`);
        
        // Log structure confirmation (avoid huge arrays)
        const updatedPageIndex = updatedPages.findIndex(p => p.page_id === pageId);
        console.log(`[updateAndBroadcastSummary] Updated pages array length: ${updatedPages.length}`);
        if (updatedPageIndex !== -1) {
             console.log(`[updateAndBroadcastSummary] Updated page data at index ${updatedPageIndex}: audience_response_count=${updatedPages[updatedPageIndex].audience_response_count}, summary_keys=${Object.keys(updatedPages[updatedPageIndex].audience_summary ?? {}).join(',')}`);
        } else {
             console.error(`[updateAndBroadcastSummary] CRITICAL: Updated page ${pageId} not found in mapped array!`);
        }
        console.log(`[updateAndBroadcastSummary] Attempting updateOne with filter: { _id: ${presentationId} }`);
        // ---------------------------------------------

        // Use updateOne with ONLY _id filter to set the entire pages array
        const updateResult = await presentationsCollection.updateOne(
            { _id: presentationId }, // Filter ONLY by _id
            {
                $set: {
                    pages: updatedPages, // Replace the whole array
                    updated_at: new Date().toISOString(),
                }
            }
        );

        // Check results (remains same)
        console.log(`[updateAndBroadcastSummary] updateOne result: matchedCount=${updateResult.matchedCount}, modifiedCount=${updateResult.modifiedCount}`); // Log detailed result
        if (updateResult.matchedCount === 0) {
            console.error(`[updateAndBroadcastSummary] updateOne FAILED to match _id: ${presentationId}`);
            return; 
        }
        if (updateResult.modifiedCount === 0) {
             console.warn(`[updateAndBroadcastSummary] Presentation document was matched but not modified during summary update. pId: ${presentationId}, pageId: ${pageId}`);
        }

        console.log(`[updateAndBroadcastSummary] Successfully updated summary in DB for page ${pageId}.`);

        // 6. Broadcast the Update (remains same)
        broadcastSummaryUpdate(presentationId, pageId, newSummary, totalResponseCount);
        console.log(`[updateAndBroadcastSummary] Broadcasted summary update for page ${pageId}.`);

    } catch (error) {
        console.error(`[updateAndBroadcastSummary] Error processing summary for pId ${presentationId}, pageId ${pageId}:`, error);
        // Decide if error should be re-thrown or just logged
    }
}

// Function to delete a presentation and all associated responses
export async function deletePresentationAndResponses(
  presentationId: string, // Expecting _id
  userId: string
): Promise<boolean> {
  const presentationsCollection = getPresentationsCollection();
  const responsesCollection = getPageResponsesCollection();

  console.log(`[Service deletePresentationAndResponses] Attempting deletion for presentation ${presentationId} by user ${userId}`);

  // 1. Verify ownership and get presentation
  const presentation = await presentationsCollection.findOne({ _id: presentationId });

  if (!presentation) {
    console.log(`[Service deletePresentationAndResponses] Presentation ${presentationId} not found.`);
    // Throw error for route handler to catch
    throw new Error(`Presentation ${presentationId} not found`); 
  }

  if (presentation.presenter_id !== userId) {
     console.log(`[Service deletePresentationAndResponses] User ${userId} forbidden from deleting presentation ${presentationId}`);
    // Throw error for route handler to catch
    throw new Error(`Forbidden: You do not have permission to delete presentation ${presentationId}`);
  }

  // --- Proceed with deletion ---
  try {
    // 2. Delete all response batches associated with the presentation
    console.log(`[Service deletePresentationAndResponses] Deleting responses for presentation ${presentationId}`);
    const deleteResponsesResult = await responsesCollection.deleteMany({ presentation_id: presentationId });
    console.log(`[Service deletePresentationAndResponses] Deleted ${deleteResponsesResult.deletedCount} response documents.`);

    // 3. Delete the presentation document itself
    console.log(`[Service deletePresentationAndResponses] Deleting presentation document ${presentationId}`);
    const deletePresentationResult = await presentationsCollection.deleteOne({ _id: presentationId });

    if (deletePresentationResult.deletedCount === 0) {
      // This shouldn't happen if we found it earlier, but good to check
      console.warn(`[Service deletePresentationAndResponses] Presentation ${presentationId} was not found during the final delete operation.`);
      return false; // Indicate failure, though unexpected
    }

    console.log(`[Service deletePresentationAndResponses] Successfully deleted presentation ${presentationId} and associated data.`);
    return true; // Indicate success

  } catch (error) {
    console.error(`[Service deletePresentationAndResponses] Database error during deletion for ${presentationId}:`, error);
    // Re-throw the error to be handled by the route's error handler
    throw new Error(`Failed to delete presentation ${presentationId} due to a database error.`);
  }
}