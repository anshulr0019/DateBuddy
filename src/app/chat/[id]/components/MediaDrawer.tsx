'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export type DrawerTab = 'emoji' | 'gif' | 'sticker';

const GIPHY_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh';
const GIPHY_BASE = 'https://api.giphy.com/v1';

const GIF_CATEGORIES = [
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'love', label: 'Love', emoji: '❤️' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'cute', label: 'Cute', emoji: '😍' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'reaction', label: 'Reactions', emoji: '👀' },
];

const STICKER_CATEGORIES = [
  { id: 'trending', label: 'Trending', emoji: '✨' },
  { id: 'love', label: 'Love & Hearts', emoji: '❤️' },
  { id: 'cute', label: 'Cute & Kawaii', emoji: '🎀' },
  { id: 'vibes', label: 'Gen Z Vibes', emoji: '🔥' },
  { id: 'reactions', label: 'Reactions', emoji: '😂' },
  { id: 'mood', label: 'Mood', emoji: '🥺' },
];

const EMOJI_CATEGORIES = [
  {
    name: 'Recent & Favorites',
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
      '❤️', '💖', '💗', '💓', '💕', '💘', '💝', '💜', '💙', '💚', '💛', '🧡', '🤍', '🤎', '🖤', '💔',
      '👍', '👎', '👏', '🙌', '🤝', '🙏', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👌',
    ],
  },
];

type MediaItem = { id: string; url: string; preview: string };

async function fetchGiphyMedia(type: 'gifs' | 'stickers', query: string, limit = 20): Promise<MediaItem[]> {
  try {
    const isSearch = Boolean(query && query !== 'trending');
    const endpoint = isSearch ? `${GIPHY_BASE}/${type}/search` : `${GIPHY_BASE}/${type}/trending`;
    const params = new URLSearchParams({
      api_key: GIPHY_KEY,
      limit: String(limit),
      rating: 'g',
      ...(isSearch ? { q: query.trim() } : {}),
    });

    const res = await fetch(`${endpoint}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data ?? [])
      .map((item: any) => {
        const fixed = item.images?.fixed_height || item.images?.downsized || item.images?.original;
        const preview = item.images?.fixed_height_small?.url || fixed?.url || '';
        return {
          id: String(item.id),
          url: fixed?.url || item.images?.original?.url || '',
          preview,
        };
      })
      .filter((item: MediaItem) => Boolean(item.url && item.preview));
  } catch {
    return [];
  }
}

interface MediaDrawerProps {
  initialTab?: DrawerTab;
  onPickEmoji: (emoji: string) => void;
  onPickGif: (url: string) => void;
}

export function MediaDrawer({ initialTab = 'emoji', onPickEmoji, onPickGif }: MediaDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab);
  const [selectedGifCategory, setSelectedGifCategory] = useState<string>('trending');
  const [selectedStickerCategory, setSelectedStickerCategory] = useState<string>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMedia = useCallback(async (tab: DrawerTab, query: string, cat: string) => {
    if (tab === 'emoji') return;
    setLoading(true);
    const effectiveQuery = query.trim() ? query.trim() : cat === 'trending' ? '' : cat;
    const items = await fetchGiphyMedia(tab === 'gif' ? 'gifs' : 'stickers', effectiveQuery);
    setMediaItems(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    setSearchQuery('');
    const cat = activeTab === 'gif' ? selectedGifCategory : selectedStickerCategory;
    loadMedia(activeTab, '', cat);
  }, [activeTab, loadMedia]);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const cat = activeTab === 'gif' ? selectedGifCategory : selectedStickerCategory;
      loadMedia(activeTab, q, cat);
    }, 350);
  };

  const handleGifCategoryClick = (catId: string) => {
    setSelectedGifCategory(catId);
    setSearchQuery('');
    loadMedia('gif', '', catId);
  };

  const handleStickerCategoryClick = (catId: string) => {
    setSelectedStickerCategory(catId);
    setSearchQuery('');
    loadMedia('sticker', '', catId);
  };

  return (
    <div className="z-30 bg-white/95 backdrop-blur-2xl border-t border-gray-200/80 shadow-[0_-12px_36px_rgba(0,0,0,0.08)] animate-popover-enter flex flex-col h-[290px] select-none">
      {/* ── TOP TAB NAV BAR ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3.5 pt-2.5 pb-2 border-b border-gray-100 bg-gray-50/70">
        <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'emoji'
                ? 'bg-white text-[#F43F5E] shadow-xs scale-102'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>😀</span>
            <span>Emoji</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gif')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'gif'
                ? 'bg-white text-[#F43F5E] shadow-xs scale-102'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🎬</span>
            <span>GIF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sticker')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-extrabold transition-all cursor-pointer ${
              activeTab === 'sticker'
                ? 'bg-white text-[#F43F5E] shadow-xs scale-102'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>✨</span>
            <span>Stickers</span>
          </button>
        </div>

        {/* Live Search Input (for GIF & Sticker tabs) */}
        {activeTab !== 'emoji' && (
          <div className="relative max-w-[160px] w-full">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={activeTab === 'gif' ? 'Search GIFs…' : 'Search stickers…'}
              className="w-full h-7.5 pl-7 pr-6 rounded-xl bg-white border border-gray-200 text-[11.5px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#F43F5E] font-medium"
            />
            <svg className="absolute left-2.5 top-2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1.5 text-gray-400 text-[11px] font-bold cursor-pointer"
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
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 overflow-x-auto scrollbar-none bg-gray-50/40">
            {GIF_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleGifCategoryClick(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold flex-shrink-0 transition-all cursor-pointer ${
                  selectedGifCategory === cat.id && !searchQuery
                    ? 'bg-[#F43F5E] text-white shadow-2xs'
                    : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* GIF Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 py-2">
            {loading ? (
              <div className="flex flex-col h-full items-center justify-center gap-2 text-gray-400">
                <svg className="animate-spin text-[#F43F5E]" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                </svg>
                <span className="text-[11.5px] font-medium">Loading GIFs…</span>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex flex-col h-full items-center justify-center text-center p-4 text-gray-400">
                <span className="text-2xl mb-1">🔍</span>
                <p className="text-[12.5px] font-bold text-gray-700">No GIFs found</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPickGif(item.url)}
                    className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 border border-gray-200/60 cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform shadow-2xs relative group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt="GIF"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: STICKERS ── */}
      {activeTab === 'sticker' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Category Chips */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 overflow-x-auto scrollbar-none bg-gray-50/40">
            {STICKER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleStickerCategoryClick(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold flex-shrink-0 transition-all cursor-pointer ${
                  selectedStickerCategory === cat.id && !searchQuery
                    ? 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-2xs'
                    : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Stickers Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 py-2">
            {loading ? (
              <div className="flex flex-col h-full items-center justify-center gap-2 text-gray-400">
                <svg className="animate-spin text-[#F43F5E]" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                </svg>
                <span className="text-[11.5px] font-medium">Loading stickers…</span>
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex flex-col h-full items-center justify-center text-center p-4 text-gray-400">
                <span className="text-2xl mb-1">🏷️</span>
                <p className="text-[12.5px] font-bold text-gray-700">No stickers found</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {mediaItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPickGif(item.url)}
                    className="aspect-square overflow-hidden rounded-2xl bg-gray-50/80 hover:bg-gray-100 border border-gray-100 cursor-pointer hover:scale-108 active:scale-95 transition-transform shadow-2xs p-1 flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt="Sticker"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
