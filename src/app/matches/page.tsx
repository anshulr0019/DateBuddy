'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const NEW_MATCHES = [
  { id: 1, name: 'Priya', age: 24, photo: 'https://picsum.photos/100/100?random=1', isNew: true },
  { id: 2, name: 'Ananya', age: 23, photo: 'https://picsum.photos/100/100?random=2', isNew: true },
];

const CONVERSATIONS = [
  {
    id: 1,
    name: 'Priya',
    age: 24,
    photo: 'https://picsum.photos/100/100?random=1',
    lastMessage: "Hey! How's it going?",
    timestamp: '2m ago',
    unread: 2,
    isActive: true,
  },
  {
    id: 2,
    name: 'Riya',
    age: 25,
    photo: 'https://picsum.photos/100/100?random=3',
    lastMessage: 'Would love to grab coffee sometime!',
    timestamp: '1h ago',
    unread: 0,
    isActive: false,
  },
  {
    id: 3,
    name: 'Ananya',
    age: 23,
    photo: 'https://picsum.photos/100/100?random=2',
    lastMessage: 'That sounds fun! 😄',
    timestamp: '3h ago',
    unread: 1,
    isActive: true,
  },
];

export default function MatchesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('matches');

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Messages</h1>
        <div className="flex items-center gap-3">
          <button className="text-xl">🔍</button>
          <button className="text-xl">⚙️</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* New Matches Section */}
        {NEW_MATCHES.length > 0 && (
          <div className="bg-white border-b border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-[#1A1A2E] mb-3">
              New Matches ({NEW_MATCHES.length})
            </h2>
            <div className="flex gap-4 overflow-x-auto">
              {NEW_MATCHES.map((match) => (
                <button
                  key={match.id}
                  onClick={() => router.push(`/chat/${match.id}`)}
                  className="flex-shrink-0 flex flex-col items-center"
                >
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-full bg-cover bg-center border-2 border-[#FF6B9D]"
                      style={{ backgroundImage: `url(${match.photo})` }}
                    />
                    {match.isNew && (
                      <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-[#FF6B9D] text-white text-xs rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-2 text-[#1A1A2E] font-medium">{match.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="bg-white">
          <h2 className="text-sm font-semibold text-[#1A1A2E] p-4 pb-2">
            Messages
          </h2>
          <div>
            {CONVERSATIONS.map((chat) => (
              <button
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-100 text-left"
              >
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${chat.photo})` }}
                  />
                  {chat.isActive && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#1A1A2E]">
                      {chat.name}, {chat.age}
                    </h3>
                    {chat.isActive && (
                      <span className="text-xs text-green-600">🟢</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-500">{chat.timestamp}</span>
                  {chat.unread > 0 && (
                    <span className="w-5 h-5 bg-[#FF6B9D] text-white text-xs rounded-full flex items-center justify-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {CONVERSATIONS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">No matches yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Keep swiping to find your match!
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="btn-primary"
            >
              Go to Discover
            </button>
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function BottomNav({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const router = useRouter();

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'matches') router.push('/matches');
    if (tab === 'profile') router.push('/profile');
    if (tab === 'discover') router.push('/discover');
  };

  return (
    <div className="bottom-nav">
      <button
        onClick={() => handleTabClick('discover')}
        className={`bottom-nav-item ${activeTab === 'discover' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-1">🔥</span>
        <span className="text-xs">Discover</span>
      </button>
      <button
        onClick={() => handleTabClick('matches')}
        className={`bottom-nav-item ${activeTab === 'matches' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-1">💬</span>
        <span className="text-xs">Matches</span>
      </button>
      <button
        onClick={() => handleTabClick('profile')}
        className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-1">👤</span>
        <span className="text-xs">Profile</span>
      </button>
    </div>
  );
}
