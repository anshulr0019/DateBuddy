<div align="center">

<!-- Header Banner -->
<img src="./assets/banner.svg" alt="DateBuddy Header Banner" width="100%" />

<br/>

<!-- Animated Typing Subtitle -->
<a href="https://github.com/anshulr0019/DateBuddy">
  <img src="https://readme-typing-svg.demolab.com?font=Outfit&weight=700&size=22&duration=2600&pause=1000&color=FF4D8D&center=true&vCenter=true&width=750&lines=Sub-50ms+Real-Time+Chat+Powered+by+Pusher%3BFree+P2P+WebRTC+Video+and+Audio+Calling%3BInteractive+In-Chat+Mini-Games%3BAnonymous+Speed-Dating+Radar+and+Aliases%3BContext-Aware+AI+Dating+Wingman%3BReal-World+Meetup+Hosting+and+Venues%3BHaptic-Driven+PWA+and+Capacitor+iOS%2FAndroid" alt="Typing SVG" />
</a>

<br/><br/>

<!-- Tech Stack Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" />
  <img src="https://img.shields.io/badge/Pusher_Realtime-300D4F?style=for-the-badge&logo=pusher&logoColor=white" />
  <img src="https://img.shields.io/badge/WebRTC_P2P-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-0C2340?style=for-the-badge&logo=razorpay&logoColor=2B83EA" />
  <img src="https://img.shields.io/badge/Capacitor_iOS-1199FF?style=for-the-badge&logo=capacitor&logoColor=white" />
</p>

<!-- Project Status Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-success?style=flat-square&color=FF4D8D" />
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-7B68EE?style=flat-square" />
  <img src="https://img.shields.io/badge/Real--Time-Pusher%20%26%20WebRTC-00D2D3?style=flat-square" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/Built%20with-%F0%9F%92%96%20for%20Gen--Z-rose?style=flat-square" />
</p>

</div>

---

## 🌟 Executive Overview

**DateBuddy** is a full-stack, mobile-first social discovery and dating platform engineered for Gen-Z. It bridges the gap between digital interaction and real-world connection by combining **fluid swipe discovery**, **sub-50ms instant messaging**, **zero-cost P2P WebRTC video calling**, **anonymous radar speed-dating**, **in-chat 2-player mini games**, and **real-world meetup hosting**.

Built with a modern tech stack featuring **Next.js 15 App Router**, **PostgreSQL (Neon)** via **Drizzle ORM**, **Pusher Channels**, and **Capacitor Mobile**.

---

## ⚡ Key Highlights & Architecture

```mermaid
flowchart TB
    subgraph Client ["Client Layer (Web & Capacitor Native)"]
        UI[Next.js 15 UI + Tailwind + DVH Safe-Area]
        SW[Service Worker Web Push API]
        RTC_Client[WebRTC Audio / Video Stream]
        Pusher_Client[Pusher WebSocket Client]
    end

    subgraph Server ["Server & Real-Time Engine"]
        API[Next.js Route Handlers / Server Actions]
        Pusher_Server[Pusher Channels Real-Time Broadcast]
        Push_Server[Web-Push VAPID Trigger]
        Razorpay[Razorpay Payment Verification]
    end

    subgraph Data ["Data & Storage Layer"]
        DB[(Neon PostgreSQL Serverless + Drizzle)]
        Redis[(Upstash Redis Cache & Rate Limiting)]
        Media[Cloudinary / CDN Media Storage]
    end

    UI --> API
    UI --> RTC_Client
    Pusher_Client <--> Pusher_Server
    API --> Pusher_Server
    API --> Push_Server --> SW
    API --> Razorpay
    API --> DB
    API --> Redis
    API --> Media
```

---

## 📱 Feature Showcase

### 1. 💬 Ultra-Fast Messaging & Chat Engine
*   **Sub-50ms Latency:** Instant bidirectional message sync powered by Pusher Channels.
*   **WhatsApp-Style Emoji Reactions:** Long-press / hover reaction bar with `👍 ❤️ 😂 😮 😢 🔥`.
*   **Quoted Replies:** Swipe-to-reply or one-click quoting for seamless multi-threaded banter.
*   **Hold-to-Record Voice Notes:** In-browser audio recording with live waveform frequency visualizer and playback scrubber.
*   **Dynamic Presence & Typing:** Live `"typing..."` indicators and real-time `"Online / Active X min ago"` status.
*   **AI Wingman:** Contextual dating assistant offering witty icebreakers and conversation sparkers.

---

### 2. 🎮 Interactive In-Chat Mini-Games
Play turn-based games directly within any active conversation:
*   **🔢 Guess The Number:** Host picks a secret number (1–100); partner guesses with real-time "Too High" / "Too Low" hints and a celebratory winner screen.
*   **🃏 Truth or Dare:** Turn-based deck featuring deep, funny, and spicy conversation cards designed to break the ice.

---

### 3. 📹 Zero-Cost WebRTC Video & Audio Calling
*   **P2P Streaming:** HD video & crisp audio streaming directly between peers using browser WebRTC + Google STUN. No expensive third-party video SDK fees.
*   **Global Call Listener:** Incoming call modal rings across any screen in the app with custom ringtones, vibration, and Accept/Decline actions.
*   **Luxury Monochromatic UI:** Full-screen video stream, floating draggable Picture-in-Picture (PiP) camera dock, mute, and camera flip.
*   **In-Chat Call History Logs:** Auto-inserts call summary cards directly into the message thread (`📞 Video Call · 4m 12s` or `📵 Missed Call`).

---

### 4. 🎭 Anonymous Radar Speed Dating
*   **Vibe Matching:** Filter matches by vibe: *Chill, Deep Talk, Flirty, Late Night, Random*.
*   **Radar Pulse UI:** Real-time pulse scanning animation with rotating trivia tidbits.
*   **Pseudonym Aliases:** Fun server-generated identities (e.g., *"Cosmic Panda"*, *"Velvet Fox"*) to ensure privacy.
*   **Mutual Reveal Mechanic:** Both users can request to reveal identity. When both accept, the session automatically converts into a permanent Match!

---

### 5. 🎴 Smart Swipe Discovery & Profile Cards
*   **Velocity-Based Gestures:** Fluid card spring physics (Left = Pass, Right = Like, Up = Super Like).
*   **Spotify-Style Anthem Badges:** Embedded music anthems showcasing users' favorite tracks.
*   **Hinge-Style Interactive Prompts:** Answer cards (e.g., *"My ideal Sunday..."*, *"Two truths and a lie"*).
*   **Instant Match Screen:** Celebratory match modal with confetti, common interests chips, and direct messaging CTA.

---

### 6. 📍 Real-World Meetups & Venue Discovery
*   **Category Exploration:** Sports, Arts, Tech, Food, Nightlife, Coffee meetups.
*   **Interactive Venue Picker:** OpenStreetMap location search with geocoding.
*   **RSVP & Attendee Control:** Guest limits, host approval flow, and pinned announcements.

---

### 7. 💎 VIP Pass & Razorpay Monetization
*   **Subscription Tiers:** Daily, Weekly, and Monthly VIP Passes.
*   **VIP Perks:** Unlimited likes, **"See Who Liked You"** reveal tab, Swipe Rewind, profile spotlight boost, and exclusive gold profile badges.
*   **Secure Checkout:** Razorpay order creation and HMAC SHA256 cryptographic signature validation.

---

### 8. 🛡️ Trust, Safety & Selfie Verification
*   **Live Gesture Verification:** Front-camera selfie pose capture to unlock the blue verified checkmark.
*   **Safety Suite:** Categorized user reporting, instant one-tap blocking, and automatic feed exclusion.

---

## 🗄️ Database Schema (`src/db/schema.ts`)

<details>
<summary><b>✨ Click to Expand Database Schema Definitions</b></summary>

<br/>

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| **`users`** | Core user accounts | `id`, `phone_number`, `email`, `name`, `date_of_birth`, `gender`, `looking_for`, `city`, `latitude`, `longitude`, `bio`, `is_verified`, `last_active_at` |
| **`photos`** | User gallery | `id`, `user_id`, `url`, `order_index` |
| **`interests` / `user_interests`** | Tag taxonomy | `id`, `name`, `icon`, `category`, `user_id`, `interest_id` |
| **`prompts` / `user_prompt_answers`** | Interactive Q&A | `id`, `text`, `user_id`, `prompt_id`, `answer` |
| **`preferences`** | Discovery filters | `user_id`, `age_min`, `age_max`, `distance_max`, `only_verified` |
| **`swipes`** | Swipe tracking | `swiper_id`, `swiped_id`, `action` (*Unique constraint*) |
| **`matches`** | Active connections | `id`, `user1_id`, `user2_id`, `matched_at`, `is_active` |
| **`messages`** | Chat history | `id`, `match_id`, `sender_id`, `receiver_id`, `type`, `content`, `metadata`, `is_read` |
| **`random_chat_queue`** | Speed dating queue | `user_id`, `vibe`, `age_min`, `age_max`, `expires_at` |
| **`random_chat_sessions`** | Anonymous sessions | `id`, `user_a_id`, `user_b_id`, `alias_a`, `alias_b`, `status`, `match_id` |
| **`meetups` / `meetup_attendees`**| IRL events & RSVPs | `id`, `host_id`, `title`, `venue_name`, `date`, `max_attendees`, `status` |
| **`subscriptions`** | VIP memberships | `user_id`, `tier`, `start_date`, `end_date`, `transaction_id` |
| **`notifications`** | Push & in-app alerts | `id`, `user_id`, `type`, `title`, `body`, `is_read` |

</details>

---

## 🔌 API Endpoints Reference

<details>
<summary><b>🔌 Click to Expand API Route Handlers</b></summary>

<br/>

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/send-otp` | `POST` | Send SMS verification code |
| `/api/auth/verify-otp` | `POST` | Verify OTP code & issue HTTP-only JWT session |
| `/api/auth/google/login` | `GET` | Initiate Google OAuth 2.0 flow |
| `/api/auth/google/callback` | `GET` | Handle Google OAuth code exchange |
| `/api/auth/me` | `GET` | Get current authenticated user session |
| `/api/feed` | `GET` | Fetch proximity & filter-matched profile cards |
| `/api/swipes` | `POST` | Record swipe action (`like`/`pass`/`super_like`) |
| `/api/conversations` | `GET` | List active message threads & unread counts |
| `/api/messages` | `GET / POST` | Fetch messages & send new text/voice/media |
| `/api/messages/typing` | `POST` | Trigger real-time Pusher typing indicators |
| `/api/calls/signal` | `POST` | WebRTC signaling (`offer`, `answer`, `candidate`, `hangup`) |
| `/api/calls/log` | `POST` | Log call duration / status into chat thread |
| `/api/push/subscribe` | `POST` | Register Web Push VAPID subscription |
| `/api/random-chat/join` | `POST` | Enter speed-dating queue with vibe filter |
| `/api/random-chat/session` | `GET` | Poll / retrieve current speed-dating session |
| `/api/meetups` | `GET / POST` | List & create community meetups |
| `/api/premium/create-order` | `POST` | Create Razorpay payment order |
| `/api/premium/verify` | `POST` | Cryptographically verify Razorpay payment |

</details>

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.18+` or `v20+`
- **PostgreSQL Database**: [Neon Serverless Postgres](https://neon.tech)
- **Pusher Channels Account**: [Pusher](https://pusher.com)
- **Upstash Redis** (Optional for production rate limiting): [Upstash](https://upstash.com)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/anshulr0019/DateBuddy.git
cd DateBuddy
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-sample.us-east-2.aws.neon.tech/datebuddy?sslmode=require"

# Authentication & Session
JWT_SECRET="your-super-secure-jwt-secret-key-32-chars-min"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Pusher Channels (Real-Time Chat & Calling)
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
PUSHER_CLUSTER="ap2"
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"

# Razorpay (VIP Monetization)
RAZORPAY_KEY_ID="rzp_test_xxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxx"

# Web Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_vapid_public_key"
VAPID_PRIVATE_KEY="your_vapid_private_key"
VAPID_EMAIL="mailto:hello@datebuddy.app"

# Fast2SMS / Twilio OTP (Optional for Dev mode fallback)
OTP_DEV_LOG=true
```

### 3. Initialize Database Schema
```bash
# Push Drizzle schema directly to your Postgres database
npm run db:push

# Optional: Seed sample test users and meetups
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> 💡 **Tip:** In Chrome DevTools, toggle Device Mode to **iPhone 15 Pro (393 × 852)** to test the native mobile PWA layout and haptics!

---

## 📱 Building Native Mobile Apps (Capacitor)

```bash
# Sync web build to native iOS project
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

---

## 📂 Project Structure

```text
DateBuddy/
├── src/
│   ├── app/
│   │   ├── api/                    # 20+ Serverless API Route Handlers
│   │   │   ├── auth/               # OTP & Google OAuth endpoints
│   │   │   ├── calls/              # WebRTC signaling & call history
│   │   │   ├── meetups/            # Meetups CRUD & RSVP
│   │   │   ├── messages/           # Real-time chat & typing
│   │   │   ├── premium/            # Razorpay order & verification
│   │   │   ├── push/               # Web Push subscription
│   │   │   ├── random-chat/        # Anonymous speed dating
│   │   │   └── swipes/             # Swipe & match engine
│   │   ├── chat/[id]/              # Real-time chat page & mini-games
│   │   │   └── components/         # MiniGames, VoiceRecorder, Reactions
│   │   ├── components/             # Reusable UI (CallModal, AIWingman, Nav)
│   │   ├── discover/               # Discovery feed & map view
│   │   ├── home/                   # Main swipe deck
│   │   ├── meetups/                # Community meetup pages
│   │   ├── onboarding/             # 8-step user onboarding flow
│   │   ├── premium/                # VIP Pass purchase screen
│   │   ├── random-chat/            # Radar speed-dating screen
│   │   └── settings/               # User preferences & account
│   ├── db/
│   │   ├── index.ts                # Drizzle ORM client instance
│   │   └── schema.ts               # PostgreSQL database tables & enums
│   └── lib/
│       ├── auth.ts                 # JWT session & cookie helpers
│       ├── pusher-client.ts        # Client-side Pusher WebSocket
│       ├── pusher-server.ts        # Server-side Pusher broadcast
│       ├── web-push.ts             # VAPID Push Notification trigger
│       └── rate-limit.ts           # Redis rate limiter
├── public/
│   ├── sw.js                       # Service Worker for Web Push
│   └── icons/                      # PWA icons & assets
├── capacitor.config.ts             # Capacitor iOS & Android config
└── package.json
```

---

<div align="center">

<!-- Footer Wave -->
<img src="./assets/footer.svg" alt="DateBuddy Footer Wave" width="100%" />

**Crafted with 💖 by [Anshul](https://github.com/anshulr0019)**

</div>
