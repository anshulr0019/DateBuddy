/* Interests are stored and compared by plain name ("Coffee"). Older
   onboarding builds saved emoji-prefixed labels ("☕ Coffee"); this maps
   both to the same plain name. Safe on client and server. */
export function plainInterest(name: string): string {
  return name
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const INTEREST_OPTIONS = [
  'Photography', 'Travel', 'Music', 'Fitness', 'Food',
  'Art', 'Gaming', 'Reading', 'Movies', 'Dancing',
  'Cooking', 'Sports', 'Fashion', 'Pets', 'Running',
  'Yoga', 'Karaoke', 'Plants', 'Coffee', 'Beer',
  'Theater', 'Tech', 'Hiking', 'Beach', 'Nightlife',
] as const;
