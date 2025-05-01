import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/store/themeStore';
import Header from '@/components/Header';
import { Plus, Calendar, Clock, Trash2 } from 'lucide-react';

interface Presentation {
  _id: string;
  presentation_id: string;
  title: string;
  description?: string;
  state: 'draft' | 'active' | 'completed';
  created_at: string;
}

const PresenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPresentations();
  }, []);

  const fetchPresentations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8080/api/presentations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        // Try to get error message from backend for non-401 errors
        let errorMessage = `Failed to load presentations (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && (errorData.message || errorData.error)) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response JSON:', jsonError);
        }
        // Set the error state directly instead of throwing
        setError(errorMessage);
        return; // Stop execution after setting error
      }

      const data = await response.json();
      setPresentations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch presentations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a presentation title');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8080/api/presentations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to create presentation');
      }

      const data = await response.json();
      setPresentations(prevPresentations => [...prevPresentations, data]);
      setTitle('');
      setDescription('');
      navigate(`/presenter/${data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create presentation');
    } finally {
      setIsCreating(false);
    }
  };

  // --- New Handler for Deleting Presentation ---
  const handleDeletePresentation = async (presentationId: string) => {
    if (!window.confirm('Are you sure you want to delete this presentation? This action cannot be undone and will delete all associated responses.')) {
      return;
    }

    setError(null);
    setIsLoading(true); // Reuse loading state for simplicity

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:8080/api/presentations/${presentationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        } else if (response.status === 404) {
          throw new Error('Presentation not found or already deleted.');
        }
        
        // Try to get more specific error
        let errorMessage = 'Failed to delete presentation';
        try {
          const errorData = await response.json();
          if (errorData && (errorData.message || errorData.error)) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch { /* Ignore parse error */ }
        throw new Error(errorMessage);
      }

      // If deletion was successful (status 204)
      setPresentations(prev => prev.filter(p => p._id !== presentationId));
      console.log(`Successfully deleted presentation ${presentationId}`);
      // Optionally show a success message

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete presentation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Presentation Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-all duration-200">
            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Create New Presentation
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreatePresentation} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Presentation Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm placeholder-neutral-400 dark:placeholder-neutral-500 dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter a descriptive title"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="appearance-none block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm placeholder-neutral-400 dark:placeholder-neutral-500 dark:bg-neutral-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Add more details about your presentation"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {isCreating ? 'Creating...' : 'Create Presentation'}
                </button>
              </form>
            </div>
          </div>

          {/* Existing Presentations Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-all duration-200">
            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Your Presentations
              </h2>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : presentations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 dark:text-neutral-400">
                    No presentations yet. Create your first one!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {presentations.map((presentation) => (
                    <div
                      key={presentation._id}
                      className="group relative p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all duration-200 bg-white dark:bg-neutral-800"
                    >
                      <div 
                        onClick={() => navigate(`/presenter/${presentation._id}`)} 
                        className="cursor-pointer"
                        >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary-light">
                              {presentation.title}
                            </h3>
                            {presentation.description && (
                              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                {presentation.description}
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-1 ${
                            presentation.state === 'draft'
                              ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
                              : presentation.state === 'active'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-800'
                              : 'bg-neutral-50 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600'
                          }`}>
                            {presentation.state.charAt(0).toUpperCase() + presentation.state.slice(1)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center text-sm text-neutral-500 dark:text-neutral-400 space-x-4">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 text-neutral-400 dark:text-neutral-500" />
                            {new Date(presentation.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 text-neutral-400 dark:text-neutral-500" />
                            {new Date(presentation.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      {/* Delete Button - positioned absolutely */}
                      <button
                        onClick={(e) => { 
                          e.stopPropagation();
                          handleDeletePresentation(presentation._id);
                        }}
                        className="absolute bottom-1 right-1 p-1.5 rounded-full text-neutral-400 dark:text-neutral-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-neutral-800"
                        title="Delete Presentation"
                        aria-label="Delete Presentation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PresenterPage; 