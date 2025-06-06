'use client';

import { useState, useEffect } from 'react';

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(true); // Default to dark since your app is dark by default

  useEffect(() => {
    // Check if there's a saved preference, otherwise default to dark
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      // Force light mode styles
      document.documentElement.style.backgroundColor = 'white';
      document.documentElement.style.color = 'black';
      document.body.style.backgroundColor = 'white';
      document.body.style.color = 'black';
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      // Force dark mode styles
      document.documentElement.style.backgroundColor = '#1f2937';
      document.documentElement.style.color = 'white';
      document.body.style.backgroundColor = '#1f2937';
      document.body.style.color = 'white';
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      // Switch to light mode
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      
      // Force light mode styles
      document.documentElement.style.backgroundColor = 'white';
      document.documentElement.style.color = 'black';
      document.body.style.backgroundColor = 'white';
      document.body.style.color = 'black';
      
      localStorage.setItem('theme', 'light');
      setIsDark(false);
      console.log('Switched to light mode');
    } else {
      // Switch to dark mode
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      
      // Force dark mode styles
      document.documentElement.style.backgroundColor = '#1f2937';
      document.documentElement.style.color = 'white';
      document.body.style.backgroundColor = '#1f2937';
      document.body.style.color = 'white';
      
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
      console.log('Switched to dark mode');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Sun Button (Light Mode) */}
      <button
        onClick={toggleTheme}
        disabled={!isDark}
        className={`p-3 rounded-lg transition-all duration-300 ${
          !isDark
            ? 'bg-yellow-400 text-yellow-900 shadow-lg ring-2 ring-yellow-300 transform scale-110'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500 opacity-70'
        }`}
        aria-label="Switch to light mode"
        title="Light Mode"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Moon Button (Dark Mode) */}
      <button
        onClick={toggleTheme}
        disabled={isDark}
        className={`p-3 rounded-lg transition-all duration-300 ${
          isDark
            ? 'bg-blue-500 text-blue-100 shadow-lg ring-2 ring-blue-400 transform scale-110'
            : 'bg-gray-200 text-gray-500 hover:bg-gray-300 opacity-70'
        }`}
        aria-label="Switch to dark mode"
        title="Dark Mode"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
          />
        </svg>
      </button>
      
      {/* Debug info - remove this after testing */}
      <span className="text-xs text-gray-500 ml-2">
        Current: {isDark ? 'Dark' : 'Light'}
      </span>
    </div>
  );
};

export default DarkModeToggle;