import React from 'react';
import DarkModeToggle from '../components/DarkModeToggle';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="p-8">
        <h1 className="text-black dark:text-white text-2xl">
          This text should change color!
        </h1>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mt-4">
          <p className="text-gray-800 dark:text-gray-200">
            This box should change background and text color
          </p>
        </div>
        {/* Your DarkModeToggle component */}
        <DarkModeToggle />
      </div>
    </div>
  );
}