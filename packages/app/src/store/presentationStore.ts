import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { getSocket, connectSocket, disconnectSocket, joinPresentationRoom, leavePresentationRoom, SubmitResponsePayload } from '@/lib/socket';
import { PageChangeEvent, SummaryUpdateEvent, AudienceCountUpdateEvent, NewQuestionEvent, Page, AudienceSummary, Presentation } from '@presentx/shared';

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
  error: string | null;
  isSocketInitialized: boolean;
  isSubmittingResponse: boolean;

  // Actions
  setPresentationId: (id: string) => void;
  initializeSocket: () => void;
  joinPresentation: (id: string) => Promise<void>; // Renamed from setPresentationId for clarity
  leaveCurrentPresentation: () => void;
  resetState: () => void;
  submitResponse: (pageId: string, responseData: any) => Promise<boolean>;
  initializeFromJoinData: (presentationData: Presentation) => void;

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
    console.log('Store: Initializing state from join data:', presentationData);
    // Find the initial page based on the provided presentation data
    const initialPageId = presentationData.current_page_id || presentationData.pages?.[0]?.page_id || null;
    const initialPage = presentationData.pages.find(p => p.page_id === initialPageId) || null;
    set({
      presentationId: presentationData._id,
      presentation: presentationData,
      currentPageId: initialPageId,
      currentPage: initialPage,
      error: null, // Clear any previous errors
      // Keep isJoining false, as this isn't the full join process
    });
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
      set({ currentPageId: payload.new_page_id, currentPage: newPage, currentSummary: null });
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
        connectSocket();
        // Join will be attempted via the 'connect' handler
    } else {
        console.log('Store: Socket already connected, emitting join_presentation...');
        try {
            const success = await joinPresentationRoom(id);
            if (success) {
                console.log('Store: Successfully joined room:', id);
                set(state => ({
                    isJoining: false,
                    error: null,
                    currentPageId: state.currentPageId || initialPageId,
                    currentPage: state.currentPage || initialPage
                }));
            } else {
                console.error('Store: Failed to join room:', id);
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

  submitResponse: async (pageId: string, responseData: any): Promise<boolean> => {
    const presentationId = get().presentationId;
    const socket = getSocket();
    if (!presentationId || !socket.connected || get().isSubmittingResponse) {
      console.warn('Cannot submit response. Conditions not met:', { presentationId, connected: socket.connected, submitting: get().isSubmittingResponse });
      return false;
    }

    set({ isSubmittingResponse: true });
    console.log('Store: Submitting response for page', pageId, 'data:', responseData);

    const payload: SubmitResponsePayload = {
        presentation_id: presentationId,
        page_id: pageId,
        user_id: getUserId(), // Get the generated/stored user ID
        response_data: responseData,
    };

    try {
        const success = await new Promise<boolean>((resolve) => {
            // Add a timeout
            const timeoutId = setTimeout(() => {
                console.error('Response submission timed out.');
                resolve(false);
            }, 5000); // 5 second timeout

            socket.emit('submit_response', payload, (ackSuccess: boolean) => {
                clearTimeout(timeoutId);
                console.log('Store: Response submission acknowledged:', ackSuccess);
                resolve(ackSuccess);
            });
        });
        
        set({ isSubmittingResponse: false });
        if (!success) {
            get()._setError('Failed to submit response. Please try again.');
        }
        return success;
    } catch (error) {
        console.error('Store: Error submitting response:', error);
        set({ isSubmittingResponse: false, error: 'An error occurred while submitting the response.' });
        return false;
    }
  },

})); 