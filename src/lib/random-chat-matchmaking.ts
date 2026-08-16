import { db } from '@/db';
import {
  users,
  photos,
  preferences,
  interests,
  userInterests,
  matches,
  notifications,
  blocks,
  randomChatQueue,
  randomChatSessions,
  randomChatMessages,
  randomChatReports,
} from '@/db/schema';
import {
  and,
  asc,
  eq,
  gt,
  inArray,
  lt,
  ne,
  or,
  notExists,
  sql,
  type InferSelectModel,
} from 'drizzle-orm';
import {
  QUEUE_TTL_MS,
  ONLINE_WINDOW_MS,
  RECENT_SESSION_EXCLUDE_MS,
  MAX_SESSION_MESSAGES,
  RANDOM_CHAT_VIBES,
  GENDER_PREFS,
  ICEBREAKERS,
  INTEREST_ICEBREAKERS,
  type RandomChatReportReason,
} from './random-chat-config';
import { assignAliases, getInitialAlias, type AnonymousAlias } from './random-chat-aliases';

/* ─────────────────────────────────────────────────
   Public types (shared with the API layer)
───────────────────────────────────────────────── */

export interface RandomChatPreferences {
  vibe: string;
  ageMin: number;
  ageMax: number;
  genderPref: string;
  interests: string[];
}

export type SessionMessage = {
  id: number;
  senderIsMe: boolean;
  content: string;
  createdAt: string;
};

export type SessionStatus = 'active' | 'connected' | 'ended';

export type SessionState = {
  status: 'none' | 'searching' | 'matched' | 'ended';
  searching?: { vibe: string };
  session: {
    id: number;
    myAlias: string;
    status: SessionStatus;
    vibe: string | null;
    partner: {
      alias: string;
      age: number | null;
      interests: string[];
      sharedInterests: string[];
    } | null;
    connection: {
      requestedByMe: boolean;
      requestedByPartner: boolean;
      isMutual: boolean;
    };
    match: {
      matchId: number;
      partnerName: string;
      partnerPhoto: string | null;
      partnerCity: string | null;
      partnerVerified: boolean;
    } | null;
    messages: SessionMessage[];
    endedByMe: boolean | null;
    icebreakers: string[];
  } | null;
};

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function pickIcebreakers(myInterests: string[], partnerInterests: string[]): string[] {
  const shared = myInterests.filter((i) => partnerInterests.includes(i));
  const themed: string[] = [];
  for (const interest of shared) {
    const pool = INTEREST_ICEBREAKERS[interest.toLowerCase()];
    if (pool) themed.push(pool[themed.length % pool.length]);
    if (themed.length >= 2) break;
  }
  const base = [...ICEBREAKERS].filter((b) => !themed.includes(b));
  const rest = base.slice(0, Math.max(0, 4 - themed.length));
  return [...themed, ...rest].slice(0, 4);
}

function normalizePair(a: number, b: number) {
  return a < b ? { user1Id: a, user2Id: b } : { user1Id: b, user2Id: a };
}

/* ─────────────────────────────────────────────────
   Queue lifecycle
───────────────────────────────────────────────── */

/** Remove stale queue rows for a user's own bookkeeping on leave. */
export async function leaveQueue(userId: number): Promise<void> {
  await db.delete(randomChatQueue).where(eq(randomChatQueue.userId, userId));
}

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function activeSessionFor(userId: number, tx: typeof db | DbTx = db) {
  const [session] = await tx
    .select()
    .from(randomChatSessions)
    .where(
      and(
        or(eq(randomChatSessions.userAId, userId), eq(randomChatSessions.userBId, userId)),
        inArray(randomChatSessions.status, ['active', 'connected'])
      )
    )
    .orderBy(asc(randomChatSessions.id))
    .limit(1);
  return session ?? null;
}

/**
 * Join the queue and attempt one match, inside a single transaction.
 *
 * Concurrency safety:
 *  - the queue's unique(user_id) upsert serializes duplicate joins from the
 *    same user (two tabs cannot sit in the queue twice);
 *  - candidate rows are claimed with FOR UPDATE SKIP LOCKED, so two concurrent
 *    searchers can never be matched into the same pair of sessions;
 *  - the requester's own row is locked before scanning, so one user cannot be
 *    matched with two different partners at once.
 */
export async function joinRandomChat(userId: number, prefs: RandomChatPreferences): Promise<'searching' | 'matched'> {
  const [user] = await db.select({ name: users.name, gender: users.gender, dateOfBirth: users.dateOfBirth }).from(users).where(eq(users.id, userId));
  if (!user) throw new Error('account-not-found');

  const vibe = RANDOM_CHAT_VIBES.includes(prefs.vibe as never) ? prefs.vibe : 'random';
  const ageMin = Math.max(18, Math.min(60, Math.round(prefs.ageMin) || 18));
  const ageMax = Math.max(ageMin, Math.min(70, Math.round(prefs.ageMax) || 30));
  const genderPref = GENDER_PREFS.includes(prefs.genderPref as never) ? prefs.genderPref : 'everyone';
  const interestsList = Array.isArray(prefs.interests)
    ? prefs.interests.filter((i: unknown): i is string => typeof i === 'string').slice(0, 50)
    : [];
  const myAge = calculateAge(user.dateOfBirth);

  let matched = false;

  await db.transaction(async (tx) => {
    const now = new Date();

    // A user already mid-conversation should never be re-queued, unless the previous session was already promoted to connected.
    const existing = await activeSessionFor(userId, tx);
    if (existing) {
      if (existing.status === 'connected') {
        await tx
          .update(randomChatSessions)
          .set({ status: 'ended', endedByUserId: userId, endedAt: now })
          .where(eq(randomChatSessions.id, existing.id));
      } else {
        // Active mid-chat session — leave as-is to surface it.
        return;
      }
    }

    // Sweep expired candidates.
    await tx.delete(randomChatQueue).where(lt(randomChatQueue.expiresAt, now));

    // Idempotent enqueue (unique index on user_id).
    await tx
      .insert(randomChatQueue)
      .values({
        userId,
        vibe,
        ageMin,
        ageMax,
        genderPref,
        interests: JSON.stringify(interestsList),
        expiresAt: new Date(Date.now() + QUEUE_TTL_MS),
      })
      .onConflictDoUpdate({
        target: randomChatQueue.userId,
        set: {
          vibe,
          ageMin,
          ageMax,
          genderPref,
          interests: JSON.stringify(interestsList),
          joinedAt: now,
          expiresAt: new Date(Date.now() + QUEUE_TTL_MS),
        },
      });

    // Lock the requester's row so concurrent requests for the same user serialize.
    await tx
      .select({ id: randomChatQueue.id })
      .from(randomChatQueue)
      .where(eq(randomChatQueue.userId, userId))
      .for('update');

    const noActiveSession = notExists(
      tx
        .select({ id: randomChatSessions.id })
        .from(randomChatSessions)
        .where(
          and(
            or(
              and(eq(randomChatSessions.userAId, randomChatQueue.userId), eq(randomChatSessions.userBId, userId)),
              and(eq(randomChatSessions.userBId, randomChatQueue.userId), eq(randomChatSessions.userAId, userId))
            ),
            inArray(randomChatSessions.status, ['active', 'connected'])
          )
        )
    );

    // Vibe is a soft preference: exact-vibe pass first, then any-compatible pass.
    for (const vibePass of [true, false]) {
      const candidates = await tx
        .select({
          id: randomChatQueue.id,
          userId: randomChatQueue.userId,
          ageMin: randomChatQueue.ageMin,
          ageMax: randomChatQueue.ageMax,
          genderPref: randomChatQueue.genderPref,
          joinedAt: randomChatQueue.joinedAt,
          name: users.name,
          gender: users.gender,
          dateOfBirth: users.dateOfBirth,
        })
        .from(randomChatQueue)
        .innerJoin(users, eq(randomChatQueue.userId, users.id))
        .where(
          and(
            ne(randomChatQueue.userId, userId),
            eq(users.isActive, true),
            vibePass ? eq(randomChatQueue.vibe, vibe) : undefined,
            // Candidate accepts me.
            or(eq(randomChatQueue.genderPref, 'everyone'), eq(randomChatQueue.genderPref, user.gender)),
            // I accept the candidate.
            or(sql`${genderPref} = 'everyone'`, sql`${users.gender}::text = ${genderPref}`),
            gt(randomChatQueue.expiresAt, now),
            noActiveSession,
            notExists(
              db
                .select({ id: blocks.id })
                .from(blocks)
                .where(
                  or(
                    and(eq(blocks.blockerId, userId), eq(blocks.blockedId, randomChatQueue.userId)),
                    and(eq(blocks.blockerId, randomChatQueue.userId), eq(blocks.blockedId, userId))
                  )
                )
            )
          )
        )
        .orderBy(asc(randomChatQueue.joinedAt))
        .limit(12)
        .for('update', { skipLocked: true });

      if (candidates.length === 0) continue;

      const candidateIds = candidates.map((c) => c.userId);

      // Batch exclusion checks against real data.
      const recentSessions = await tx
        .select()
        .from(randomChatSessions)
        .where(
          and(
            or(
              and(eq(randomChatSessions.userAId, userId), inArray(randomChatSessions.userBId, candidateIds)),
              and(eq(randomChatSessions.userBId, userId), inArray(randomChatSessions.userAId, candidateIds))
            ),
            or(
              inArray(randomChatSessions.status, ['active', 'connected']),
              gt(randomChatSessions.createdAt, new Date(Date.now() - RECENT_SESSION_EXCLUDE_MS))
            )
          )
        );

      const recentPartnerIds = new Set(
        recentSessions.map((s) => (s.userAId === userId ? s.userBId : s.userAId))
      );

      const activeMatches = await tx
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.isActive, true),
            or(
              and(eq(matches.user1Id, userId), inArray(matches.user2Id, candidateIds)),
              and(eq(matches.user2Id, userId), inArray(matches.user1Id, candidateIds))
            )
          )
        );
      const activeMatchIds = new Set(
        activeMatches.map((m) => (m.user1Id === userId ? m.user2Id : m.user1Id))
      );

      const pick = candidates.find((c) => {
        if (recentPartnerIds.has(c.userId)) return false;
        if (activeMatchIds.has(c.userId)) return false;
        const cAge = calculateAge(c.dateOfBirth);
        return cAge >= ageMin && cAge <= ageMax && myAge >= c.ageMin && myAge <= c.ageMax;
      });

      if (!pick) continue;

      const { aliasA, aliasB } = assignAliases(user.name, pick.name);
      const aliasAStr = aliasA.name;
      const aliasBStr = aliasB.name;

      const [session] = await tx
        .insert(randomChatSessions)
        .values({
          userAId: userId,
          userBId: pick.userId,
          aliasA: aliasAStr,
          aliasB: aliasBStr,
          vibe,
        })
        .returning();

      // Claim the candidate: removing the queue row is what prevents double-match.
      await tx.delete(randomChatQueue).where(eq(randomChatQueue.id, pick.id));
      await tx.delete(randomChatQueue).where(eq(randomChatQueue.userId, userId));

      matched = Boolean(session);
      return;
    }
  });

  return matched ? 'matched' : 'searching';
}

/* ─────────────────────────────────────────────────
   Session state
───────────────────────────────────────────────── */

async function interestsFor(userId: number): Promise<string[]> {
  const rows = await db
    .select({ name: interests.name })
    .from(userInterests)
    .innerJoin(interests, eq(userInterests.interestId, interests.id))
    .where(eq(userInterests.userId, userId));
  return rows.map((r) => r.name);
}

export async function getSessionState(userId: number): Promise<SessionState> {
  const [queueRow] = await db
    .select()
    .from(randomChatQueue)
    .where(eq(randomChatQueue.userId, userId));

  // Active / connected session takes precedence over the queue.
  const session = await activeSessionFor(userId);
  if (session) return buildSessionState(session, userId);

  // A recently-ended session surfaces a clean "partner left" state.
  if (queueRow) {
    return {
      status: 'searching',
      searching: { vibe: queueRow.vibe },
      session: null,
    };
  }

  const [lastSession] = await db
    .select()
    .from(randomChatSessions)
    .where(or(eq(randomChatSessions.userAId, userId), eq(randomChatSessions.userBId, userId)))
    .orderBy(sql`${randomChatSessions.id} desc`)
    .limit(1);

  if (
    lastSession &&
    lastSession.status === 'ended' &&
    lastSession.endedAt &&
    Date.now() - new Date(lastSession.endedAt).getTime() < 30_000
  ) {
    return buildSessionState(lastSession, userId);
  }

  return { status: 'none', session: null };
}

async function buildSessionState(session: InferSelectModel<typeof randomChatSessions>, userId: number): Promise<SessionState> {
  const isA = session.userAId === userId;
  const partnerId = isA ? session.userBId : session.userAId;
  const myAlias = isA ? session.aliasA : session.aliasB;
  const partnerAlias = isA ? session.aliasB : session.aliasA;

  if (session.status === 'ended') {
    return {
      status: 'ended',
      session: {
        id: session.id,
        myAlias,
        status: 'ended' as const,
        vibe: session.vibe,
        partner: null,
        connection: {
          requestedByMe: false,
          requestedByPartner: false,
          isMutual: false,
        },
        match: null,
        messages: [],
        endedByMe: session.endedByUserId === userId,
        icebreakers: [],
      },
    };
  }

  const [partnerUser, partnerPhotos, myInterests, partnerInterests, rows, matchRow] = await Promise.all([
    db.select().from(users).where(eq(users.id, partnerId)),
    db.select({ url: photos.url }).from(photos).where(eq(photos.userId, partnerId)).orderBy(photos.orderIndex).limit(1),
    interestsFor(userId),
    interestsFor(partnerId),
    db
      .select()
      .from(randomChatMessages)
      .where(eq(randomChatMessages.sessionId, session.id))
      .orderBy(asc(randomChatMessages.id))
      .limit(MAX_SESSION_MESSAGES),
    session.matchId
      ? db.select().from(matches).where(eq(matches.id, session.matchId)).limit(1)
      : Promise.resolve([]),
  ]);

  const partner = partnerUser[0];
  const sharedInterests = myInterests.filter((i) => partnerInterests.includes(i));

  const matchId = matchRow[0]?.id ?? null;
  const requestedByMe = isA ? session.connectionRequestedByA : session.connectionRequestedByB;
  const requestedByPartner = isA ? session.connectionRequestedByB : session.connectionRequestedByA;
  const isMutual = requestedByMe && requestedByPartner;

  return {
    status: 'matched',
    session: {
      id: session.id,
      myAlias,
      status: session.status as SessionStatus,
      vibe: session.vibe,
      partner: {
        alias: partner?.name ? getInitialAlias(partner.name).name : partnerAlias,
        age: partner ? calculateAge(partner.dateOfBirth) : null,
        interests: partnerInterests,
        sharedInterests,
      },
      connection: {
        requestedByMe,
        requestedByPartner,
        isMutual,
      },
      match:
        matchId && partner
          ? {
              matchId,
              partnerName: partner.name,
              partnerPhoto: partnerPhotos[0]?.url ?? null,
              partnerCity: partner.city ?? null,
              partnerVerified: Boolean(partner.isVerified),
            }
          : null,
      messages: rows.map((m) => ({
        id: m.id,
        senderIsMe: m.senderId === userId,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      endedByMe: null,
      icebreakers: pickIcebreakers(myInterests, partnerInterests),
    },
  };
}

/* ─────────────────────────────────────────────────
   Session actions
───────────────────────────────────────────────── */

async function requireSessionParticipant(sessionId: number, userId: number) {
  const [session] = await db
    .select()
    .from(randomChatSessions)
    .where(and(eq(randomChatSessions.id, sessionId), or(eq(randomChatSessions.userAId, userId), eq(randomChatSessions.userBId, userId))));
  return session ?? null;
}

export async function endSession(sessionId: number, userId: number): Promise<void> {
  const session = await requireSessionParticipant(sessionId, userId);
  if (!session || (session.status !== 'active' && session.status !== 'connected')) return;
  await db
    .update(randomChatSessions)
    .set({ status: 'ended', endedByUserId: userId, endedAt: new Date() })
    .where(eq(randomChatSessions.id, sessionId));
}

export async function sendSessionMessage(sessionId: number, userId: number, content: string): Promise<SessionMessage | null> {
  const session = await requireSessionParticipant(sessionId, userId);
  if (!session || session.status !== 'active') return null;
  const [row] = await db
    .insert(randomChatMessages)
    .values({ sessionId, senderId: userId, content })
    .returning();
  return {
    id: row.id,
    senderIsMe: true,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

export type ConnectionResult =
  | { matched: false }
  | { matched: true; matchId: number; partnerName: string; partnerPhoto: string | null };

export async function requestConnection(sessionId: number, userId: number, want: boolean): Promise<ConnectionResult> {
  const session = await requireSessionParticipant(sessionId, userId);
  if (!session || session.status !== 'active') {
    throw new Error('session-not-active');
  }
  const isA = session.userAId === userId;
  const partnerId = isA ? session.userBId : session.userAId;

  const update = isA
    ? { connectionRequestedByA: want }
    : { connectionRequestedByB: want };
  await db.update(randomChatSessions).set(update).where(eq(randomChatSessions.id, sessionId));

  const [fresh] = await db
    .select()
    .from(randomChatSessions)
    .where(eq(randomChatSessions.id, sessionId));

  const requestedByMe = isA ? fresh.connectionRequestedByA : fresh.connectionRequestedByB;
  const requestedByPartner = isA ? fresh.connectionRequestedByB : fresh.connectionRequestedByA;

  if (!(requestedByMe && requestedByPartner)) {
    return { matched: false };
  }

  // Mutual consent — promote into a real match using the existing matches table.
  const pair = normalizePair(userId, partnerId);
  const [match] = await db
    .insert(matches)
    .values({ user1Id: pair.user1Id, user2Id: pair.user2Id })
    .onConflictDoNothing()
    .returning();

  let matchId = match?.id ?? null;
  if (matchId === null) {
    const [existing] = await db
      .select({ id: matches.id })
      .from(matches)
      .where(and(eq(matches.user1Id, pair.user1Id), eq(matches.user2Id, pair.user2Id)));
    matchId = existing?.id ?? null;
  }

  await db
    .update(randomChatSessions)
    .set({ status: 'connected', matchId })
    .where(eq(randomChatSessions.id, sessionId));

  const [partnerUser] = await db.select().from(users).where(eq(users.id, partnerId));
  const [partnerPhoto] = await db.select({ url: photos.url }).from(photos).where(eq(photos.userId, partnerId)).orderBy(photos.orderIndex).limit(1);

  if (matchId) {
    await db.insert(notifications).values([
      {
        userId,
        type: 'match',
        title: "It's a Match! 🎉",
        body: 'You and a stranger became a connection.',
        metadata: { matchId },
      },
      {
        userId: partnerId,
        type: 'match',
        title: "It's a Match! 🎉",
        body: 'Someone you met anonymously wants to connect.',
        metadata: { matchId },
      },
    ]);
  }

  return {
    matched: true,
    matchId: matchId ?? 0,
    partnerName: partnerUser?.name ?? 'Your connection',
    partnerPhoto: partnerPhoto?.url ?? null,
  };
}

export async function reportInSession(
  sessionId: number,
  userId: number,
  reason: RandomChatReportReason,
  details: string | null
): Promise<void> {
  const session = await requireSessionParticipant(sessionId, userId);
  if (!session) return;
  const partnerId = session.userAId === userId ? session.userBId : session.userAId;

  await db.insert(randomChatReports).values({
    reporterId: userId,
    reportedUserId: partnerId,
    sessionId,
    reason,
    details: details ? details.slice(0, 1000) : null,
  });
  if (session.status === 'active') {
    await db
      .update(randomChatSessions)
      .set({ status: 'ended', endedByUserId: userId, endedAt: new Date() })
      .where(eq(randomChatSessions.id, sessionId));
  }
}

export async function blockInSession(sessionId: number, userId: number): Promise<void> {
  const session = await requireSessionParticipant(sessionId, userId);
  if (!session) return;
  const partnerId = session.userAId === userId ? session.userBId : session.userAId;

  // Reuse the permanent blocks table + teardown semantics of /api/blocks.
  const [existing] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(and(eq(blocks.blockerId, userId), eq(blocks.blockedId, partnerId)));
  if (!existing) {
    await db.insert(blocks).values({ blockerId: userId, blockedId: partnerId });
  }
  const pair = normalizePair(userId, partnerId);
  await db
    .update(matches)
    .set({ isActive: false })
    .where(and(eq(matches.user1Id, pair.user1Id), eq(matches.user2Id, pair.user2Id)));

  if (session.status === 'active') {
    await db
      .update(randomChatSessions)
      .set({ status: 'ended', endedByUserId: userId, endedAt: new Date() })
      .where(eq(randomChatSessions.id, sessionId));
  }
}

/* ─────────────────────────────────────────────────
   Home card overview — honest, real numbers only
───────────────────────────────────────────────── */

export async function getRandomChatOverview(userId: number) {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const now = new Date();

  const [onlineCountRow, activeChatsRow, queueRow, activeSession] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.isActive, true), gt(users.lastActiveAt, cutoff))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(randomChatSessions)
      .where(and(eq(randomChatSessions.status, 'active'), gt(randomChatSessions.createdAt, new Date(Date.now() - 10 * 60 * 1000)))),
    db.select().from(randomChatQueue).where(eq(randomChatQueue.userId, userId)).limit(1),
    activeSessionFor(userId),
  ]);

  return {
    onlineCount: Number(onlineCountRow[0]?.count ?? 0),
    chattingNow: Number(activeChatsRow[0]?.count ?? 0),
    inQueue: Boolean(queueRow[0]),
    hasActiveSession: Boolean(activeSession),
  };
}

/* ─────────────────────────────────────────────────
   User preferences prefill for the entry screen
───────────────────────────────────────────────── */

export async function getRandomChatPrefill(userId: number) {
  const [user, userPrefs, tags] = await Promise.all([
    db.select({ gender: users.gender, lookingFor: users.lookingFor }).from(users).where(eq(users.id, userId)),
    db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1),
    interestsFor(userId),
  ]);
  const prefs = userPrefs[0];
  return {
    gender: user[0]?.gender ?? 'other',
    lookingFor: user[0]?.lookingFor ?? 'everyone',
    ageMin: prefs?.ageMin ?? 18,
    ageMax: prefs?.ageMax ?? 30,
    interests: tags,
  };
}
