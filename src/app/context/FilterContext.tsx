'use client';

import React, { createContext, useContext, useState } from 'react';

export interface FilterState {
  ageMin: number;
  ageMax: number;
  maxDistance: number; // km
  lookingFor: 'Everyone' | 'Women' | 'Men';
  verifiedOnly: boolean;
  interests: string[];
}

const DEFAULT_FILTERS: FilterState = {
  ageMin: 20,
  ageMax: 30,
  maxDistance: 25,
  lookingFor: 'Everyone',
  verifiedOnly: false,
  interests: [],
};

const AVAILABLE_INTERESTS = [
  'Design', 'Coffee', 'Travel', 'Music', 'Fitness',
  'Yoga', 'Books', 'Films', 'Art', 'Gaming', 'Cooking', 'Hiking'
];

interface FilterContextType {
  isOpen: boolean;
  filters: FilterState;
  activeFilterCount: number;
  openFilters: () => void;
  closeFilters: () => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Temporary local state for editing inside drawer
  const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const activeFilterCount =
    (filters.lookingFor !== 'Everyone' ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    filters.interests.length +
    (filters.maxDistance !== 25 ? 1 : 0);

  const openFilters = () => {
    setLocalFilters(filters);
    setIsMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimateIn(true);
        setIsOpen(true);
      });
    });
  };

  const closeFilters = () => {
    setAnimateIn(false);
    setTimeout(() => {
      setIsOpen(false);
      setIsMounted(false);
    }, 300);
  };

  const handleApply = () => {
    setFilters(localFilters);
    closeFilters();
  };

  const resetFilters = () => {
    setLocalFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  const toggleInterest = (interest: string) => {
    setLocalFilters(prev => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter(i => i !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  return (
    <FilterContext.Provider
      value={{
        isOpen,
        filters,
        activeFilterCount,
        openFilters,
        closeFilters,
        setFilters,
        resetFilters,
      }}
    >
      {children}

      {/* ── FILTER DRAWER SHEET OVERLAY ── */}
      {isMounted && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-hidden pointer-events-auto">
          {/* Backdrop */}
          <div
            onClick={closeFilters}
            className={`absolute inset-0 bg-black/40 transition-all duration-350 ease-[cubic-bezier(0.32,1,0.32,1)] ${
              animateIn ? 'backdrop-blur-md opacity-100' : 'backdrop-blur-none opacity-0'
            }`}
            style={{ willChange: 'backdrop-filter, opacity' }}
          />

          {/* Sliding Sheet Container */}
          <div
            className={`relative z-10 w-full max-w-[440px] bg-[#FAFAF7] rounded-t-[32px] sm:rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.35)] border border-white/80 overflow-hidden flex flex-col max-h-[85dvh] transition-all duration-350 cubic-bezier(0.32,1.25,0.32,1) ${
              animateIn ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-full sm:translate-y-8 sm:scale-95 opacity-0'
            }`}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-[#1A1A2E]/15" />
            </div>

            {/* Header */}
            <div className="px-6 py-3 flex items-center justify-between border-b border-[#1A1A2E]/[0.06]">
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#1A1A2E]">
                Discovery Preferences
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={resetFilters}
                  className="text-[12px] font-semibold text-[#FF6B9D] active:opacity-60 transition-opacity cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={closeFilters}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A2E]/5 text-[#1A1A2E]/60 active:scale-95 transition-transform cursor-pointer"
                  aria-label="Close filters"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Options Form */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-6 space-y-6">
              
              {/* 1. Show Me */}
              <div>
                <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2.5">
                  Show Me
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-[#1A1A2E]/5 rounded-2xl">
                  {(['Everyone', 'Women', 'Men'] as const).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setLocalFilters(prev => ({ ...prev, lookingFor: gender }))}
                      className={`py-2 text-[13px] font-semibold rounded-xl transition-all cursor-pointer ${
                        localFilters.lookingFor === gender
                          ? 'bg-white text-[#1A1A2E] shadow-sm'
                          : 'text-[#1A1A2E]/50 hover:text-[#1A1A2E]'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Maximum Distance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold text-[#1A1A2E]">
                    Maximum Distance
                  </label>
                  <span className="text-[13px] font-bold text-[#FF6B9D]">
                    {localFilters.maxDistance} km
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  value={localFilters.maxDistance}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                  className="w-full accent-[#FF6B9D] cursor-pointer h-2 bg-[#1A1A2E]/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[11px] font-medium text-[#1A1A2E]/40 mt-1.5">
                  <span>2 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>

              {/* 3. Age Range */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold text-[#1A1A2E]">
                    Age Range
                  </label>
                  <span className="text-[13px] font-bold text-[#7B68EE]">
                    {localFilters.ageMin} – {localFilters.ageMax} yrs
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="18"
                    max="50"
                    value={localFilters.ageMin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= localFilters.ageMax) {
                        setLocalFilters(prev => ({ ...prev, ageMin: val }));
                      }
                    }}
                    className="w-full accent-[#7B68EE] cursor-pointer h-2 bg-[#1A1A2E]/10 rounded-lg appearance-none"
                  />
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={localFilters.ageMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= localFilters.ageMin) {
                        setLocalFilters(prev => ({ ...prev, ageMax: val }));
                      }
                    }}
                    className="w-full accent-[#7B68EE] cursor-pointer h-2 bg-[#1A1A2E]/10 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* 4. Verified Profiles Only Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#1A1A2E]/[0.06] shadow-sm">
                <div>
                  <p className="text-[14px] font-bold text-[#1A1A2E]">Verified Profiles Only</p>
                  <p className="text-[12px] text-[#1A1A2E]/50 mt-0.5">Only show photos with a blue checkmark badge</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    localFilters.verifiedOnly ? 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE]' : 'bg-[#1A1A2E]/20'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      localFilters.verifiedOnly ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 5. Vibe & Interest Chips */}
              <div>
                <label className="block text-[13px] font-bold text-[#1A1A2E] mb-2.5">
                  Filter by Interest Vibe
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isSelected = localFilters.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white shadow-sm scale-105'
                            : 'bg-white border border-[#1A1A2E]/10 text-[#1A1A2E]/60 hover:border-[#1A1A2E]/25'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Apply CTA */}
            <div className="p-4 border-t border-[#1A1A2E]/[0.06] bg-white">
              <button
                onClick={handleApply}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-[15px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(255,107,157,0.4)] active:scale-[0.985] transition-all cursor-pointer"
              >
                Apply Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
