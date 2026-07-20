'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: 'discover', label: 'Discover', icon: '🔥', path: '/discover' },
    { id: 'meetups', label: 'Meetups', icon: '📅', path: '/discover/meetups' },
    { id: 'messages', label: 'Messages', icon: '💬', path: '/matches', badge: 2 },
    { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
  ];

  const getActiveTab = () => {
    if (pathname.startsWith('/discover') && !pathname.includes('meetups')) return 'discover';
    if (pathname.includes('meetups')) return 'meetups';
    if (pathname.startsWith('/matches') || pathname.startsWith('/chat')) return 'messages';
    if (pathname.startsWith('/profile')) return 'profile';
    return 'discover';
  };

  const activeTab = getActiveTab();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
              activeTab === tab.id ? 'text-[#FF6B9D]' : 'text-gray-400'
            }`}
          >
            <span className="text-2xl mb-0.5">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
            {tab.badge && activeTab !== tab.id && (
              <span className="absolute top-1 right-1/4 w-4 h-4 bg-[#FF6B9D] text-white text-[9px] rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}