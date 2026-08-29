// Curated, high-definition contextual imagery for Meetups & Squads

export interface PresetImageOption {
  id: string;
  label: string;
  category: string;
  url: string;
}

export const CATEGORY_COVER_IMAGES: Record<string, string> = {
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
  fitness: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80',
  football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
  running: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
  sports: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80',
  coffee: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
  food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  drinks: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
  social: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  party: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  outdoors: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&auto=format&fit=crop&q=80',
  hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&auto=format&fit=crop&q=80',
  arts: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80',
  music: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
  tech: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  gaming: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
  movies: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
  boardgames: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
};

export const PRESET_IMAGE_OPTIONS: PresetImageOption[] = [
  { id: 'gym', label: 'Gym & Workout', category: 'sports', url: CATEGORY_COVER_IMAGES.gym },
  { id: 'badminton', label: 'Badminton Court', category: 'sports', url: CATEGORY_COVER_IMAGES.badminton },
  { id: 'football', label: 'Turf Football / Sports', category: 'sports', url: CATEGORY_COVER_IMAGES.football },
  { id: 'running', label: 'Running & Marathon', category: 'sports', url: CATEGORY_COVER_IMAGES.running },
  { id: 'coffee', label: 'Coffee & Cafe Hop', category: 'food', url: CATEGORY_COVER_IMAGES.coffee },
  { id: 'food', label: 'Food & Dining', category: 'food', url: CATEGORY_COVER_IMAGES.food },
  { id: 'drinks', label: 'Drinks & Nightlife', category: 'social', url: CATEGORY_COVER_IMAGES.drinks },
  { id: 'party', label: 'Social & Party', category: 'social', url: CATEGORY_COVER_IMAGES.party },
  { id: 'hiking', label: 'Outdoors & Hiking', category: 'outdoors', url: CATEGORY_COVER_IMAGES.hiking },
  { id: 'tech', label: 'Tech & Co-working', category: 'tech', url: CATEGORY_COVER_IMAGES.tech },
  { id: 'gaming', label: 'Gaming & LAN', category: 'tech', url: CATEGORY_COVER_IMAGES.gaming },
  { id: 'music', label: 'Live Music & Concert', category: 'arts', url: CATEGORY_COVER_IMAGES.music },
  { id: 'arts', label: 'Arts & Creative', category: 'arts', url: CATEGORY_COVER_IMAGES.arts },
];

/**
 * Intelligently resolves the most fitting cover image based on category and title keywords
 */
export function getCategoryCoverImage(category?: string | null, title?: string | null, venueName?: string | null): string {
  const combined = `${category ?? ''} ${title ?? ''} ${venueName ?? ''}`.toLowerCase();

  // 1. Check title & venue keywords first for high precision
  if (combined.includes('gym') || combined.includes('leg day') || combined.includes('workout') || combined.includes('chest') || combined.includes('weights') || combined.includes('crossfit') || combined.includes('bodybuilding')) {
    return CATEGORY_COVER_IMAGES.gym;
  }
  if (combined.includes('badminton') || combined.includes('shuttle')) {
    return CATEGORY_COVER_IMAGES.badminton;
  }
  if (combined.includes('tennis') || combined.includes('pickleball') || combined.includes('padel')) {
    return CATEGORY_COVER_IMAGES.tennis;
  }
  if (combined.includes('football') || combined.includes('soccer') || combined.includes('turf') || combined.includes('futsal')) {
    return CATEGORY_COVER_IMAGES.football;
  }
  if (combined.includes('cricket') || combined.includes('box cricket')) {
    return CATEGORY_COVER_IMAGES.cricket;
  }
  if (combined.includes('basketball') || combined.includes('hoops')) {
    return CATEGORY_COVER_IMAGES.basketball;
  }
  if (combined.includes('run') || combined.includes('marathon') || combined.includes('jog') || combined.includes('morning walk')) {
    return CATEGORY_COVER_IMAGES.running;
  }
  if (combined.includes('coffee') || combined.includes('café') || combined.includes('cafe') || combined.includes('starbucks') || combined.includes('roastery')) {
    return CATEGORY_COVER_IMAGES.coffee;
  }
  if (combined.includes('drink') || combined.includes('beer') || combined.includes('bar') || combined.includes('pub') || combined.includes('cocktail') || combined.includes('club') || combined.includes('nightlife')) {
    return CATEGORY_COVER_IMAGES.drinks;
  }
  if (combined.includes('food') || combined.includes('dinner') || combined.includes('lunch') || combined.includes('brunch') || combined.includes('eat') || combined.includes('restaurant') || combined.includes('pizza') || combined.includes('biryani')) {
    return CATEGORY_COVER_IMAGES.food;
  }
  if (combined.includes('hike') || combined.includes('trek') || combined.includes('outdoor') || combined.includes('camp') || combined.includes('mountain') || combined.includes('trail')) {
    return CATEGORY_COVER_IMAGES.hiking;
  }
  if (combined.includes('game') || combined.includes('gaming') || combined.includes('ps5') || combined.includes('valorant') || combined.includes('fifa') || combined.includes('esports')) {
    return CATEGORY_COVER_IMAGES.gaming;
  }
  if (combined.includes('tech') || combined.includes('hack') || combined.includes('code') || combined.includes('coding') || combined.includes('cowork') || combined.includes('startup') || combined.includes('ai')) {
    return CATEGORY_COVER_IMAGES.tech;
  }
  if (combined.includes('music') || combined.includes('gig') || combined.includes('concert') || combined.includes('band') || combined.includes('sing') || combined.includes('karaoke')) {
    return CATEGORY_COVER_IMAGES.music;
  }
  if (combined.includes('art') || combined.includes('paint') || combined.includes('sketch') || combined.includes('museum') || combined.includes('gallery')) {
    return CATEGORY_COVER_IMAGES.arts;
  }
  if (combined.includes('movie') || combined.includes('cinema') || combined.includes('film') || combined.includes('theatre')) {
    return CATEGORY_COVER_IMAGES.movies;
  }
  if (combined.includes('board') || combined.includes('catan') || combined.includes('chess') || combined.includes('uno')) {
    return CATEGORY_COVER_IMAGES.boardgames;
  }
  if (combined.includes('party') || combined.includes('social') || combined.includes('mixer') || combined.includes('meetup')) {
    return CATEGORY_COVER_IMAGES.party;
  }

  // 2. Fall back to category mapping
  const catKey = (category ?? '').toLowerCase().trim();
  if (CATEGORY_COVER_IMAGES[catKey]) {
    return CATEGORY_COVER_IMAGES[catKey];
  }

  // Default energetic sports/social image
  return CATEGORY_COVER_IMAGES.sports;
}
