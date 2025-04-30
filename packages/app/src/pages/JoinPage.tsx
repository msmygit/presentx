import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation } from '@presentx/shared'; // Import shared Presentation type
import { useTheme } from '@/store/themeStore';
import { Sun, Moon } from 'lucide-react';

function JoinPage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50';
  }, [isDarkMode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true);
    const trimmedCode = accessCode.trim().toUpperCase();

    if (!trimmedCode) {
      setError('Access code cannot be empty.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/presentations/join?access_code=${trimmedCode}`);

      if (response.status === 404) {
        setError('Invalid access code or presentation not active.');
      } else if (!response.ok) {
        setError('Could not join presentation. Please try again later.');
      } else {
        const data: { presentation: Presentation } = await response.json();
        // Navigate to the presentation page, passing the fetched presentation data
        navigate(`/presentation/${data.presentation._id}`, { state: { presentation: data.presentation } });
        return; // Exit function on success
      }
    } catch (err) {
      setError('An error occurred. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white dark:bg-gray-900 transition-colors duration-200">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all duration-200"
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
      
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PresentX
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Join a Presentation
          </h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleJoin} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg relative">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  if (error) setError(null); // Clear error on input change
                }}
                placeholder="Enter Access Code"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                maxLength={6} // Assuming a max length for access codes
                autoCapitalize="characters"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </span>
              ) : (
                'Join Presentation'
              )}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="text-center">
              <a href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Sign in as presenter?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinPage; 