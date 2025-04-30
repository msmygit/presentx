import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PresenterLivePage: React.FC = () => {
  const { id: presentationId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();

  // TODO: Implement live presentation controls
  // - Connect to WebSocket using presentationId and sessionId?
  // - Fetch presentation details (maybe reuse fetchPresentation from ManagePage?)
  // - Display current active page
  // - Show audience count/responses
  // - Add controls for next/previous page
  // - Add button to end presentation (update state to 'completed')

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Presenter Live View</h1>
        <p className="text-gray-700 mb-2">Presentation ID: <span className="font-mono">{presentationId}</span></p>
        <p className="text-gray-700 mb-4">Session ID: <span className="font-mono">{sessionId}</span></p>
        
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p>Live presentation controls and view need to be implemented here.</p>
        </div>

        <button 
          onClick={() => navigate(`/presenter/${presentationId}`)} 
          className="mr-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Manage Page
        </button>
        {/* TODO: Add End Presentation Button */}
        <button 
          // onClick={handleEndPresentation} 
          disabled
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          End Presentation
        </button>
      </div>
    </div>
  );
};

export default PresenterLivePage; 