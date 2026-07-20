'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState({
    push: true,
    matches: true,
    messages: true,
    likes: false,
  });
  const [onlyVerified, setOnlyVerified] = useState(false);

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white">
        <button onClick={() => router.back()} className="text-2xl mr-3">
          ←
        </button>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Settings</h1>
      </div>

      {/* Main Content */}
      <div className="pb-6">
        {/* Account Settings */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold text-[#1A1A2E] mb-4">Account Settings</h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Phone Number</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">+91 98765*****</span>
                <span className="text-gray-400">›</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Email</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Add email</span>
                <span className="text-gray-400">›</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Connected Accounts</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Discovery Settings */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold text-[#1A1A2E] mb-4">Discovery Settings</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Age Range</span>
                <span className="text-sm text-gray-500">18 - 30</span>
              </div>
              <input
                type="range"
                className="w-full"
                min="18"
                max="50"
                defaultValue="30"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Maximum Distance</span>
                <span className="text-sm text-gray-500">50 km</span>
              </div>
              <input
                type="range"
                className="w-full"
                min="5"
                max="100"
                step="5"
                defaultValue="50"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Only show verified profiles</span>
              <label className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-full h-full bg-gray-300 peer-checked:bg-[#FF6B9D] rounded-full peer transition-all"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-6"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold text-[#1A1A2E] mb-4">Notifications</h3>
          <div className="space-y-4">
            {[
              { key: 'push', label: 'Push Notifications' },
              { key: 'matches', label: 'New Matches' },
              { key: 'messages', label: 'Messages' },
              { key: 'likes', label: 'Likes' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-gray-700">{item.label}</span>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      [item.key]: e.target.checked,
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-300 peer-checked:bg-[#FF6B9D] rounded-full peer transition-all"></div>
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-6"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy & Safety */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold text-[#1A1A2E] mb-4">Privacy & Safety</h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Blocked Users</span>
              <span className="text-gray-400">›</span>
            </button>
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Two-Factor Authentication</span>
              <span className="text-gray-400">›</span>
            </button>
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Privacy Policy</span>
              <span className="text-gray-400">›</span>
            </button>
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Terms of Service</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Premium */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold text-[#1A1A2E] mb-4">Premium</h3>
          <button
            onClick={() => router.push('/premium')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="text-gray-700">Upgrade to Premium</span>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        {/* About */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold text-[#1A1A2E] mb-4">About</h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Help & Support</span>
              <span className="text-gray-400">›</span>
            </button>
            <button className="w-full flex items-center justify-between py-2">
              <span className="text-gray-700">Community Guidelines</span>
              <span className="text-gray-400">›</span>
            </button>
            <div className="py-2">
              <span className="text-gray-500 text-sm">App Version 1.0.0</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 mt-6">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to logout?')) {
                localStorage.clear();
                router.push('/welcome');
              }
            }}
            className="w-full py-3 text-red-500 font-semibold"
          >
            Logout
          </button>
        </div>

        {/* Delete Account */}
        <div className="px-4 mt-2">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                localStorage.clear();
                router.push('/welcome');
              }
            }}
            className="w-full py-3 text-red-600 font-semibold"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
