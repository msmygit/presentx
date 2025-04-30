import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  AudienceSummary,
  PageChangeEvent,
  SummaryUpdateEvent,
  AudienceCountUpdateEvent,
  NewQuestionEvent,
} from '@presentx/shared';

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
  // Add other client events if needed, e.g., presenter controls
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
    console.log(`Socket connected: ${socket.id}`);

    // --- Presentation Room Logic ---
    socket.on('join_presentation', async (presentationId: string, callback: (success: boolean) => void) => {
      try {
        // Optional: Add validation here - check if presentation exists/is active
        console.log(`Socket ${socket.id} joining presentation ${presentationId}`);
        await socket.join(presentationId); // Join a room specific to the presentation
        socket.data.currentPresentationId = presentationId;

        // Update and broadcast audience count
        const room = io?.sockets.adapter.rooms.get(presentationId);
        const count = room ? room.size : 0;
        broadcastAudienceCount(presentationId, count);

        // --> Emit confirmation back to the client that joined <--
        console.log(`[Socket ${socket.id}] Emitting joined_presentation for room ${presentationId}`);
        socket.emit('joined_presentation', { audienceCount: count });

        if (callback) callback(true);
      } catch (err) {
        console.error(`Error joining presentation ${presentationId}:`, err);
        if (callback) callback(false);
        socket.emit('error', { message: 'Failed to join presentation room.' });
      }
    });

    socket.on('leave_presentation', (presentationId: string) => {
        console.log(`Socket ${socket.id} leaving presentation ${presentationId}`);
        socket.leave(presentationId);
        socket.data.currentPresentationId = undefined;
         // Update and broadcast audience count
        const room = io?.sockets.adapter.rooms.get(presentationId);
        const count = room ? room.size : 0;
        broadcastAudienceCount(presentationId, count);
    });
    // --- End Presentation Room Logic ---

    socket.on('disconnect', (reason: string) => {
      console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
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
  console.log(`Broadcasting page_change to ${presentationId}:`, payload);
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
  console.log(`Broadcasting summary_update to ${presentationId} for page ${pageId}`);
  getIO().to(presentationId).emit('summary_update', payload);
}

export function broadcastAudienceCount(presentationId: string, count: number) {
    const payload: AudienceCountUpdateEvent = { presentation_id: presentationId, count };
    // console.log(`Broadcasting audience_count_update to ${presentationId}:`, payload); // Can be noisy
    getIO().to(presentationId).emit('audience_count_update', payload);
}

export function broadcastNewQuestion(presentationId: string, pageId: string, question: NewQuestionEvent['question']) {
    const payload: NewQuestionEvent = { presentation_id: presentationId, page_id: pageId, question };
    console.log(`Broadcasting new_question to ${presentationId} for page ${pageId}`);
    getIO().to(presentationId).emit('new_question', payload);
} 