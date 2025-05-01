import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  AudienceSummary,
  PageChangeEvent,
  SummaryUpdateEvent,
  AudienceCountUpdateEvent,
  NewQuestionEvent,
  SubmitResponseRequest,
  IndividualResponse,
} from '@presentx/shared';
import { addResponse } from '../services/response.service';
import { updateAndBroadcastSummary } from '../services/presentation.service';
import logger from '../lib/logger';

let io: SocketIOServer | null = null;

interface ServerToClientEvents {
  page_change: (payload: PageChangeEvent) => void;
  summary_update: (payload: SummaryUpdateEvent) => void;
  audience_count_update: (payload: AudienceCountUpdateEvent) => void;
  new_question: (payload: NewQuestionEvent) => void;
  joined_presentation: (payload: { audienceCount: number }) => void;
  error: (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  join_presentation: (presentationId: string, callback: (success: boolean) => void) => void;
  leave_presentation: (presentationId: string) => void;
  submit_response: (
    data: {
      presentationId: string;
      pageId: string;
      responsePayload: SubmitResponseRequest;
    },
    callback: (error: string | null, result?: { success: boolean; responseId?: string }) => void
  ) => void;
}

interface InterServerEvents {
  // Not used currently
}

interface SocketData {
  userId: string; // Can store user session info if needed
  currentPresentationId?: string;
}

export function setupWebSocket(
  serverInstance: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) {
  io = serverInstance;

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    logger.info(`Socket connected: ${socket.id}`);

    // --- Presentation Room Logic ---
    socket.on('join_presentation', async (presentationId: string, callback: (success: boolean) => void) => {
      try {
        // Optional: Add validation here - check if presentation exists/is active
        logger.info(`Socket ${socket.id} joining presentation ${presentationId}`);
        await socket.join(presentationId); // Join a room specific to the presentation
        socket.data.currentPresentationId = presentationId;

        // Update and broadcast audience count
        const room = io?.sockets.adapter.rooms.get(presentationId);
        const count = room ? room.size : 0;
        broadcastAudienceCount(presentationId, count);

        // --> Emit confirmation back to the client that joined <--
        logger.info(`[Socket ${socket.id}] Emitting joined_presentation for room ${presentationId}`);
        socket.emit('joined_presentation', { audienceCount: count });

        if (callback) callback(true);
      } catch (err) {
        logger.error(`Error joining presentation ${presentationId}:`, err);
        if (callback) callback(false);
        socket.emit('error', { message: 'Failed to join presentation room.' });
      }
    });

    socket.on('leave_presentation', (presentationId: string) => {
        logger.info(`Socket ${socket.id} leaving presentation ${presentationId}`);
        socket.leave(presentationId);
        socket.data.currentPresentationId = undefined;
         // Update and broadcast audience count
        const room = io?.sockets.adapter.rooms.get(presentationId);
        const count = room ? room.size : 0;
        broadcastAudienceCount(presentationId, count);
    });
    // --- End Presentation Room Logic ---

    socket.on(
        'submit_response',
        async (
          { presentationId, pageId, responsePayload },
          callback 
        ) => {
          logger.info(
            `Received 'submit_response' for pres ${presentationId}, page ${pageId} from socket ${socket.id}`
          );
          try {
            // Note: Using socket ID as temporary user ID. 
            // Should align with how user_id in responsePayload is intended.
            // If responsePayload.user_id is set by client, use that instead? Let's assume it is for now.
            // const audienceMemberId = `socket:${socket.id}`; 

            const createdResponse: IndividualResponse | null = await addResponse(
              presentationId,
              pageId,
              responsePayload // Pass the payload directly as it contains user_id
            );
    
            if (!createdResponse || !createdResponse.response_id) {
                 logger.error(`addResponse did not return a valid response object for pres ${presentationId}, page ${pageId}`);
                 throw new Error('Failed to confirm response creation.'); 
            }
    
            logger.info(
              `Response added successfully for pres ${presentationId}, page ${pageId}. Response ID: ${createdResponse.response_id}`
            );
            callback(null, { success: true, responseId: createdResponse.response_id });
    
            // Trigger non-blocking summary update
            updateAndBroadcastSummary(presentationId, pageId)
              .catch((err: Error) => {
                logger.error(
                  `Error updating summary after response for ${presentationId}/${pageId}: ${err.message}`
                );
              });
    
          } catch (error: any) {
            logger.error(
              `Error processing 'submit_response' for pres ${presentationId}, page ${pageId}: ${error.message}`,
              error
            );
            // Ensure callback is called with error
            callback(error.message || 'Failed to process response.'); 
          }
        }
      );

    socket.on('disconnect', (reason: string) => {
      logger.info(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
       // If socket was in a presentation room, update count on disconnect
       const presentationId = socket.data.currentPresentationId;
       if (presentationId) {
           const room = io?.sockets.adapter.rooms.get(presentationId);
           // Timeout helps ensure leave happens before count update
           setTimeout(() => {
                const count = room ? room.size : 0;
                broadcastAudienceCount(presentationId, count);
           }, 50);
       }
    });
  });
}

function getIO(): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  if (!io) {
    throw new Error('Socket.IO server not initialized.');
  }
  return io;
}

// --- Broadcasting Functions ---

export function broadcastPageChange(presentationId: string, newPageId: string | null) {
  const payload: PageChangeEvent = { presentation_id: presentationId, new_page_id: newPageId };
  logger.info(`Broadcasting page_change to ${presentationId}:`, payload);
  getIO().to(presentationId).emit('page_change', payload);
}

export function broadcastSummaryUpdate(
  presentationId: string,
  pageId: string,
  summary: AudienceSummary,
  count: number
) {
  const payload: SummaryUpdateEvent = {
    presentation_id: presentationId,
    page_id: pageId,
    new_summary: summary,
    new_response_count: count,
  };
  logger.info(`Broadcasting summary_update to ${presentationId} for page ${pageId}`);
  getIO().to(presentationId).emit('summary_update', payload);
}

export function broadcastAudienceCount(presentationId: string, count: number) {
    const payload: AudienceCountUpdateEvent = { presentation_id: presentationId, count };
    // console.log(`Broadcasting audience_count_update to ${presentationId}:`, payload); // Can be noisy
    getIO().to(presentationId).emit('audience_count_update', payload);
}

export function broadcastNewQuestion(presentationId: string, pageId: string, question: NewQuestionEvent['question']) {
    const payload: NewQuestionEvent = { presentation_id: presentationId, page_id: pageId, question };
    logger.info(`Broadcasting new_question to ${presentationId} for page ${pageId}`);
    getIO().to(presentationId).emit('new_question', payload);
} 