'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

// Reliable Giphy API key for infinite real-time trending & search
const GIPHY_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh';
const GIPHY_BASE = 'https://api.giphy.com/v1';

const STICKER_CATEGORIES = [
  { id: 'love', label: 'Love', emoji: '❤️' },
  { id: 'cute', label: 'Cute', emoji: '✨' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'vibe', label: 'Vibes', emoji: '🔥' },
  { id: 'sad', label: 'Mood', emoji: '🥺' },
];

type GifResult = { id: string; url: string; preview: string; width?: number; height?: number };

async function searchGiphy(type: 'gifs' | 'stickers', query: string, limit = 24): Promise<GifResult[]> {
  try {
    const endpoint = query.trim() ? `${GIPHY_BASE}/${type}/search` : `${GIPHY_BASE}/${type}/trending`;
    const params = new URLSearchParams({
      api_key: GIPHY_KEY,
      limit: String(limit),
      rating: 'g',
      ...(query.trim() ? { q: query.trim() } : {}),
    });

    const res = await fetch(`${endpoint}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data ?? []).map((item: any) => {
      const fixedHeight = item.images?.fixed_height;
      const downsized = item.images?.fixed_height_small || item.images?.downsized || fixedHeight;
      return {
        id: String(item.id),
        url: fixedHeight?.url || item.images?.original?.url || '',
        preview: downsized?.url || fixedHeight?.url || '',
      };
    }).filter((r: GifResult) => Boolean(r.url && r.preview));
  } catch {
    return [];
  }
}

type TabId = 'gifs' | 'stickers';

interface GifStickerDrawerProps {
  onSelect: (url: string, kind: 'gif' | 'sticker') => void;
}

export function GifStickerDrawer({ onSelect }: GifStickerDrawerProps) {
  const [tab, setTab] = useState<TabId>('gifs');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async (currentTab: TabId, searchQuery: string) => {
    setLoading(true);
    const results = await searchGiphy(currentTab, searchQuery);
    setItems(results);
    setLoading(false);
  }, []);

  // Load initial trending items on tab switch
  useEffect(() => {
    setQuery('');
    setActiveCategory(null);
    loadData(tab, '');
  }, [tab, loadData]);

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    setActiveCategory(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      loadData(tab, q);
    }, 350);
  }, [tab, loadData]);

  const handleCategoryClick = useCallback((catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
      setQuery('');
      loadData('stickers', '');
    } else {
      setActiveCategory(catId);
      setQuery('');
      loadData('stickers', catId);
    }
  }, [activeCategory, loadData]);

  return (
    <div
      className="z-30 bg-white/95 backdrop-blur-2xl border-t border-gray-200/80 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] animate-popover-enter flex flex-col select-none"
      style={{ height: '280px' }}
    >
      {/* Top Header Controls */}
      <div className="flex-shrink-0 flex items-center justify-between gap-2 border-b border-gray-100 px-3.5 py-2.5">
        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-full border border-gray-200/50">
          {(['gifs', 'stickers'] as TabId[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1 text-[12px] font-extrabold rounded-full transition-all cursor-pointer ${
                tab === t
                  ? 'bg-white text-[#F43F5E] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'gifs' ? '🎬 GIFs' : '✨ Stickers'}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="flex-1 max-w-[220px] relative">
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={tab === 'gifs' ? 'Search GIFs…' : 'Search stickers…'}
            autoComplete="off"
            className="w-full h-8 pl-8 pr-7 rounded-xl bg-gray-100/80 text-[12px] text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 transition-all border border-transparent focus:border-[#F43F5E]/30 font-medium"
          />
          <svg className="absolute left-2.5 top-2 text-gray-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stickers Category Bar (Only on Stickers Tab) */}
      {tab === 'stickers' && (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-none border-b border-gray-100">
          {STICKER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-xs'
                  : 'bg-gray-100/90 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none p-2.5">
        {loading ? (
          <div className="flex flex-col h-full items-center justify-center gap-2 text-gray-400">
            <svg className="animate-spin text-[#F43F5E]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.2-8.56" />
            </svg>
            <span className="text-[12px] font-medium">Loading {tab === 'gifs' ? 'GIFs' : 'stickers'}…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-center p-4 text-gray-400">
            <span className="text-2xl mb-1">🔍</span>
            <p className="text-[13px] font-bold text-gray-700">No {tab} found</p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">Try searching with a different term</p>
          </div>
        ) : (
          <div className={`grid gap-2 ${tab === 'stickers' ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-4'}`}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.url, tab === 'stickers' ? 'sticker' : 'gif')}
                className={`group relative overflow-hidden transition-all duration-200 active:scale-95 cursor-pointer ${
                  tab === 'stickers'
                    ? 'aspect-square rounded-2xl bg-gray-50/80 hover:bg-gray-100 border border-gray-100 p-1 flex items-center justify-center'
                    : 'aspect-square rounded-2xl bg-gray-100 border border-gray-200/50 shadow-2xs hover:scale-[1.03]'
                }`}
                aria-label={`Send this ${tab === 'stickers' ? 'sticker' : 'GIF'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt={tab}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full ${tab === 'stickers' ? 'object-contain' : 'object-cover'}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Powered by GIPHY footer */}
      <div className="flex-shrink-0 flex items-center justify-center py-1 bg-gray-50/80 border-t border-gray-100" aria-hidden>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Powered by GIPHY
        </span>
      </div>
    </div>
  );
}
