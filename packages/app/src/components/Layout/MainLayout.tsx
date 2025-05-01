import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // TODO: Add Header, Footer, Sidebar components here if needed
  return (
    <div className="flex flex-col min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      {/* Example Header - Using primary background for dark mode? Or neutral? */}
      <header className="bg-white dark:bg-neutral-800 shadow p-4">
        <h1 className="text-xl font-semibold text-primary dark:text-primary-light">Presentation App</h1>
        {/* Add navigation, theme toggle, user menu etc. */}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>

      {/* Example Footer */}
      <footer className="bg-neutral-200 dark:bg-neutral-700 p-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
        © 2025 PresentX
      </footer>
    </div>
  );
};

export default MainLayout; 