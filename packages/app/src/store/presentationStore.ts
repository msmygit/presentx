import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { getSocket, connectSocket, disconnectSocket, joinPresentationRoom, leavePresentationRoom } from '@/lib/socket';
import { PageChangeEvent, SummaryUpdateEvent, AudienceCountUpdateEvent, NewQuestionEvent, Page, AudienceSummary, Presentation, SubmitResponseRequest, IndividualResponse } from '@presentx/shared';

// Need to define the event interfaces used by the store
// These should ideally match the definitions in server/src/utils/socket.ts
interface ServerToClientListeners {
  page_change: (payload: PageChangeEvent) => void;
  summary_update: (payload: SummaryUpdateEvent) => void;
  audience_count_update: (payload: AudienceCountUpdateEvent) => void;
  new_question: (payload: NewQuestionEvent) => void;
  joined_presentation: (payload: { audienceCount: number }) => void; // <-- Added definition
  error: (payload: { message: string }) => void;
  // Add other server-to-client events the store needs to listen to
}

// Define ClientToServerEvents locally if not imported from shared
// Ensure this EXACTLY matches the server definition
interface ClientToServerEvents {
  join_presentation: (presentationId: string) => void;
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

// Interface for the store's state
interface PresentationState {
  presentationId: string | null;
  presentation: Presentation | null; // Store the full presentation details
  currentPageId: string | null;
  currentPage: Page | null;
  currentSummary: AudienceSummary | null;
  audienceCount: number;
  questions: NewQuestionEvent[];
  isConnected: boolean;
  isJoining: boolean;
  isUpdatingPage: boolean; // Track page update state
  error: string | null;
  isSocketInitialized: boolean;
  isSubmittingResponse: boolean;

  // Actions
  setPresentationId: (id: string) => void;
  initializeSocket: () => void;
  joinPresentation: (id: string) => Promise<void>; // Renamed from setPresentationId for clarity
  leaveCurrentPresentation: () => void;
  resetState: () => void;
  submitResponse: (pageId: string, responseData: SubmitResponseRequest['response_data']) => Promise<boolean>;
  initializeFromJoinData: (presentationData: Presentation) => void;
  setCurrentAudiencePage: (pageId: string | null) => Promise<boolean>; // <-- New Action

  // Internal setters (optional, could be part of listeners)
  _setIsConnected: (status: boolean) => void;
  _setError: (message: string | null) => void;
  _setCurrentPage: (page: Page | null) => void;
  _setCurrentSummary: (summary: AudienceSummary | null) => void;
  _setAudienceCount: (count: number) => void;
  _addQuestion: (question: NewQuestionEvent) => void;
  _setPresentationData: (presentation: Presentation | null) => void; // For loading initial data
}

const initialState = {
  presentationId: null,
  presentation: null,
  currentPageId: null,
  currentPage: null,
  currentSummary: null,
  audienceCount: 0,
  questions: [],
  isConnected: false,
  isJoining: false,
  error: null,
  isSocketInitialized: false,
  isSubmittingResponse: false,
  isUpdatingPage: false, // Initial state
};

// --- Simple User ID Management --- 
// In a real app, this would involve proper authentication / session management
let userId = sessionStorage.getItem('presentx_user_id');
if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('presentx_user_id', userId);
}
console.log("Using User ID:", userId);
const getUserId = () => userId!;
// -------------------------------

export const usePresentationStore = create<PresentationState>((set, get) => ({
  ...initialState,

  initializeFromJoinData: (presentationData) => {
    console.log('[Store initializeFromJoinData] Initializing with data:', presentationData?._id);
    const initialPageId = presentationData?.current_page_id || presentationData?.pages?.[0]?.page_id || null;
    const initialPage = presentationData?.pages.find(p => p.page_id === initialPageId) || null;
    set({
      presentationId: presentationData?._id ?? null, // Handle potential null presentationData
      presentation: presentationData,
      currentPageId: initialPageId,
      currentPage: initialPage,
      isJoining: false,
      error: null,
    });
    // Connect socket AFTER setting presentation data
    get().initializeSocket();
    if (presentationData?._id) { // Only connect/join if we have an ID
        if (!getSocket().connected) {
            connectSocket(); 
        }
        joinPresentationRoom(presentationData._id).catch(err => {
            console.error('[Store initializeFromJoinData] Error auto-joining room:', err);
            set({ error: 'Failed to sync with presentation.' });
        });
    }
  },

  setPresentationId: (id) => {
    // Deprecated, use joinPresentation
    console.warn('setPresentationId is deprecated, use joinPresentation');
    set({ presentationId: id });
  },

  initializeSocket: () => {
    if (get().isSocketInitialized) return;

    const socket = getSocket();
    console.log('Initializing socket listeners in Zustand store...');

    // --- Event Handlers --- 
    const handleConnect = () => {
      console.log('Store: Socket connected');
      set({ isConnected: true, error: null });
      // Only rejoin if NOT already in the process of joining
      // Re-join room if we were connected to one
      const currentId = get().presentationId;
      const isJoining = get().isJoining;
      if (currentId && !isJoining) {
        console.log('Store: Connect handler attempting re-join...'); // Add log
        joinPresentationRoom(currentId).then(success => {
           if(success) {
              console.log('Store: Re-joined room successfully after reconnect:', currentId);
              set({ isJoining: false, error: null });
           } else {
              console.error('Store: Failed to re-join room after reconnect:', currentId);
               set({ isJoining: false, error: 'Failed to rejoin presentation room after reconnection.' });
           }
        });
      }
    };

    const handleDisconnect = (reason: Socket.DisconnectReason) => {
      console.log('Store: Socket disconnected:', reason);
      set({ isConnected: false, isJoining: false, error: 'Disconnected from server.' });
      // Consider if state should be fully reset here
    };

    const handleConnectError = (err: Error) => {
      console.error('Store: Socket connection error:', err.message);
      let errorMessage = `Connection failed: ${err.message}`;
      
      // Provide more specific error message for common issues
      if (err.message.includes('xhr poll error') || err.message.includes('websocket error')) {
        errorMessage = 'Unable to connect to the presentation server. Please check if the server is running and that you have network connectivity.';
      }
      
      set({ isConnected: false, isJoining: false, error: errorMessage });
    };

    const handlePageChange = (payload: PageChangeEvent) => {
      console.log('Store: Page change event:', payload);
      const presentation = get().presentation;
      const newPage = presentation?.pages.find(p => p.page_id === payload.new_page_id) || null;
      // Find the summary for the new page from the main presentation object
      const newSummary = newPage?.audience_summary || null; 
      console.log('Store: Setting new page and its existing summary:', newPage?.page_id, newSummary);
      set({
         currentPageId: payload.new_page_id,
         currentPage: newPage,
         currentSummary: newSummary // <-- Set summary from the page data
      });
    };

    const handleSummaryUpdate = (payload: SummaryUpdateEvent) => {
      console.log('Store: Summary update event:', payload);
      if (payload.page_id === get().currentPageId) {
        set({ currentSummary: payload.new_summary });
      }
    };

    const handleAudienceUpdate = (payload: AudienceCountUpdateEvent) => {
      console.log('Store: Audience count update event:', payload);
      set({ audienceCount: payload.count });
    };

    // ---> Add Listener for Join Confirmation <---
    const handleJoinedPresentation = (payload: { audienceCount: number }) => {
        console.log('Store: *** Received joined_presentation event! ***', payload);
        set({ isJoining: false, audienceCount: payload.audienceCount, error: null });
    };
    // -------------------------------------------

    const handleNewQuestion = (payload: NewQuestionEvent) => {
      console.log('Store: New question event:', payload);
      set(state => ({ questions: [...state.questions, payload] }));
    };

    const handleErrorEvent = (payload: { message: string }) => {
      console.error('Store: Server error event:', payload.message);
      set({ error: `Server error: ${payload.message}` });
    };

    // Add listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('page_change', handlePageChange);
    socket.on('summary_update', handleSummaryUpdate);
    socket.on('audience_count_update', handleAudienceUpdate);
    socket.on('new_question', handleNewQuestion);
    socket.on('error', handleErrorEvent);
    socket.on('joined_presentation', handleJoinedPresentation); // <-- Register listener

    set({ isSocketInitialized: true });
    
    // Optional: Return cleanup function for advanced scenarios
    // return () => { ... remove listeners ... }
  },

  joinPresentation: async (id: string) => {
    if (get().isJoining || get().presentationId === id) return;
    
    console.log('Store: Attempting to join presentation:', id);
    set({ isJoining: true, error: null, presentationId: id });

    let fetchedPresentation: Presentation | null = get().presentation; // Get existing data first

    // Only fetch if presentation data isn't already loaded (e.g., by initializeFromJoinData)
    if (!fetchedPresentation || fetchedPresentation._id !== id) {
      console.error('No presentation data for ID:', id);
      set({ 
        isJoining: false, 
        error: 'You must join a presentation using an access code, not directly by ID.', 
        presentationId: null 
      });
      return; // Don't proceed with joining if we don't have the data
    }

    console.log('Store: Using pre-loaded presentation data:', fetchedPresentation._id);

    // Find the initial page based on the data
    const initialPageId = fetchedPresentation.current_page_id || fetchedPresentation.pages?.[0]?.page_id || null;
    const initialPage = fetchedPresentation.pages.find(p => p.page_id === initialPageId) || null;

    // Set initial page immediately
    if (initialPage) {
        set({ currentPageId: initialPageId, currentPage: initialPage });
    }

    const socket = getSocket();
    get().initializeSocket(); // Ensure listeners are attached

    if (!socket.connected) {
        console.log('Store: Socket not connected, attempting connection...');
        // connectSocket(); // <-- Remove this call
        // Relying on autoConnect: true now. If not connected, an error should occur or connect handler will manage.
    } else {
        console.log('Store: Socket already connected, emitting join_presentation...');
        try {
            const success = await joinPresentationRoom(id);
            if (success) {
                console.log('Store: Successfully emitted join event for room:', id);
            } else {
                console.error('Store: Failed to join room (socket lib returned false):', id);
                set({ isJoining: false, error: 'Failed to join presentation. Please try again.', presentationId: null });
            }
        } catch (err) {
            console.error('Store: Error joining room:', err);
            set({ isJoining: false, error: 'An error occurred while joining.', presentationId: null });
        }
    }
  },

  leaveCurrentPresentation: () => {
    const id = get().presentationId;
    if (id) {
      console.log('Store: Leaving presentation:', id);
      leavePresentationRoom(id);
      // Don't disconnect globally here, just leave the room
      // Reset state related to the specific presentation
      set({
        presentationId: null,
        presentation: null,
        currentPageId: null,
        currentPage: null,
        currentSummary: null,
        audienceCount: 0, // Or fetch global count?
        questions: [],
        isJoining: false,
        error: null
      });
    }
  },

  resetState: () => {
    get().leaveCurrentPresentation();
    // Potentially disconnect socket too if resetting everything
    // disconnectSocket();
    set({ ...initialState, isSocketInitialized: get().isSocketInitialized }); // Keep socket initialized status
  },
  
  // --- Internal setters (Exposed for potential direct use or testing) ---
  _setIsConnected: (status) => set({ isConnected: status }),
  _setError: (message) => set({ error: message }),
  _setCurrentPage: (page) => set({ currentPage: page, currentPageId: page?.page_id ?? null }),
  _setCurrentSummary: (summary) => set({ currentSummary: summary }),
  _setAudienceCount: (count) => set({ audienceCount: count }),
  _addQuestion: (question) => set(state => ({ questions: [...state.questions, question] })),
  _setPresentationData: (presentation) => set({ presentation }),

  submitResponse: async (pageId: string, responseData: SubmitResponseRequest['response_data']): Promise<boolean> => {
    const presentationId = get().presentationId;
    const socket: Socket<any, ClientToServerEvents> = getSocket(); // Keep explicit typing
    if (!presentationId || !socket.connected || get().isSubmittingResponse) {
      console.warn('Cannot submit response. Conditions not met:', { presentationId, connected: socket.connected, submitting: get().isSubmittingResponse });
      return false;
    }

    set({ isSubmittingResponse: true });
    console.log('Store: Submitting response for page', pageId, 'data:', responseData);

    const responsePayload: SubmitResponseRequest = {
        user_id: getUserId(),
        response_data: responseData,
    };

    // Construct payload matching server expectations
    const eventPayload = {
        presentationId: presentationId!, 
        pageId: pageId,
        responsePayload: responsePayload,
    };

    try {
        const result = await new Promise<{ success: boolean; responseId?: string } | { error: string }>((resolve) => {
            const timeoutId = setTimeout(() => {
                console.error('Response submission timed out.');
                resolve({ error: 'timeout' });
            }, 5000);

            // Emit with explicit event name type and inline callback with correct signature
            socket.emit<'submit_response'>(
                'submit_response',
                eventPayload,
                // Define callback inline with correct signature
                (error: string | null, ackResult?: { success: boolean; responseId?: string }) => {
                    clearTimeout(timeoutId); // timeoutId is now in scope
                    if (error) {
                        resolve({ error: error }); // resolve is now in scope
                    } else if (ackResult?.success) {
                        resolve({ success: true, responseId: ackResult.responseId });
                    } else {
                        resolve({ error: 'unknown_failure' });
                    }
                }
            );
        });

        set({ isSubmittingResponse: false });

        // Check the resolved result object
        if ('error' in result) {
            let userMessage = 'Failed to submit response. Please try again.';
            if (result.error === 'timeout') {
                userMessage = 'Response submission timed out. Please try again.';
            }
            get()._setError(userMessage);
            return false;
        } else {
             // Success!
             console.log(`Successfully submitted response ${result.responseId}`);
            return true;
        }

    } catch (error) {
        console.error('Store: Error in submitResponse promise/logic:', error);
        set({ isSubmittingResponse: false, error: 'An unexpected error occurred while submitting the response.' });
        return false;
    }
  },

  // --- New Action: Set Current Audience Page (Presenter Action) ---
  setCurrentAudiencePage: async (pageId): Promise<boolean> => {
    const currentId = get().presentationId;
    if (!currentId || get().isUpdatingPage) {
        console.warn('Cannot set current page. Conditions not met:', { currentId, isUpdating: get().isUpdatingPage });
        return false;
    }
    // Prevent setting to the same page
    if (pageId === get().currentPageId) {
        console.log("Already on page:", pageId);
        return true;
    }

    set({ isUpdatingPage: true, error: null });
    console.log(`Store: Setting current audience page to ${pageId} for presentation ${currentId}`);

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found.');
        }

        const response = await fetch(`http://localhost:8080/api/presentations/${currentId}/current-page`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ pageId: pageId }), // Send pageId in the body
        });

        if (!response.ok) {
            let errorMessage = 'Failed to set current page';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch { /* Ignore parsing error */ }
             if (response.status === 401 || response.status === 403) {
                // Special handling for auth errors? Redirect?
                 errorMessage = 'Authentication failed. Please log in again.';
            }
            throw new Error(errorMessage);
        }

        const updatedPresentation: Presentation = await response.json();
        
        // --- Update store state based on successful API response ---
        // The backend should broadcast the 'page_change' event, 
        // which the handlePageChange listener will pick up to update currentPage.
        // We just need to update the presentation object itself if needed,
        // and reset the loading/error state.
        set({ 
            presentation: updatedPresentation, // Update the main presentation object
            isUpdatingPage: false, 
            error: null 
        });
        console.log(`Store: Successfully set current audience page to ${pageId}`);
        return true;

    } catch (error: any) {
        console.error('Store: Error setting current audience page:', error);
        set({ isUpdatingPage: false, error: error.message || 'An unknown error occurred.' });
        return false;
    }
  },
  // -------------------------------------------------------------

})); 