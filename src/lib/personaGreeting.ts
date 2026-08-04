export interface UserBehaviorData {
  daysInactive: number;
  matchesReceivedSpike: boolean;
  profileViewsSpike: boolean;
  emojiCount: number;
  avgReplyTimeMinutes: number;
  outgoingMessageRate: number;
  avgMessageLength: number;
  replyRate: number;
  longChatDuration: boolean;
  swipeLikeRatio: number;
  matchSuccessRate: number;
  sessionTimeBuckets: {
    earlyMorning: number; // 5AM - 9AM
    day: number;          // 9AM - 5PM
    evening: number;      // 5PM - 10PM
    lateNight: number;    // 10PM - 3AM
  };
  profileViewsCount: number;
  likesSentCount: number;
  messagesSentCount: number;
  isNewUser?: boolean;
}

export interface Persona {
  id: string;
  title: string;
  sublines: string[];
  priority: number; // Lower number = higher override priority
  calculateScore: (data: UserBehaviorData) => number;
}

export const PERSONAS: Persona[] = [
  {
    id: 'comeback_kid',
    title: 'Comeback Kid 🔄',
    sublines: ['Missed some action?', 'Back in the game.'],
    priority: 1,
    calculateScore: (data) => (data.daysInactive >= 5 ? 100 : 0),
  },
  {
    id: 'high_demand',
    title: 'High Demand 🔥',
    sublines: ['You’ve been noticed.', 'Popular today.'],
    priority: 2,
    calculateScore: (data) => (data.matchesReceivedSpike || data.profileViewsSpike ? 90 : 0),
  },
  {
    id: 'flirt_mode',
    title: 'Flirt Mode 😏',
    sublines: ['Causing trouble?', 'Behaving today?'],
    priority: 3,
    calculateScore: (data) => {
      let score = 0;
      if (data.emojiCount > 5) score += 4;
      if (data.avgReplyTimeMinutes <= 5) score += 4;
      if (data.outgoingMessageRate > 10) score += 3;
      return score;
    },
  },
  {
    id: 'smooth_talker',
    title: 'Smooth Talker 💬',
    sublines: ['Working your charm?', 'Words matter.'],
    priority: 4,
    calculateScore: (data) => {
      let score = 0;
      if (data.avgMessageLength > 80) score += 5;
      if (data.replyRate > 0.7) score += 4;
      return score;
    },
  },
  {
    id: 'deep_conversationalist',
    title: 'Deep Conversationalist 🧠',
    sublines: ['Going beyond ‘hey’.', 'Depth over noise.'],
    priority: 5,
    calculateScore: (data) => {
      let score = 0;
      if (data.avgMessageLength > 120) score += 5;
      if (data.longChatDuration) score += 5;
      return score;
    },
  },
  {
    id: 'selective_sniper',
    title: 'Selective Sniper 🎯',
    sublines: ['Quality over quantity.', 'Precision matters.'],
    priority: 6,
    calculateScore: (data) => {
      let score = 0;
      if (data.swipeLikeRatio < 0.25) score += 5;
      if (data.matchSuccessRate > 0.6) score += 5;
      return score;
    },
  },
  {
    id: 'heart_collector',
    title: 'Heart Collector 🌊',
    sublines: ['Casting a wide net?', 'Exploring options?'],
    priority: 7,
    calculateScore: (data) => {
      let score = 0;
      if (data.swipeLikeRatio > 0.7) score += 5;
      if (data.likesSentCount > 20) score += 4;
      return score;
    },
  },
  {
    id: 'night_owl',
    title: 'Night Owl 🦉',
    sublines: ['The night suits you.', 'Still awake?'],
    priority: 8,
    calculateScore: (data) => {
      const totalSessions = Object.values(data.sessionTimeBuckets).reduce((a, b) => a + b, 0) || 1;
      const nightRatio = data.sessionTimeBuckets.lateNight / totalSessions;
      return nightRatio >= 0.5 ? 8 : nightRatio * 10;
    },
  },
  {
    id: 'early_spark',
    title: 'Early Spark 🌅',
    sublines: ['Starting early?', 'First move energy.'],
    priority: 9,
    calculateScore: (data) => {
      const totalSessions = Object.values(data.sessionTimeBuckets).reduce((a, b) => a + b, 0) || 1;
      const morningRatio = data.sessionTimeBuckets.earlyMorning / totalSessions;
      return morningRatio >= 0.5 ? 7 : morningRatio * 10;
    },
  },
  {
    id: 'silent_watcher',
    title: 'Silent Watcher 👀',
    sublines: ['Just observing?', 'Watching quietly.'],
    priority: 10,
    calculateScore: (data) => {
      let score = 0;
      if (data.profileViewsCount > 15 && data.likesSentCount < 3 && data.messagesSentCount < 2) {
        score = 8;
      }
      return score;
    },
  },
];

export const DEFAULT_PERSONA = {
  id: 'new_energy',
  title: 'New Energy ✨',
  sublines: ['Let’s get started.'],
  priority: 99,
};

export interface ActivePersonaState {
  personaId: string;
  title: string;
  subline: string;
  lockedUntil: number; // Timestamp
}

export function computePersona(data: UserBehaviorData): { title: string; subline: string; personaId: string } {
  if (data.isNewUser) {
    return {
      personaId: DEFAULT_PERSONA.id,
      title: DEFAULT_PERSONA.title,
      subline: DEFAULT_PERSONA.sublines[0],
    };
  }

  const scoredPersonas = PERSONAS.map((p) => ({
    persona: p,
    score: p.calculateScore(data),
  })).filter((item) => item.score > 0);

  if (scoredPersonas.length === 0) {
    return {
      personaId: DEFAULT_PERSONA.id,
      title: DEFAULT_PERSONA.title,
      subline: DEFAULT_PERSONA.sublines[0],
    };
  }

  // Sort by priority (lower number = higher priority), then by score
  scoredPersonas.sort((a, b) => {
    if (a.persona.priority !== b.persona.priority && (a.persona.priority <= 2 || b.persona.priority <= 2)) {
      return a.persona.priority - b.persona.priority;
    }
    return b.score - a.score;
  });

  const selected = scoredPersonas[0].persona;
  const randomSubline = selected.sublines[Math.floor(Math.random() * selected.sublines.length)];

  return {
    personaId: selected.id,
    title: selected.title,
    subline: randomSubline,
  };
}
