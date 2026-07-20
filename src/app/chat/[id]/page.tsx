'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const SAMPLE_MESSAGES = [
  { id: 1, senderId: 2, text: "Hey! How's it going?", timestamp: '10:30 AM', isRead: true },
  { id: 2, senderId: 1, text: "Hi! I'm good, thanks! How about you?", timestamp: '10:32 AM', isRead: true },
  { id: 3, senderId: 2, text: "I saw you like photography! What's your favorite spot in the city? 📸", timestamp: '10:35 AM', isRead: true },
  { id: 4, senderId: 1, text: "Marine Drive during sunset is unbeatable! 🌅", timestamp: '10:37 AM', isRead: false },
];

const SUGGESTED_OPENERS = [
  "I saw you like street photography! What's your favorite spot? 📸",
  "Your bio made me laugh! Tell me more about your weekend plans",
  "We both love music 🎵 What are you listening to lately?",
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = 1;
  const otherUser = {
    id: 2,
    name: 'Priya',
    age: 24,
    photo: 'https://picsum.photos/100/100?random=1',
    isActive: true,
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      senderId: currentUserId,
      text: inputText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleSuggestedOpener = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 flex-1">
          <button onClick={() => router.back()} className="text-2xl">
            ←
          </button>
          <div
            className="w-10 h-10 rounded-full bg-cover bg-center cursor-pointer"
            style={{ backgroundImage: `url(${otherUser.photo})` }}
            onClick={() => router.push(`/profile/${otherUser.id}`)}
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-[#1A1A2E] truncate">
              {otherUser.name}, {otherUser.age}
            </h2>
            <p className="text-xs text-green-600">
              {otherUser.isActive ? 'Active now 🟢' : 'Active 2h ago'}
            </p>
          </div>
        </div>
        <button className="text-xl">⋮</button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-[#1A1A2E] mb-6">Break the ice!</h3>
            
            <div className="space-y-3 w-full">
              <p className="text-sm font-medium text-gray-600">Suggested openers:</p>
              {SUGGESTED_OPENERS.map((opener, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedOpener(opener)}
                  className="card w-full text-left text-sm hover:ring-2 hover:ring-[#FF6B9D] transition-all"
                >
                  {opener}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const isMine = message.senderId === currentUserId;
          const showTimestamp = index === 0 || 
            messages[index - 1].timestamp !== message.timestamp;

          return (
            <div key={message.id}>
              {showTimestamp && (
                <div className="text-center text-xs text-gray-500 my-4">
                  {message.timestamp}
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                  {message.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-24 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
            <button className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-2xl">
                📷
              </div>
              <span className="text-xs">Camera</span>
            </button>
            <button className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-2xl">
                🖼️
              </div>
              <span className="text-xs">Gallery</span>
            </button>
            <button className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-2xl">
                🎤
              </div>
              <span className="text-xs">Voice</span>
            </button>
            <button className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-2xl">
                GIF
              </div>
              <span className="text-xs">GIF</span>
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="text-2xl"
          >
            +
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 input-field"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`text-2xl transition-all ${
              inputText.trim() ? 'text-[#FF6B9D]' : 'text-gray-300'
            }`}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
