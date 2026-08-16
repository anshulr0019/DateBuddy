'use client';

import { useState, useEffect, useMemo } from 'react';



export interface VenueItem {
  id: string;
  category: string;
  name: string;
  address: string;
  area: string;
  icon: string;
}

export const CATEGORY_VENUES: Record<string, VenueItem[]> = {
  gym: [
    { id: 'g1', category: 'gym', name: 'Cult.fit Gym', area: 'Bandra West', address: 'Pali Hill, Bandra West, Mumbai', icon: '🏋️' },
    { id: 'g2', category: 'gym', name: 'Gold\'s Gym', area: 'Bandra West', address: 'Waterfield Road, Bandra West, Mumbai', icon: '🏋️' },
    { id: 'g3', category: 'gym', name: 'Anytime Fitness', area: 'Andheri West', address: 'Link Road, Opp. Star Bazaar, Andheri West', icon: '🏋️' },
    { id: 'g4', category: 'gym', name: 'Snap Fitness', area: 'Juhu', address: 'Near Juhu Beach, Vile Parle West', icon: '🏋️' },
    { id: 'g5', category: 'gym', name: 'Nitrro Wellness & Fitness', area: 'Breach Candy', address: 'Bhulabhai Desai Marg, South Mumbai', icon: '🏋️' },
    { id: 'g6', category: 'gym', name: 'Fitness First', area: 'BKC', address: 'Maker Maxity, BKC, Bandra East', icon: '🏋️' },
    { id: 'g7', category: 'gym', name: 'Reset Fitness', area: 'Carter Road', address: 'Carter Road Promenade, Bandra West', icon: '🏋️' },
    { id: 'g8', category: 'gym', name: 'Waves Gym', area: 'Lokhandwala', address: 'Lokhandwala Complex, Andheri West', icon: '🏋️' },
    { id: 'g9', category: 'gym', name: 'Powerhouse Gym', area: 'JVPD Scheme', address: 'NS Road 10, JVPD Scheme, Juhu', icon: '🏋️' },
  ],
  sports: [
    { id: 's1', category: 'sports', name: 'Urban Sports Park', area: 'Lower Parel', address: 'Opp. Phoenix Palladium Mall, Lower Parel', icon: '⚽' },
    { id: 's2', category: 'sports', name: 'Turfside Box Cricket', area: 'Andheri East', address: 'Near Chakala Metro Station, Andheri East', icon: '🏏' },
    { id: 's3', category: 'sports', name: 'Kick Football Turf', area: 'Powai', address: 'Hiranandani Gardens, Powai', icon: '⚽' },
    { id: 's4', category: 'sports', name: 'Play All Arena', area: 'Bandra West', address: 'Carter Road Seafront Arena, Bandra', icon: '🎾' },
    { id: 's5', category: 'sports', name: 'Smash Badminton Court', area: 'Goregaon West', address: 'Near Inorbit Mall, Goregaon West', icon: '🏸' },
    { id: 's6', category: 'sports', name: 'Astro Park Turf', area: 'Worli', address: 'Atria Mall Rooftop, Worli', icon: '⚽' },
    { id: 's7', category: 'sports', name: 'Khar Gymkhana Courts', area: 'Khar West', address: '14th Road, Khar West, Mumbai', icon: '🎾' },
  ],
  coffee: [
    { id: 'c1', category: 'coffee', name: 'Blue Tokai Coffee Roasters', area: 'Pali Hill, Bandra', address: 'Pali Village, Bandra West, Mumbai', icon: '☕' },
    { id: 'c2', category: 'coffee', name: 'Third Wave Coffee', area: 'Linking Road', address: 'Linking Road, Opp. Khar Telephone Exchange', icon: '☕' },
    { id: 'c3', category: 'coffee', name: 'Subko Specialty Coffee', area: 'Ranwar Village', address: 'Crafford Market / Ranwar, Bandra West', icon: '☕' },
    { id: 'c4', category: 'coffee', name: 'Starbucks Reserve', area: 'Fort', address: 'Elphinstone Building, Horniman Circle, Fort', icon: '☕' },
    { id: 'c5', category: 'coffee', name: 'Chaayos', area: 'Powai', address: 'Hiranandani Business Park, Powai', icon: '🍵' },
    { id: 'c6', category: 'coffee', name: 'Kitchen Garden by Suzette', area: 'Bandra West', address: 'Gasper Enclave, St. John Street, Bandra', icon: '🥗' },
    { id: 'c7', category: 'coffee', name: 'Prithvi Cafe', area: 'Juhu', address: '20 Janki Kutir, Juhu Church Road, Juhu', icon: '☕' },
  ],
  drinks: [
    { id: 'd1', category: 'drinks', name: 'Social', area: 'Khar West', address: 'Rohan Plaza, 5th Road, Khar West', icon: '🍹' },
    { id: 'd2', category: 'drinks', name: 'BSE - Bar Exchange', area: 'Lower Parel', address: 'Kamala Mills Compound, Lower Parel', icon: '🍺' },
    { id: 'd3', category: 'drinks', name: 'Toast & Tonic', area: 'BKC', address: 'Godrej BKC, Bandra Kurla Complex', icon: '🍸' },
    { id: 'd4', category: 'drinks', name: 'Olive Bar & Kitchen', area: 'Pali Hill', address: 'Ambedkar Road, Pali Hill, Bandra West', icon: '🍷' },
    { id: 'd5', category: 'drinks', name: 'Lord of the Drinks', area: 'Andheri West', address: 'Veera Desai Industrial Estate, Andheri', icon: '🍹' },
    { id: 'd6', category: 'drinks', name: 'Hoppipola', area: 'Powai', address: 'Galleria Shopping Centre, Hiranandani', icon: '🍻' },
    { id: 'd7', category: 'drinks', name: 'Doolally Taproom', area: 'Khar West', address: 'Corner of 3rd and 18th Road, Khar West', icon: '🍺' },
  ],
  food: [
    { id: 'f1', category: 'food', name: 'Joey\'s Pizza', area: 'DN Nagar, Andheri', address: 'Opp. DN Nagar Metro Station, Andheri West', icon: '🍕' },
    { id: 'f2', category: 'food', name: 'Bastian', area: 'Worli', address: 'Atria Mall Rooftop, Worli, Mumbai', icon: '🍝' },
    { id: 'f3', category: 'food', name: 'Pop Tate\'s', area: 'Andheri West', address: 'Veera Desai Road, Andheri West', icon: '🍔' },
    { id: 'f4', category: 'food', name: 'Foo Town', area: 'BKC', address: 'Trade Tower, Bandra Kurla Complex', icon: '🍱' },
    { id: 'f5', category: 'food', name: 'Pizza By The Bay', area: 'Marine Drive', address: '143 Marine Drive, Churchgate', icon: '🍕' },
    { id: 'f6', category: 'food', name: 'Bayroute', area: 'Juhu', address: 'Juhu Tara Road, Opp. Horizon Hotel', icon: '🥙' },
  ],
  movies: [
    { id: 'm1', category: 'movies', name: 'PVR INOX Director\'s Cut', area: 'Lower Parel', address: 'High Street Phoenix Mall, Lower Parel', icon: '🍿' },
    { id: 'm2', category: 'movies', name: 'PVR ICON', area: 'Lokhandwala', address: 'Infiniti Mall, New Link Road, Andheri West', icon: '🎬' },
    { id: 'm3', category: 'movies', name: 'Cinepolis VIP', area: 'Kurla West', address: 'Phoenix Marketcity, LBS Marg, Kurla', icon: '🍿' },
    { id: 'm4', category: 'movies', name: 'Smaaash Entertainment', area: 'Kamala Mills', address: 'Lower Parel, Mumbai', icon: '🎮' },
    { id: 'm5', category: 'movies', name: 'Bounce Trampoline Park', area: 'Malad West', address: 'Infiniti Mall, Link Road, Malad West', icon: '🎪' },
  ],
  outdoors: [
    { id: 'o1', category: 'outdoors', name: 'Sanjay Gandhi National Park', area: 'Borivali East', address: 'Western Express Highway, Borivali East', icon: '🥾' },
    { id: 'o2', category: 'outdoors', name: 'Marine Drive Promenade', area: 'Churchgate', address: 'Netaji Subhash Chandra Bose Road', icon: '🌊' },
    { id: 'o3', category: 'outdoors', name: 'Carter Road Promenade', area: 'Bandra West', address: 'Bandstand / Carter Road, Bandra West', icon: '🌅' },
    { id: 'o4', category: 'outdoors', name: 'Yeoor Hills Trek', area: 'Thane West', address: 'Upvan Lake Gate, Yeoor National Park', icon: '🏔️' },
    { id: 'o5', category: 'outdoors', name: 'Gorai Beach', area: 'Gorai Island', address: 'Gorai Beach Road, Borivali West', icon: '🏖️' },
  ],
};

interface VenuePickerModalProps {
  isOpen: boolean;
  category: string; // e.g. 'gym', 'sports', 'coffee', 'drinks', etc.
  onSelect: (venueName: string, address: string) => void;
  onClose: () => void;
}

export function VenuePickerModal({ isOpen, category, onSelect, onClose }: VenuePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [livePlaces, setLivePlaces] = useState<VenueItem[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);

  // Track dynamic visual viewport height on mobile devices when soft keyboard opens
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      setViewportHeight(vv.height);
    };
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    handleResize();
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  const categoryNormalized = (category || 'gym').toLowerCase();

  // Fetch live places from Google Maps / OpenStreetMap API when host types in search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setLivePlaces([]);
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/places/search?query=${encodeURIComponent(searchQuery.trim())}&category=${encodeURIComponent(categoryNormalized)}`
        );
        const data = await res.json();
        if (res.ok && data?.success && Array.isArray(data.places)) {
          setLivePlaces(data.places);
        }
      } catch {
        /* fallback to local */
      } finally {
        setIsSearchingLive(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, categoryNormalized]);

  // Get curated list for this category, or combine all if category unknown
  const defaultList = useMemo(() => {
    return CATEGORY_VENUES[categoryNormalized] || CATEGORY_VENUES.gym;
  }, [categoryNormalized]);

  const localFilteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return defaultList;
    const q = searchQuery.toLowerCase().trim();
    return defaultList.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.area.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q)
    );
  }, [defaultList, searchQuery]);

  // Combine live API places with local fallback curated list
  const displayVenues = useMemo(() => {
    if (livePlaces.length > 0) {
      // Merge live places first, followed by any matching local entries
      const liveIds = new Set(livePlaces.map(p => p.name.toLowerCase()));
      const remainingLocal = localFilteredVenues.filter(l => !liveIds.has(l.name.toLowerCase()));
      return [...livePlaces, ...remainingLocal];
    }
    return localFilteredVenues;
  }, [livePlaces, localFilteredVenues]);

  if (!isOpen) return null;

  const categoryTitle =
    categoryNormalized === 'gym' ? 'Gyms & Fitness Centers' :
    categoryNormalized === 'sports' ? 'Sports Turfs & Courts' :
    categoryNormalized === 'coffee' ? 'Cafes & Coffee Shops' :
    categoryNormalized === 'drinks' ? 'Bars & Nightlife Venues' :
    categoryNormalized === 'food' ? 'Restaurants & Eateries' :
    categoryNormalized === 'movies' ? 'Theatres & Entertainment Venues' :
    'Outdoor Locations & Spots';

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-modal="true"
      className="fixed inset-0 z-[99999] flex items-start sm:items-center justify-center p-2 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:p-4 overflow-hidden"
    >
      {/* Backdrop — covers bottom navigation bar */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in z-0"
      />

      {/* Sheet Modal — aligns smoothly to top when soft keyboard opens */}
      <div
        style={{
          maxHeight: viewportHeight ? `${viewportHeight - 24}px` : '85dvh',
        }}
        className="relative z-10 w-full max-w-[440px] bg-white rounded-2xl sm:rounded-[28px] flex flex-col shadow-2xl animate-sheet-up overflow-hidden my-auto"
      >

        {/* Handle */}
        <div className="pt-2.5 pb-1 flex-shrink-0 flex justify-center">
          <div className="h-1.5 w-10 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-[17px] font-extrabold text-[#1E293B]">Select Location</h3>
              <p className="text-[12px] font-medium text-[#1E293B]/50">{categoryTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer active:scale-90 transition-transform"
            >
              ✕
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${categoryNormalized}s, area or city (e.g. Janakpuri, Bandra...)...`}
              autoFocus
              className="w-full h-11 pl-10 pr-9 rounded-2xl bg-gray-100/80 border border-gray-200 text-[14.5px] font-medium text-[#1E293B] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6B9D] transition-all"
            />
            <span className="absolute left-3.5 top-3 text-gray-400 text-base">🔍</span>
            {isSearchingLive && (
              <span className="absolute right-3 top-3.5 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#FF6B9D]" />
            )}
          </div>
        </div>

        {/* Venue List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-none min-h-0">
          {/* Custom option if user typed something custom */}
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                onSelect(searchQuery.trim(), 'Custom Location');
                onClose();
              }}
              className="w-full p-3 rounded-2xl border border-dashed border-[#FF6B9D] bg-[#FFF0F4] hover:bg-[#FFE4ED] transition-all flex items-center gap-3 cursor-pointer text-left shadow-2xs active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white text-lg">
                📍
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#FF6B9D] truncate">
                  Use custom location: &ldquo;{searchQuery.trim()}&rdquo;
                </p>
                <p className="text-[11.5px] font-medium text-[#1E293B]/50">Tap to select custom venue</p>
              </div>
            </button>
          )}

          {/* Live Search Indicator */}
          {isSearchingLive && (
            <div className="py-2 text-center text-xs font-semibold text-[#FF6B9D] animate-pulse">
              🔍 Searching live Google Maps & OpenStreetMap locations...
            </div>
          )}

          {/* Filtered Curated & Live List */}
          {displayVenues.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onSelect(v.name, v.address);
                onClose();
              }}
              className="w-full p-3 rounded-2xl border border-gray-200/80 bg-gray-50/60 hover:bg-white hover:border-[#FF6B9D]/40 hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer text-left active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white border border-gray-200 text-xl shadow-2xs">
                  {v.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14.5px] font-bold text-[#1E293B] truncate">{v.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B9D] bg-[#FFF0F4] px-2 py-0.5 rounded-md flex-shrink-0 truncate max-w-[120px]">
                      {v.area}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#1E293B]/55 font-medium truncate mt-0.5">{v.address}</p>
                </div>
              </div>

              <span className="text-gray-400 font-bold text-lg flex-shrink-0">›</span>
            </button>
          ))}


          {displayVenues.length === 0 && searchQuery.trim().length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <p className="text-[14px] font-bold">No venues found for this category</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
