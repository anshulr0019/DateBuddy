'use client';

import { BottomSheet } from '../components/BottomSheet';
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
    setIsOpen(true);
  };

  const closeFilters = () => {
    setIsMounted(false);
    setIsOpen(false);
  };

  const handleApply = () => {
    setFilters(localFilters);
    closeFilters();
  };

  const resetFilters = () => {
    setLocalFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
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

      <BottomSheet
        open={isMounted}
        onClose={closeFilters}
        title="Discovery filters"
        footer={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocalFilters(prev => ({ ...prev, ageMin: DEFAULT_FILTERS.ageMin, ageMax: DEFAULT_FILTERS.ageMax, verifiedOnly: false }))}
              className="min-h-[52px] px-5 text-[15px] font-semibold text-infyn-secondary cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 min-h-[52px] rounded-full bg-infyn-rose text-[#fff8f0] text-[15px] font-semibold active:scale-[0.985] transition-transform cursor-pointer"
            >
              Show profiles
            </button>
          </div>
        }
      >
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-infyn-secondary">Age range</h3>
            <span className="font-display text-[22px] text-infyn-ink tabular-nums" aria-live="polite">{localFilters.ageMin}–{localFilters.ageMax}</span>
          </div>
          <label className="block">
            <span className="text-[13px] text-infyn-secondary">Youngest</span>
            <input
              type="range" min={18} max={60} value={localFilters.ageMin}
              aria-label="Youngest age"
              onChange={(e) => { const v = Number(e.target.value); setLocalFilters(prev => ({ ...prev, ageMin: Math.min(v, prev.ageMax) })); }}
              className="mt-1 w-full accent-infyn-rose min-h-[32px] cursor-pointer"
            />
          </label>
          <label className="block mt-3">
            <span className="text-[13px] text-infyn-secondary">Oldest</span>
            <input
              type="range" min={18} max={60} value={localFilters.ageMax}
              aria-label="Oldest age"
              onChange={(e) => { const v = Number(e.target.value); setLocalFilters(prev => ({ ...prev, ageMax: Math.max(v, prev.ageMin) })); }}
              className="mt-1 w-full accent-infyn-rose min-h-[32px] cursor-pointer"
            />
          </label>
        </section>

        <section className="mt-7">
          <button
            type="button"
            role="switch"
            aria-checked={localFilters.verifiedOnly}
            onClick={() => setLocalFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
            className="w-full flex items-center justify-between gap-4 rounded-2xl bg-infyn-surface border border-infyn-border p-4 text-left cursor-pointer"
          >
            <span>
              <span className="block text-[15px] font-semibold text-infyn-ink">Verified profiles only</span>
              <span className="block mt-0.5 text-[13px] text-infyn-secondary">People whose photos our team has checked</span>
            </span>
            <span className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${localFilters.verifiedOnly ? 'bg-infyn-rose' : 'bg-infyn-ink/15'}`} aria-hidden>
              <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-infyn-surface shadow transition-transform duration-200 ${localFilters.verifiedOnly ? 'translate-x-5' : ''}`} />
            </span>
          </button>
        </section>
      </BottomSheet>
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    return {
      isOpen: false,
      filters: DEFAULT_FILTERS,
      activeFilterCount: 0,
      openFilters: () => {},
      closeFilters: () => {},
      setFilters: () => {},
      resetFilters: () => {},
    };
  }
  return context;
}
