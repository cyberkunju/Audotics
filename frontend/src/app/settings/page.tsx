'use client';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* Add settings sections here */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">App Preferences</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Customize your Audotics experience
          </p>
          {/* Add preference controls here */}
        </div>
      </div>
    </div>
  );
} 