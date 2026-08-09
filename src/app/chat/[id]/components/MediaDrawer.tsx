'use client';

import React, { useState, useCallback } from 'react';

// Verified GIPHY GIF IDs by Category
const GIF_CATEGORIES: Record<string, { label: string; emoji: string; ids: string[] }> = {
  trending: {
    label: 'Trending',
    emoji: '🔥',
    ids: [
      'g9582DNuQppxC',
      '3o6ZtS562gG3b2Kz7y',
      '10C8dIIp4tW7x6',
      'l3fQf1OJPq0ypvL20',
      '5OqX4yV4fM5V',
      '3o7TKsjLu68u1l9xPq',
      'l0HlCqV35hdEG2GUo',
      '26FLdmIp6wJr9155u',
      'xT9IgG50Fb7Mi0',
      'l0HlHFRbuf6gqK55M',
      '3o6Zt62pekonUXp6jC',
      'l2JIdnN857v930m3K',
    ],
  },
  love: {
    label: 'Love',
    emoji: '❤️',
    ids: [
      '3o7TKsjLu68u1l9xPq',
      'l0HlCqV35hdEG2GUo',
      '26FLdmIp6wJr9155u',
      'l41YkxvU2bOiK7fUI',
      '26hpKMT7hPmdvBHtC',
      'l0K4mE8D7x57Z0N3y',
      '3o7TKoWXm3okO1kgHC',
      'l4FGlmp89HEXqvPf2',
    ],
  },
  funny: {
    label: 'Funny',
    emoji: '😂',
    ids: [
      '10C8dIIp4tW7x6',
      'l3fQf1OJPq0ypvL20',
      'xT9IgG50Fb7Mi0',
      '3o6Zt62pekonUXp6jC',
      'l0HlHFRbuf6gqK55M',
      '3o7TKSjRrfIPjeiVyM',
      'dE8GYg3G30rR',
      '3o7abKhOpu0NwenH3y',
    ],
  },
  party: {
    label: 'Party',
    emoji: '🎉',
    ids: [
      'g9582DNuQppxC',
      'l2JIdnN857v930m3K',
      '3o6ZtS562gG3b2Kz7y',
      'xT0xezQOW49vQD645y',
      'l0AMOCIun4d97Q1p6',
      '26u4b45b8K8',
    ],
  },
  cute: {
    label: 'Cute',
    emoji: '😍',
    ids: [
      '5OqX4yV4fM5V',
      '3o7TKoWXm3okO1kgHC',
      'l4FGpPxl9vL3',
      '26FLdmIp6wJr9155u',
      '3o7TKsjLu68u1l9xPq',
    ],
  },
};

// Verified Animated Sticker URLs
const STICKER_PACKS: { id: string; label: string; emoji: string; urls: string[] }[] = [
  {
    id: 'love',
    label: 'Love & Hearts',
    emoji: '❤️',
    urls: [
      'https://i.giphy.com/3o7TKsjLu68u1l9xPq.gif',
      'https://i.giphy.com/l0HlCqV35hdEG2GUo.gif',
      'https://i.giphy.com/26FLdmIp6wJr9155u.gif',
      'https://i.giphy.com/l41YkxvU2bOiK7fUI.gif',
      'https://i.giphy.com/26hpKMT7hPmdvBHtC.gif',
      'https://i.giphy.com/l0K4mE8D7x57Z0N3y.gif',
    ],
  },
  {
    id: 'cute',
    label: 'Cute & Vibe',
    emoji: '✨',
    urls: [
      'https://i.giphy.com/5OqX4yV4fM5V.gif',
      'https://i.giphy.com/3o7TKoWXm3okO1kgHC.gif',
      'https://i.giphy.com/g9582DNuQppxC.gif',
      'https://i.giphy.com/3o6ZtS562gG3b2Kz7y.gif',
      'https://i.giphy.com/l2JIdnN857v930m3K.gif',
    ],
  },
  {
    id: 'reactions',
    label: 'Reactions',
    emoji: '😂',
    urls: [
      'https://i.giphy.com/10C8dIIp4tW7x6.gif',
      'https://i.giphy.com/l3fQf1OJPq0ypvL20.gif',
      'https://i.giphy.com/xT9IgG50Fb7Mi0.gif',
      'https://i.giphy.com/3o6Zt62pekonUXp6jC.gif',
      'https://i.giphy.com/l0HlHFRbuf6gqK55M.gif',
    ],
  },
];

const EMOJI_CATEGORIES = [
  {
    name: 'Recent',
    items: ['❤️', '🥰', '😂', '🤗', '😅', '🔥', '✨', '☕', '💕', '😍', '🎉', '👍', '🙌', '💯', '😊', '🍕'],
  },
  {
    name: 'Smileys & Expressions',
    items: [
      '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗',
      '😙', '😚', '☺️', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮',
      '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑',
    ],
  },
  {
    name: 'Hearts & Gestures',
    items: [
      '❤️', '💖', '💗', '💓', '💕', '💘', '💝', '💜', '💙', '💚', '💛', '🧡', '🤍', '<ctrl42>', '🖤', '💔',
      '👍', '👎', '👏', '🙌', '🤝', '🙏', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👌',
    ],
  },
];

export type DrawerTab = 'emoji' | 'gif' | 'sticker';

interface MediaDrawerProps {
  initialTab?: DrawerTab;
  onPickEmoji: (emoji: string) => void;
  onPickGif: (url: string) => void;
}

export function MediaDrawer({ initialTab = 'emoji', onPickEmoji, onPickGif }: MediaDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab);
  const [selectedGifCategory, setSelectedGifCategory] = useState<string>('trending');
  const [gifQuery, setGifQuery] = useState('');
  const [stickerPack, setStickerPack] = useState<number>(0);

  // Filter GIFs based on category or query
  const getDisplayGifs = useCallback(() => {
    let ids: string[] = [];
    if (gifQuery.trim()) {
      const q = gifQuery.toLowerCase().trim();
      const matchedCat = Object.values(GIF_CATEGORIES).find(
        (c) => c.label.toLowerCase().includes(q) || c.emoji.includes(q)
      );
      if (matchedCat) {
        ids = matchedCat.ids;
      } else {
        // combine all ids
        const allIds = Object.values(GIF_CATEGORIES).flatMap((c) => c.ids);
        ids = Array.from(new Set(allIds));
      }
    } else {
      ids = GIF_CATEGORIES[selectedGifCategory]?.ids ?? GIF_CATEGORIES.trending.ids;
    }
    return ids.map((id) => ({ id, url: `https://i.giphy.com/${id}.gif` }));
  }, [gifQuery, selectedGifCategory]);

  const displayGifs = getDisplayGifs();

  return (
    <div className="z-30 bg-white/98 backdrop-blur-2xl border-t border-gray-200/80 shadow-2xl animate-popover-enter flex flex-col h-[285px] select-none">
      {/* ── WHATSAPP STYLE TOP TAB NAV BAR ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-2.5 pb-2 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'emoji'
                ? 'bg-white text-[#F43F5E] shadow-sm scale-102'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>😀</span>
            <span>Emoji</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gif')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'gif'
                ? 'bg-white text-[#F43F5E] shadow-sm scale-102'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>👾</span>
            <span>GIF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sticker')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'sticker'
                ? 'bg-white text-[#F43F5E] shadow-sm scale-102'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🏷️</span>
            <span>Stickers</span>
          </button>
        </div>

        {/* Quick search input when GIF tab is active */}
        {activeTab === 'gif' && (
          <div className="relative max-w-[150px] w-full">
            <input
              type="text"
              value={gifQuery}
              onChange={(e) => setGifQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 pl-3 pr-6 rounded-xl bg-white border border-gray-200 text-[12px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#F43F5E]"
            />
            {gifQuery && (
              <button
                type="button"
                onClick={() => setGifQuery('')}
                className="absolute right-2 top-2 text-gray-400 text-[10px] font-bold"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── TAB 1: EMOJI ── */}
      {activeTab === 'emoji' && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-3.5 py-2 space-y-3">
          {EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{cat.name}</p>
              <div className="grid grid-cols-8 gap-1">
                {cat.items.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onPickEmoji(emoji)}
                    className="h-8 w-8 text-[20px] hover:scale-125 active:scale-95 transition-transform flex items-center justify-center cursor-pointer rounded-xl hover:bg-rose-50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: GIF ── */}
      {activeTab === 'gif' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Category Chips */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 overflow-x-auto scrollbar-none">
            {Object.entries(GIF_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setGifQuery('');
                  setSelectedGifCategory(key);
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11.5px] font-bold flex-shrink-0 transition-all cursor-pointer ${
                  selectedGifCategory === key && !gifQuery
                    ? 'bg-[#F43F5E] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* GIF Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 py-2">
            <div className="grid grid-cols-3 gap-2">
              {displayGifs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPickGif(item.url)}
                  className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 border border-gray-200/60 cursor-pointer hover:scale-[1.04] active:scale-95 transition-transform shadow-2xs relative group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt="GIF"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-black text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md">Send</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: STICKERS ── */}
      {activeTab === 'sticker' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sticker Pack Tabs */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 overflow-x-auto scrollbar-none">
            {STICKER_PACKS.map((pack, idx) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setStickerPack(idx)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11.5px] font-bold flex-shrink-0 transition-all cursor-pointer ${
                  stickerPack === idx
                    ? 'bg-[#F43F5E] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{pack.emoji}</span>
                <span>{pack.label}</span>
              </button>
            ))}
          </div>

          {/* Sticker Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 py-2">
            <div className="grid grid-cols-3 gap-2">
              {STICKER_PACKS[stickerPack]?.urls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onPickGif(url)}
                  className="aspect-square overflow-hidden rounded-2xl bg-gray-50 border border-gray-200/60 p-2 cursor-pointer hover:scale-[1.06] active:scale-95 transition-transform shadow-2xs flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Sticker"
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
