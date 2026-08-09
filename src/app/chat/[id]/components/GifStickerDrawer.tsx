'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

// Tenor public API key (free, no rate limit for basic use)
const TENOR_KEY = 'AIzaSyAyimkuYQYF_FXVALexPzpAkvXPDV2docc';
const TENOR_BASE = 'https://tenor.googleapis.com/v2';

// Curated sticker packs using well-known stable GIF sources
const STICKER_PACKS: { label: string; emoji: string; urls: string[] }[] = [
  {
    label: 'Love',
    emoji: '❤️',
    urls: [
      'https://media.tenor.com/ek4oEGNtqQUAAAAC/love-heart.gif',
      'https://media.tenor.com/wNZIeJXGdO8AAAAC/kiss-love.gif',
      'https://media.tenor.com/L2iCFRBSKYMAAAAC/valentines-day-hearts.gif',
      'https://media.tenor.com/0S2EXrRTcHcAAAAC/heart-eyes-heart.gif',
    ],
  },
  {
    label: 'Vibes',
    emoji: '✨',
    urls: [
      'https://media.tenor.com/bIVMqVkJHVoAAAAC/hello-kitty-cute.gif',
      'https://media.tenor.com/a-BJtHMEVzwAAAAC/hiii-hello.gif',
      'https://media.tenor.com/3v3LsCO9LDYAAAAC/cute-anime.gif',
      'https://media.tenor.com/vHJGhbG4OL4AAAAC/cute-kawaii.gif',
    ],
  },
  {
    label: 'Reactions',
    emoji: '😂',
    urls: [
      'https://media.tenor.com/lIBKHRHlvvEAAAAC/lol-lmao.gif',
      'https://media.tenor.com/BISMr_UvbVoAAAAC/bored-ok.gif',
      'https://media.tenor.com/kbvmPvexHe4AAAAC/okay-fine.gif',
      'https://media.tenor.com/T2o8VPeONZsAAAAC/what-confused.gif',
    ],
  },
];

type GifResult = { id: string; url: string; preview: string };

async function searchTenor(query: string, limit = 16): Promise<GifResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      key: TENOR_KEY,
      limit: String(limit),
      contentfilter: 'medium',
      media_filter: 'gif,tinygif',
      client_key: 'datebuddy_chat',
    });
    const res = await fetch(`${TENOR_BASE}/search?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: Record<string, unknown>) => {
      const media = r.media_formats as Record<string, { url: string }>;
      return {
        id: r.id as string,
        url: media?.gif?.url ?? '',
        preview: media?.tinygif?.url ?? media?.gif?.url ?? '',
      };
    }).filter((r: GifResult) => r.url);
  } catch {
    return [];
  }
}

async function fetchTrending(limit = 16): Promise<GifResult[]> {
  try {
    const params = new URLSearchParams({
      key: TENOR_KEY,
      limit: String(limit),
      contentfilter: 'medium',
      media_filter: 'gif,tinygif',
      client_key: 'datebuddy_chat',
    });
    const res = await fetch(`${TENOR_BASE}/featured?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: Record<string, unknown>) => {
      const media = r.media_formats as Record<string, { url: string }>;
      return {
        id: r.id as string,
        url: media?.gif?.url ?? '',
        preview: media?.tinygif?.url ?? media?.gif?.url ?? '',
      };
    }).filter((r: GifResult) => r.url);
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
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stickerPack, setStickerPack] = useState(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load trending on mount / when switching to GIF tab
  useEffect(() => {
    if (tab !== 'gifs') return;
    setLoading(true);
    fetchTrending().then((results) => {
      setGifs(results);
      setLoading(false);
    });
  }, [tab]);

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) {
      // Revert to trending
      setLoading(true);
      fetchTrending().then((r) => { setGifs(r); setLoading(false); });
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchTenor(q.trim());
      setGifs(results);
      setLoading(false);
    }, 400);
  }, []);

  return (
    <div className="z-30 bg-white/98 backdrop-blur-xl border-t border-gray-200/80 shadow-2xl animate-popover-enter flex flex-col" style={{ height: '260px' }}>
      {/* Tabs */}
      <div className="flex-shrink-0 flex items-center gap-0 border-b border-gray-100 px-3 pt-2">
        {(['gifs', 'stickers'] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-all cursor-pointer ${
              tab === t
                ? 'bg-[#F43F5E] text-white shadow-sm'
                : 'text-gray-400 hover:text-[#F43F5E]'
            }`}
          >
            {t === 'gifs' ? 'GIF' : 'Stickers'}
          </button>
        ))}
        {tab === 'gifs' && (
          <div className="ml-auto flex-1 max-w-[200px] relative mx-2">
            <input
              type="search"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search GIFs…"
              autoComplete="off"
              className="w-full h-7 pl-3 pr-6 rounded-xl bg-gray-100 text-[12px] text-gray-700 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 transition-all border border-transparent focus:border-[#F43F5E]/30"
            />
            <svg className="absolute right-2 top-1.5 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        )}
      </div>

      {/* GIF tab */}
      {tab === 'gifs' && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 py-2">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <svg className="animate-spin text-[#F43F5E]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.56"/></svg>
            </div>
          ) : gifs.length === 0 ? (
            <p className="text-center text-[13px] text-gray-400 mt-8">No GIFs found</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => onSelect(gif.url, 'gif')}
                  className="aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer hover:scale-[1.04] active:scale-95 transition-transform shadow-2xs"
                  aria-label="Send this GIF"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gif.preview}
                    alt="GIF"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          {/* Tenor attribution */}
          <p className="text-center text-[10px] text-gray-300 mt-2 pb-1">Powered by Tenor</p>
        </div>
      )}

      {/* Stickers tab */}
      {tab === 'stickers' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Pack selector */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100">
            {STICKER_PACKS.map((pack, i) => (
              <button
                key={pack.label}
                onClick={() => setStickerPack(i)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                  stickerPack === i
                    ? 'bg-[#F43F5E] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <span>{pack.emoji}</span>
                <span>{pack.label}</span>
              </button>
            ))}
          </div>

          {/* Sticker grid */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 py-2">
            <div className="grid grid-cols-4 gap-2">
              {STICKER_PACKS[stickerPack]?.urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(url, 'sticker')}
                  className="aspect-square overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:scale-[1.06] active:scale-95 transition-transform shadow-2xs"
                  aria-label="Send this sticker"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Sticker"
                    loading="lazy"
                    className="h-full w-full object-contain p-1"
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
