<div align="center">

<br/>

<img src="https://capsule-render.vercel.app/api?type=venom&color=FF4D8D,9B59B6,7B68EE&height=250&section=header&text=INFYN&fontSize=120&fontColor=ffffff&fontAlignY=55&animation=fadeIn&desc=Where%20Digital%20Sparks%20Become%20Real%20Connections&descSize=18&descAlignY=78&descColor=ffffff80" width="100%" />

<br/>

<a href="https://github.com/anshulr0019/DateBuddy">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=18&duration=2400&pause=900&color=FF4D8D&center=true&vCenter=true&width=800&lines=⚡+Sub-50ms+Real-Time+Chat+via+Pusher+WebSockets;📡+Free+P2P+WebRTC+Video+%26+Audio+Calling;🎮+Interactive+In-Chat+2-Player+Mini-Games;🎭+Anonymous+Radar+Speed-Dating+%26+Aliases;🤖+Context-Aware+AI+Dating+Wingman;📍+Real-World+Meetup+Hosting+%26+Venue+Discovery;📱+Haptic+PWA+·+Capacitor+iOS+%2F+Android" alt="Typing SVG" />
</a>

<br/><br/>

<!-- Tech Stack -->
<p align="center">
  <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" />
  <img src="https://img.shields.io/badge/Pusher-300D4F?style=for-the-badge&logo=pusher&logoColor=white" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-0C2340?style=for-the-badge&logo=razorpay&logoColor=2B83EA" />
  <img src="https://img.shields.io/badge/Capacitor-1199FF?style=for-the-badge&logo=capacitor&logoColor=white" />
</p>

<!-- Status Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/─────────────────────────────────────────────────────────────────────────────────-FF4D8D?style=flat-square&labelColor=FF4D8D&color=FF4D8D" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-🟢_Active_Development-FF4D8D?style=flat-square&labelColor=1a0a12" />
  &nbsp;
  <img src="https://img.shields.io/badge/Platform-Web_·_iOS_·_Android-7B68EE?style=flat-square&labelColor=0f0d1a" />
  &nbsp;
  <img src="https://img.shields.io/badge/Latency-Sub_50ms_Pusher_%2B_WebRTC-00D2D3?style=flat-square&labelColor=001a1a" />
  &nbsp;
  <img src="https://img.shields.io/badge/PRs-Welcome_🤝-22c55e?style=flat-square&labelColor=0a1a0f" />
  &nbsp;
  <img src="https://img.shields.io/badge/Built_with-💖_for_Gen--Z-f97316?style=flat-square&labelColor=1a0f00" />
</p>

</div>

---

<div align="center">

## ✦ &nbsp; WHAT IS INFYN &nbsp; ✦

</div>

> **Infyn** is a full-stack, mobile-first social discovery & dating platform engineered for Gen-Z.
> It bridges the gap between digital interaction and real-world connection by fusing cutting-edge real-time technology with human-first design.

```
  💬 Sub-50ms Messaging  ·  📡 P2P Video Calling  ·  🎮 In-Chat Mini-Games
  🎭 Anonymous Radar     ·  🎴 Swipe Discovery    ·  📍 IRL Meetup Hosting
              🤖 AI Wingman  ·  💎 VIP Monetization  ·  🛡️ Selfie Verification
```

---

## ⚡ Architecture Overview

```mermaid
flowchart TB
    subgraph CL ["🖥️  CLIENT LAYER  —  Web + Capacitor Native"]
        direction LR
        UI["⚛️ Next.js 15\nTailwind · DVH Safe-Area"]
        SW["🔔 Service Worker\nWeb Push API"]
        RTC["📡 WebRTC\nAudio / Video P2P"]
        PSH["⚡ Pusher Client\nWebSocket Real-Time"]
    end

    subgraph SV ["⚙️  SERVER & REAL-TIME ENGINE"]
        direction LR
        API["🛠️ Route Handlers\nServer Actions"]
        PB["📢 Pusher Server\nReal-Time Broadcast"]
        PUSH["🔔 Web-Push VAPID\nPush Trigger"]
        PAY["💳 Razorpay\nPayment Verification"]
    end

    subgraph DL ["🗄️  DATA & STORAGE LAYER"]
        direction LR
        DB[("🐘 Neon PostgreSQL\nServerless · Drizzle")]
        RD[("⚡ Upstash Redis\nCache · Rate Limiting")]
        CDN["🖼️ Cloudinary CDN\nMedia Storage"]
    end

    UI -->|HTTP| API
    UI <-->|WebRTC Offer/Answer| RTC
    PSH <-->|WebSocket| PB
    API -->|Broadcast| PB
    API -->|Trigger| PUSH --> SW
    API -->|Verify| PAY
    API -->|Query| DB
    API -->|Cache| RD
    API -->|Upload| CDN

    style CL fill:#FF4D8D10,stroke:#FF4D8D40,color:#fff
    style SV fill:#9B59B610,stroke:#9B59B640,color:#fff
    style DL fill:#00D2D310,stroke:#00D2D340,color:#fff
```

---

## 📱 Feature Showcase

<details open>
<summary><h3>💬 &nbsp; Ultra-Fast Messaging & Chat Engine</h3></summary>

| Feature | Details |
| :--- | :--- |
| ⚡ **Sub-50ms Latency** | Instant bidirectional message sync powered by Pusher Channels WebSocket |
| 😍 **Emoji Reactions** | WhatsApp-style long-press reaction bar — `👍 ❤️ 😂 😮 😢 🔥` |
| ↩️ **Quoted Replies** | Swipe-to-reply or one-click quoting for seamless threaded banter |
| 🎙️ **Voice Notes** | Hold-to-record with live waveform frequency visualizer & scrubber |
| 🟢 **Live Presence** | Real-time `"typing..."` indicators & `Online / Active X min ago` status |
| 🤖 **AI Wingman** | Context-aware dating assistant for witty icebreakers & sparkers |

</details>

<details>
<summary><h3>🎮 &nbsp; Interactive In-Chat Mini-Games</h3></summary>

Play turn-based 2-player games directly inside any active conversation:

```
  🔢  Guess The Number   →  Secret 1-100, real-time "Too High / Too Low" hints
  🃏  Truth or Dare       →  Spicy, deep & funny conversation card deck
  🏆  Winner Screen       →  Celebratory confetti animation on game end
  ⚡  Real-Time Sync      →  All game state synced via Pusher Channels
```

</details>

<details>
<summary><h3>📹 &nbsp; Zero-Cost WebRTC P2P Video & Audio Calling</h3></summary>

| Feature | Details |
| :--- | :--- |
| 📡 **P2P Streaming** | HD video & crisp audio directly between peers via browser WebRTC + Google STUN |
| 🔔 **Global Call Listener** | Incoming call modal with custom ringtone, vibration & Accept/Decline — on any screen |
| 🖼️ **PiP Camera Dock** | Floating draggable Picture-in-Picture self-view with mute & camera flip |
| 📞 **Call History Cards** | Auto-inserted into chat thread: `📞 Video Call · 4m 12s` or `📵 Missed Call` |

</details>

<details>
<summary><h3>🎭 &nbsp; Anonymous Radar Speed Dating</h3></summary>

```
  🌊  Vibe Filters        →  Chill · Deep Talk · Flirty · Late Night · Random
  📡  Radar Pulse UI      →  Real-time scanning animation with trivia tidbits
  🦊  Pseudonym Aliases   →  "Cosmic Panda" · "Velvet Fox" · "Neon Tiger"
  💡  Mutual Reveal       →  Both accept → session converts to permanent Match!
```

</details>

<details>
<summary><h3>🎴 &nbsp; Smart Swipe Discovery & Profile Cards</h3></summary>

| Feature | Details |
| :--- | :--- |
| 🌀 **Spring Physics** | Velocity-based gestures: Left=Pass · Right=Like · Up=Super Like |
| 🎵 **Anthem Badges** | Spotify-style embedded music anthems on every profile card |
| 💭 **Prompt Cards** | Hinge-style interactive answers: *"My ideal Sunday..."* / *"Two truths..."* |
| 🎊 **Match Screen** | Confetti modal with common interests chips & direct messaging CTA |

</details>

<details>
<summary><h3>📍 &nbsp; Real-World Meetups & Venue Discovery</h3></summary>

```
  🎨  Categories     →  Sports · Arts · Tech · Food · Nightlife · Coffee
  🗺️  Venue Picker   →  OpenStreetMap location search with geocoding
  ✅  RSVP System    →  Guest limits · host approval flow
  📌  Announcements  →  Pinned community posts within each meetup
```

</details>

<details>
<summary><h3>💎 &nbsp; VIP Pass & Razorpay Monetization</h3></summary>

| Feature | Details |
| :--- | :--- |
| 🗓️ **Subscription Tiers** | Daily · Weekly · Monthly VIP Passes |
| 👁️ **See Who Liked You** | Exclusive reveal tab for VIP members only |
| 🚀 **VIP Perks** | Unlimited likes · Swipe Rewind · Profile Spotlight · Gold Badge |
| 🔐 **Secure Checkout** | Razorpay order creation + HMAC SHA256 cryptographic verification |

</details>

<details>
<summary><h3>🛡️ &nbsp; Trust, Safety & Selfie Verification</h3></summary>

```
  🤳  Selfie Verification  →  Live gesture front-camera pose → Blue ✓ checkmark
  🚫  Safety Suite         →  Categorized reports · instant block · feed exclusion
  🔒  Auth                 →  HTTP-only JWT session cookies + OTP + Google OAuth
  ⚡  Rate Limiting        →  Redis-backed Upstash rate limiting on all endpoints
```

</details>

---

## 🗄️ Database Schema

<details>
<summary><b>Click to expand the full schema reference →</b></summary>

<br/>

<div align="center">

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| `users` | Core user accounts | `id` · `phone_number` · `email` · `name` · `date_of_birth` · `gender` · `looking_for` · `city` · `latitude` · `longitude` · `bio` · `is_verified` · `last_active_at` |
| `photos` | User gallery | `id` · `user_id` · `url` · `order_index` |
| `interests` / `user_interests` | Tag taxonomy | `id` · `name` · `icon` · `category` · `user_id` · `interest_id` |
| `prompts` / `user_prompt_answers` | Interactive Q&A | `id` · `text` · `user_id` · `prompt_id` · `answer` |
| `preferences` | Discovery filters | `user_id` · `age_min` · `age_max` · `distance_max` · `only_verified` |
| `swipes` | Swipe tracking | `swiper_id` · `swiped_id` · `action` · *(UNIQUE constraint)* |
| `matches` | Active connections | `id` · `user1_id` · `user2_id` · `matched_at` · `is_active` |
| `messages` | Full chat history | `id` · `match_id` · `sender_id` · `receiver_id` · `type` · `content` · `metadata` · `is_read` |
| `random_chat_queue` | Speed dating queue | `user_id` · `vibe` · `age_min` · `age_max` · `expires_at` |
| `random_chat_sessions` | Anonymous sessions | `id` · `user_a_id` · `user_b_id` · `alias_a` · `alias_b` · `status` · `match_id` |
| `meetups` / `meetup_attendees` | IRL events & RSVPs | `id` · `host_id` · `title` · `venue_name` · `date` · `max_attendees` · `status` |
| `subscriptions` | VIP memberships | `user_id` · `tier` · `start_date` · `end_date` · `transaction_id` |
| `notifications` | Push & in-app alerts | `id` · `user_id` · `type` · `title` · `body` · `is_read` |

</div>

</details>

---

## 🔌 API Endpoints

<details>
<summary><b>Click to expand all 18 API route handlers →</b></summary>

<br/>

<div align="center">

| Endpoint | Method | Description | Module |
| :--- | :---: | :--- | :---: |
| `/api/auth/send-otp` | `POST` | Send SMS verification code | `auth` |
| `/api/auth/verify-otp` | `POST` | Verify OTP & issue HTTP-only JWT session | `auth` |
| `/api/auth/google/login` | `GET` | Initiate Google OAuth 2.0 flow | `auth` |
| `/api/auth/google/callback` | `GET` | Handle Google OAuth code exchange | `auth` |
| `/api/auth/me` | `GET` | Get current authenticated user session | `auth` |
| `/api/feed` | `GET` | Fetch proximity & filter-matched profile cards | `discovery` |
| `/api/swipes` | `POST` | Record swipe action: `like` · `pass` · `super_like` | `discovery` |
| `/api/conversations` | `GET` | List active message threads & unread counts | `messaging` |
| `/api/messages` | `GET/POST` | Fetch history & send text/voice/media messages | `messaging` |
| `/api/messages/typing` | `POST` | Trigger real-time Pusher typing indicators | `messaging` |
| `/api/calls/signal` | `POST` | WebRTC signaling: `offer` · `answer` · `candidate` · `hangup` | `calling` |
| `/api/calls/log` | `POST` | Log call duration & status into chat thread | `calling` |
| `/api/push/subscribe` | `POST` | Register Web Push VAPID subscription | `notifications` |
| `/api/random-chat/join` | `POST` | Enter speed-dating queue with vibe filter | `radar` |
| `/api/random-chat/session` | `GET` | Poll / retrieve current speed-dating session | `radar` |
| `/api/meetups` | `GET/POST` | List & create community meetups | `meetups` |
| `/api/premium/create-order` | `POST` | Create Razorpay payment order | `premium` |
| `/api/premium/verify` | `POST` | Cryptographically verify Razorpay payment | `premium` |

</div>

</details>

---

## 🚀 Quick Start

### Prerequisites

```
  🟢  Node.js          →  v18.18+  or  v20+
  🐘  Neon PostgreSQL  →  neon.tech (serverless Postgres)
  ⚡  Pusher Channels  →  pusher.com (real-time WebSocket)
  🔴  Upstash Redis    →  upstash.com (optional · production rate-limiting)
```

### 1. Clone & Install

```bash
git clone https://github.com/anshulr0019/DateBuddy.git
cd DateBuddy
npm install
```

### 2. Configure Environment Variables

```bash
# Create .env.local in the project root
touch .env.local
```

```env
# ─── Database (Neon PostgreSQL) ─────────────────────────────────
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/infyn?sslmode=require"

# ─── Authentication & Session ────────────────────────────────────
JWT_SECRET="your-super-secure-jwt-secret-key-32-chars-min"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ─── Pusher Channels (Real-Time Chat & Calling) ──────────────────
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
PUSHER_CLUSTER="ap2"
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"

# ─── Razorpay (VIP Monetization) ────────────────────────────────
RAZORPAY_KEY_ID="rzp_test_xxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxx"

# ─── Web Push Notifications (VAPID) ─────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_vapid_public_key"
VAPID_PRIVATE_KEY="your_vapid_private_key"
VAPID_EMAIL="mailto:hello@infyn.app"

# ─── Dev Mode OTP Logging ────────────────────────────────────────
OTP_DEV_LOG=true
```

### 3. Initialize Database

```bash
# Push Drizzle schema to your Postgres database
npm run db:push

# Optional: seed sample test users & meetups
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

> 🌐 Open **[http://localhost:3000](http://localhost:3000)** · 💡 Toggle DevTools → `iPhone 15 Pro (393×852)` for native PWA layout & haptics

### 5. Build Native Apps (Capacitor)

```bash
npm run build
npx cap sync ios
npx cap open ios   # Opens Xcode
```

---

## 📂 Project Structure

```
infyn/
│
├── src/
│   ├── app/
│   │   ├── api/                         # 🛠️  20+ Serverless API Route Handlers
│   │   │   ├── auth/                    #     OTP & Google OAuth
│   │   │   ├── calls/                   #     WebRTC signaling & call history
│   │   │   ├── meetups/                 #     Meetups CRUD & RSVP
│   │   │   ├── messages/                #     Real-time chat & typing
│   │   │   ├── premium/                 #     Razorpay order & verification
│   │   │   ├── push/                    #     Web Push subscription
│   │   │   ├── random-chat/             #     Anonymous speed dating
│   │   │   └── swipes/                  #     Swipe & match engine
│   │   │
│   │   ├── chat/[id]/                   # 💬  Real-time chat page
│   │   │   └── components/              #     MiniGames · VoiceRecorder · Reactions
│   │   ├── components/                  # ♻️   Reusable UI (CallModal · AIWingman · Nav)
│   │   ├── discover/                    # 🗺️  Discovery feed & map view
│   │   ├── home/                        # 🎴  Main swipe deck
│   │   ├── meetups/                     # 📍  Community meetup pages
│   │   ├── onboarding/                  # 🚪  8-step user onboarding flow
│   │   ├── premium/                     # 💎  VIP Pass purchase screen
│   │   ├── random-chat/                 # 🎭  Radar speed-dating screen
│   │   └── settings/                   # ⚙️   User preferences & account
│   │
│   ├── db/
│   │   ├── index.ts                     # 🔌  Drizzle ORM client instance
│   │   └── schema.ts                    # 🗄️  PostgreSQL tables & enums
│   │
│   └── lib/
│       ├── auth.ts                      # 🔐  JWT session & cookie helpers
│       ├── pusher-client.ts             # ⚡  Client-side Pusher WebSocket
│       ├── pusher-server.ts             # 📢  Server-side Pusher broadcast
│       ├── web-push.ts                  # 🔔  VAPID Push Notification trigger
│       └── rate-limit.ts               # 🛡️   Redis rate limiter
│
├── public/
│   ├── sw.js                            # 🔧  Service Worker for Web Push
│   └── icons/                          # 🎨  PWA icons & assets
│
├── capacitor.config.ts                  # 📱  Capacitor iOS & Android config
└── package.json
```

---

<div align="center">

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=FF4D8D,9B59B6,7B68EE&height=120&section=footer&fontColor=ffffff&fontSize=16&text=Crafted+with+%F0%9F%92%96+by+Anshul+%C2%B7+Built+for+Gen-Z%2C+with+Gen-Z+Energy&fontAlignY=65&animation=twinkling" width="100%"/>

**[⭐ Star](https://github.com/anshulr0019/DateBuddy) · [🍴 Fork](https://github.com/anshulr0019/DateBuddy/fork) · [🐛 Issues](https://github.com/anshulr0019/DateBuddy/issues) · [📬 PRs Welcome](https://github.com/anshulr0019/DateBuddy/pulls)**

<br/>

*Next.js 15 · React 19 · TypeScript · Tailwind CSS · PostgreSQL · Drizzle ORM · Pusher · WebRTC · Razorpay · Capacitor*

</div>
