/* ─────────────────────────────────────────────────
   Random Chat — central configuration
   All limits/labels live here so nothing is hardcoded
   across routes or components.
───────────────────────────────────────────────── */

export const RANDOM_CHAT_VIBES = [
  'chill',
  'funny',
  'deep talks',
  'flirty',
  'random',
  'late night',
  'creative',
  'gaming',
  'fitness',
  'music',
] as const;
export type RandomChatVibe = (typeof RANDOM_CHAT_VIBES)[number];

export const VIBE_EMOJI: Record<string, string> = {
  'chill': '🍃',
  'funny': '😂',
  'deep talks': '🌌',
  'flirty': '😉',
  'random': '🎲',
  'late night': '🌙',
  'creative': '🎨',
  'gaming': '🎮',
  'fitness': '💪',
  'music': '🎵',
};

export const GENDER_PREFS = ['men', 'women', 'everyone'] as const;
export type RandomChatGenderPref = (typeof GENDER_PREFS)[number];

/* How long a queue entry stays viable before the sweep removes it. */
export const QUEUE_TTL_MS = 2 * 60 * 1000;
/* Poll cadence the client should use while searching / in an active chat. */
export const RANDOM_CHAT_POLL_MS = 3_500;
/* Online-presence window — mirrors the feed's ONLINE_WINDOW_MS. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
/* Don't rematch the same person again within this window. */
export const RECENT_SESSION_EXCLUDE_MS = 60 * 60 * 1000;
/* Max messages returned by a session poll. */
export const MAX_SESSION_MESSAGES = 100;
/* Message body length cap. */
export const MAX_MESSAGE_LENGTH = 4000;
/* Safety check surfaces after this many messages. */
export const SAFETY_CHECK_AFTER_MESSAGES = 5;

export const REPORT_REASONS = [
  'harassment',
  'sexual content',
  'hate / abuse',
  'spam',
  'scam',
  'underage concern',
  'threatening behavior',
  'other',
] as const;
export type RandomChatReportReason = (typeof REPORT_REASONS)[number];

/* Central rate-limit table (window in ms → max hits). In-memory per
   server instance — acceptable for this single-process deployment, and
   documented as the scale path to Upstash Redis. */
export const RATE_LIMITS = {
  join:        { windowMs: 60_000, max: 8 },    // queue joins
  leave:       { windowMs: 60_000, max: 12 },   // queue leaves
  end:         { windowMs: 60_000, max: 10 },   // end conversation / next person
  messages:    { windowMs: 30_000, max: 20 },   // messages per 30s
  connection:  { windowMs: 60_000, max: 6 },    // connect requests
  report:      { windowMs: 60_000, max: 4 },    // reports
  block:       { windowMs: 60_000, max: 8 },    // blocks
} as const;
export type RateLimitKey = keyof typeof RATE_LIMITS;

/* Deterministic icebreaker templates. Prompts themed on shared interests are
   generated at runtime from this pool when the pair has common tags. */
export const ICEBREAKERS = [
  "What's on repeat right now? 🎧",
  "What's your ideal weekend? 🌤️",
  "What's something you've always wanted to try? ✨",
  "What's the most random thing you're into? 🎲",
  'Would you rather travel or stay home? 🧳',
  'Describe your perfect lazy Sunday. ☁️',
  "What's a movie you can watch a hundred times? 🎬",
] as const;

export const INTEREST_ICEBREAKERS: Record<string, string[]> = {
  'music': ['What song are you obsessed with lately? 🎧', 'Top artist at your last concert? 🎤'],
  'fitness': ['Gym in the morning or evening? 💪', 'Current PR you are chasing? 🏆'],
  'travel': ['One place you would move to tomorrow? ✈️', 'Best trip you have ever taken? 🌍'],
  'gaming': ['What are you grinding right now? 🎮', 'Single-player or squad? 🕹️'],
  'food': ['Instant noodles or a five-course meal? 🍜', 'Go-to comfort food after a bad day? 🍕'],
  'movies': ['What genre do you always pick? 🎬', 'Popcorn or nachos? 🍿'],
  'books': ['Last book that kept you up? 📚', 'Physical books or e-reader? 📖'],
  'photography': ['What do you love shooting most? 📷', 'Golden hour or blue hour? 🌅'],
  'hiking': ['What is the best trail you have done? 🏔️', 'Summit sunrise or sunset? 🌄'],
  'yoga': ['Morning flow or evening wind-down? 🧘', 'Favourite pose to reset? 🌿'],
  'dancing': ['Best place to dance in your city? 💃', 'Freestyle or choreo? 🕺'],
  'cooking': ['What is your signature dish? 👨‍🍳', 'Spicy or mild? 🌶️'],
  'anime': ['What are you binging this season? 🎌', 'Sub or dub? 🤔'],
  'tech': ['Android or iOS? 📱', 'What is the next big thing in tech? 🚀'],
  'pets': ['Cat person or dog person? 🐾', 'Tell me about your pet 🐶'],
  'plants': ['How many plants is too many? 🌱', 'Do you talk to your plants? 🌿'],
  'coffee': ['How do you take your coffee? ☕', 'Latte art — yes or no? 🎨'],
  'nightlife': ['Clubs or chill rooftop bars? 🌃', 'Best night out you remember? ✨'],
  'sports': ['Which sport can you watch all day? ⚽', 'Play or spectate? 🏃'],
  'art': ['Paint, sketch or digital? 🎨', 'Favourite art museum? 🖼️'],
};
