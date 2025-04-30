import { v4 as uuidv4 } from 'uuid';
import {
  getPageResponsesCollection,
  getPresentationsCollection,
} from '../db/astra-client';
import {
  IndividualResponse,
  PageResponseBatch,
  Presentation,
  Page,
  AudienceSummary,
  SubmitResponseRequest,
  PageType,
  MultiChoiceSummary,
  WordCloudSummary,
  RatingSummary,
  OpenTextSummary,
  QnASummary,
} from '@presentx/shared';
import { FindOneAndUpdateOptions } from '@datastax/astra-db-ts';
import { broadcastNewQuestion, broadcastSummaryUpdate } from '../utils/socket';

const MAX_RESPONSES_PER_BATCH = 990; // Keep slightly below 1000 for safety

async function findOrCreateActiveBatch(
  presentationId: string,
  pageId: string
): Promise<PageResponseBatch> {
  const responsesCollection = getPageResponsesCollection();

  // 1. Try to find an existing active batch with space
  const activeBatch = await responsesCollection.findOne({
    presentation_id: presentationId,
    page_id: pageId,
    is_active_batch: true,
    response_count_in_batch: { $lt: MAX_RESPONSES_PER_BATCH },
  });

  if (activeBatch) {
    return activeBatch;
  }

  // 2. If no suitable active batch, find the latest batch sequence number
  const latestBatch = await responsesCollection.findOne(
    {
      presentation_id: presentationId,
      page_id: pageId,
    },
    {
      sort: { batch_sequence: -1 },
    }
  );

  const nextSequence = latestBatch ? latestBatch.batch_sequence + 1 : 0;

  // 3. Create a new batch
  const newBatchData: Omit<PageResponseBatch, '_id'> = {
    presentation_id: presentationId,
    page_id: pageId,
    batch_sequence: nextSequence,
    response_count_in_batch: 0,
    is_active_batch: true,
    created_at: new Date().toISOString(),
    responses: [],
  };

  const insertResult = await responsesCollection.insertOne(newBatchData);
  if (!insertResult.insertedId) {
    throw new Error('Failed to insert new response batch.');
  }

  // Mark previous batch (if exists) as inactive (best effort)
  if (latestBatch && latestBatch.is_active_batch) {
    await responsesCollection.updateOne(
      { _id: latestBatch._id },
      { $set: { is_active_batch: false } }
    );
  }

  // Fetch the newly created batch to return it
  const newBatch = await responsesCollection.findOne({
    _id: insertResult.insertedId,
  });
  if (!newBatch) {
      throw new Error('Failed to retrieve newly created batch');
  }

  return newBatch;
}

// --- Summary Update Logic ---
// This is the most complex part and might need refinement based on specific page types

function calculateNewSummary(
    currentPage: Page,
    newResponseData: any,
    currentSummary: AudienceSummary
): AudienceSummary {

    const pageType: PageType = currentPage.page_type;

    switch (pageType) {
        case 'multi-choice':
        case 'poll': {
            const summary = (currentSummary || {}) as MultiChoiceSummary;
            const choice = String(newResponseData);
            summary[choice] = (summary[choice] || 0) + 1;
            return summary;
        }
        case 'rating': {
            const summary = (currentSummary || { counts: {}, average: 0 }) as RatingSummary;
            const rating = String(newResponseData); // Rating value (e.g., "3")
            summary.counts[rating] = (summary.counts[rating] || 0) + 1;

            // Recalculate average (simple approach)
            let totalScore = 0;
            let totalVotes = 0;
            for (const [score, count] of Object.entries(summary.counts)) {
                totalScore += parseInt(score, 10) * (count as number);
                totalVotes += (count as number);
            }
            summary.average = totalVotes > 0 ? parseFloat((totalScore / totalVotes).toFixed(2)) : 0;
            return summary;
        }
        case 'word-cloud': {
            // Basic: count word occurrences. Needs more complex logic for stemming, stopwords etc.
            const summary = (currentSummary || { top_words: {} }) as WordCloudSummary;
            const word = String(newResponseData).trim().toLowerCase().substring(0, 30); // Basic cleaning
            if (word) {
                 summary.top_words = summary.top_words || {};
                 summary.top_words[word] = (summary.top_words[word] || 0) + 1;
                // In production, might only keep top N words or use a more sophisticated structure
            }
            return summary;
        }
         case 'q&a': { // Only tracks count via response_count
            // Raw questions are added via response submission, summary might be empty or track count
            // The 'new_question' broadcast happens separately in addResponse
            return (currentSummary || {}) as QnASummary;
         }
        case 'open-text':
        default:
            // These types might only rely on the response count, not a visual summary object
            return (currentSummary || {}) as OpenTextSummary; // Return empty object
    }
}

// --- Main Service Function ---

export async function addResponse(
  presentationId: string,
  pageId: string,
  responseInput: SubmitResponseRequest
): Promise<void> {
  const presentationsCollection = getPresentationsCollection();
  const responsesCollection = getPageResponsesCollection();

  // 1. Find the presentation and the specific page
  const presentation = await presentationsCollection.findOne({
    presentation_id: presentationId,
    // Optionally add: state: 'active'
  });

  if (!presentation) {
    throw new Error('Presentation not found or not active.');
  }

  const pageIndex = presentation.pages.findIndex((p: Page) => p.page_id === pageId);
  if (pageIndex === -1) {
    throw new Error('Page not found in this presentation.');
  }
  const currentPage = presentation.pages[pageIndex];

  // 2. Find or Create Active Batch
  const batch = await findOrCreateActiveBatch(presentationId, pageId);

  // 3. Create the Response Object
  const newResponse: IndividualResponse = {
    response_id: uuidv4(),
    user_id: responseInput.user_id || 'anonymous', // Handle user identification
    submitted_at: new Date().toISOString(),
    response_data: responseInput.response_data,
  };

  // 4. Add Response to Batch (using findOneAndUpdate for atomicity within the batch doc)
  const updateBatchOptions: FindOneAndUpdateOptions = {
      returnDocument: 'after' // Return the updated batch doc
  };
  const updatedBatch = await responsesCollection.findOneAndUpdate(
    { _id: batch._id, is_active_batch: true }, // Ensure it's still the active batch
    {
      $push: { responses: newResponse },
      $inc: { response_count_in_batch: 1 },
    },
    updateBatchOptions
  );

  if (!updatedBatch) {
      // This could happen if the batch became inactive between find and update (race condition)
      // Retry the whole operation - simple retry strategy
      console.warn(`Batch ${batch._id} became inactive during update, retrying addResponse...`);
      return addResponse(presentationId, pageId, responseInput);
      // Or throw an error, or implement more sophisticated locking/retry
      // throw new Error('Failed to add response to the active batch. Please try again.');
  }

  // 5. Calculate New Summary
  const newSummary = calculateNewSummary(currentPage, newResponse.response_data, currentPage.audience_summary);

  // 6. Update Presentation Summary (Atomically)
  // Use $set with arrayFilters to update the specific page's summary and count
  const newTotalResponseCount = currentPage.audience_response_count + 1;
  const presentationUpdateResult = await presentationsCollection.updateOne(
    {
      _id: presentation._id,
      'pages.page_id': pageId,
    },
    {
      $set: {
        [`pages.${pageIndex}.audience_summary`]: newSummary,
        [`pages.${pageIndex}.audience_response_count`]: newTotalResponseCount,
        updated_at: new Date().toISOString(),
      },
    }
    // Consider adding optimistic locking field if needed for high concurrency
  );

  if (presentationUpdateResult.matchedCount === 0) {
      // This should ideally not happen if presentation/page were found initially
      console.error(`Failed to update summary for presentation ${presentationId}, page ${pageId}. Match count 0.`);
      // Potentially revert the batch update or log for manual reconciliation
      throw new Error('Failed to update presentation summary.');
  }

  // 7. Broadcast Updates via WebSocket
  broadcastSummaryUpdate(presentationId, pageId, newSummary, newTotalResponseCount);

  // Handle specific page type broadcasts (e.g., new Q&A question)
  if (currentPage.page_type === 'q&a') {
      const questionPayload = {
          id: newResponse.response_id,
          text: String(newResponse.response_data), // Assuming Q&A data is the question text
          userId: newResponse.user_id,
          timestamp: newResponse.submitted_at,
          // Add upvotes etc. if applicable later
      };
      broadcastNewQuestion(presentationId, pageId, questionPayload);
  }

  // 8. Handle Batch Rollover (if the updated batch is now full)
  if (updatedBatch.response_count_in_batch >= MAX_RESPONSES_PER_BATCH) {
    console.log(`Batch ${updatedBatch._id} is full. Marking inactive.`);
    await responsesCollection.updateOne(
      { _id: updatedBatch._id },
      { $set: { is_active_batch: false } }
    );
    // Note: The *next* response will trigger findOrCreateActiveBatch to create a new one.
  }

  console.log(`Response ${newResponse.response_id} added to presentation ${presentationId}, page ${pageId}`);
} 