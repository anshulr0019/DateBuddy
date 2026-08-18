import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  area: string;
  icon: string;
  category: string;
}

const CATEGORY_TERMS: Record<string, string> = {
  gym: 'gym fitness center',
  sports: 'badminton court sports turf football ground',
  coffee: 'cafe coffee shop',
  drinks: 'bar pub lounge nightlife',
  food: 'restaurant eatery dining',
  movies: 'cinema movie theatre mall',
  outdoors: 'park garden beach fort hill trek',
};

const CATEGORY_ICONS: Record<string, string> = {
  gym: '🏋️',
  sports: '🏸',
  coffee: '☕',
  drinks: '🍹',
  food: '🍕',
  movies: '🍿',
  outdoors: '🥾',
};

// Popular curated places for instant 0ms response across major Indian cities
const POPULAR_CITY_PLACES: Record<string, PlaceResult[]> = {
  janakpuri: [
    { id: 'jk1', category: 'gym', name: 'Fit7 Gym & Fitness Club', area: 'Janakpuri Block C', address: 'Block C1A, Janakpuri, New Delhi', icon: '🏋️' },
    { id: 'jk2', category: 'gym', name: 'Gold\'s Gym Janakpuri', area: 'Janakpuri District Centre', address: 'Plot No. 9, District Centre, Janakpuri, New Delhi', icon: '🏋️' },
    { id: 'jk3', category: 'gym', name: 'Cult.fit Janakpuri', area: 'Janakpuri West', address: 'Opp. Janakpuri West Metro Station, New Delhi', icon: '🏋️' },
    { id: 'jk4', category: 'sports', name: 'DDA Sports Complex Badminton Courts', area: 'Janakpuri Block B', address: 'Block B, Janakpuri, New Delhi', icon: '🏸' },
    { id: 'jk5', category: 'sports', name: 'Janakpuri Box Cricket Turf', area: 'Janakpuri', address: 'Near Unity One Mall, Janakpuri West', icon: '🏏' },
    { id: 'jk6', category: 'coffee', name: 'Third Wave Coffee Janakpuri', area: 'District Centre', address: 'Unity One Mall, Janakpuri, New Delhi', icon: '☕' },
    { id: 'jk7', category: 'coffee', name: 'Blue Tokai Coffee Janakpuri', area: 'Janakpuri West', address: 'Janakpuri West Metro Complex, New Delhi', icon: '☕' },
  ],
  delhi: [
    { id: 'dl1', category: 'gym', name: 'Gold\'s Gym Connaught Place', area: 'Connaught Place', address: 'Outer Circle, Connaught Place, New Delhi', icon: '🏋️' },
    { id: 'dl2', category: 'sports', name: 'Siri Fort Sports Complex Badminton', area: 'August Kranti Marg', address: 'August Kranti Marg, Siri Fort, New Delhi', icon: '🏸' },
    { id: 'dl3', category: 'coffee', name: 'Diggin Cafe', area: 'Chanakyapuri', address: 'Santushti Shopping Complex, Chanakyapuri', icon: '☕' },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';
    const category = (searchParams.get('category') || 'gym').toLowerCase();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, places: [] });
    }

    const qLower = query.toLowerCase();
    const categoryTerm = CATEGORY_TERMS[category] || 'place';
    const icon = CATEGORY_ICONS[category] || '📍';

    let places: PlaceResult[] = [];

    // Check popular curated instant database (0ms lookup)
    for (const [key, items] of Object.entries(POPULAR_CITY_PLACES)) {
      if (qLower.includes(key)) {
        const matches = items.filter(
          (item) => item.category === category || qLower.includes(item.name.toLowerCase())
        );
        if (matches.length > 0) {
          places.push(...matches);
        }
      }
    }

    // 100% Free OpenStreetMap / Nominatim Live Places Search (No credit card or API key required)
    try {
      const searchQuery = `${query} ${categoryTerm}`;
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchQuery
      )}&format=json&addressdetails=1&limit=10&countrycodes=in`;

      const osmRes = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'Infyn-App/1.0 (contact@infyn.app)',
        },
      });

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (Array.isArray(osmData) && osmData.length > 0) {
          const fetchedPlaces = osmData.map((item: any, idx: number) => {
            const name = item.namedetails?.name || item.display_name.split(',')[0];
            const address = item.display_name;
            const addrObj = item.address || {};
            const area =
              addrObj.suburb ||
              addrObj.neighbourhood ||
              addrObj.residential ||
              addrObj.city_district ||
              addrObj.city ||
              'Location';

            return {
              id: `osm-${item.place_id || idx}`,
              name,
              address,
              area,
              icon,
              category,
            };
          });

          // De-duplicate against existing results
          const existingNames = new Set(places.map((p) => p.name.toLowerCase()));
          for (const fp of fetchedPlaces) {
            if (!existingNames.has(fp.name.toLowerCase())) {
              places.push(fp);
            }
          }
        }
      }
    } catch (err) {
      console.warn('OpenStreetMap live search warning:', err);
    }

    return NextResponse.json(
      { success: true, places, source: 'free_engine' },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error searching live places:', error);
    return NextResponse.json({ success: false, places: [] }, { status: 500 });
  }
}
