<div align="center">

# 💕 DateBuddy
### *The Gen-Z Social Discovery & Connection Platform*
**Dating without the cringe. Meeting without the awkwardness.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC_P2P-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)

<br/>

[✨ Features](#-the-feature-breakdown) • [🔥 The Technical Flex](#-the-technical-flex) • [🚀 Quick Start](#-quick-start) • [🗄️ Architecture](#️-database-architecture) • [📡 API Reference](#-api-endpoints)

---

</div>

<br/>

## 🌟 What is DateBuddy?

DateBuddy is a next-generation social discovery platform built from the ground up for modern dating culture. It fuses **spontaneous IRL meetups**, **AI-calculated vibe archetypes**, **initial-based anonymous speed chats**, and **100% free peer-to-peer WebRTC video/audio calling** into an ultra-fluid mobile web experience.

---

## 🔥 The Technical Flex

### 🎨 1. Fluid UI, Motion & Gestures *(The UX Flex)*
* **Velocity-Based Gesture Engine**: Profile cards with spring physics that calculate touch trajectory and velocity for organic Apple-like card flings without accidental touch slips.
* **Spring-Physics Transitions**: Custom cubic-bezier spring curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`) replacing rigid linear CSS transitions with natural kinetic bounces.
* **Native Haptic Feedback Integration**: Multi-tier vibration patterns (`light`, `medium`, `success`, `warning`) tuned to trigger the mobile Taptic Engine on card actions, matches, and sheet drags.
* **Dynamic Context-Aware Glassmorphism**: High-performance frosted glass overlays (`backdrop-blur-2xl`) that dynamically adapt to moving background Aurora gradients.
* **Safe-Area Inset Awareness**: Pixel-perfect layout calculations (`env(safe-area-inset-top)` & `visualViewport`) adapting seamlessly around the iPhone Dynamic Island, soft keyboards, and Android navigation bars.

---

### ⚡ 2. Architecture & Performance *(The Engineering Flex)*
* **Optimistic UI State Mutation**: Card swipes and messaging mutations reflect instantly in local state before the server handshake completes, delivering **0ms perceived latency**.
* **Fault-Tolerant Local Cache**: Persistent offline session caching so users can navigate across tabs or survive flaky mobile connections without losing drafted messages or feed position.
* **Zero Cumulative Layout Shift (CLS)**: Pre-allocated aspect ratios and animated shimmer skeletons prevent screen jumps during asset downloads.
* **Background Data Prefetching**: Smart sliding-window cache preloads the next 5 profile images and media assets in memory while the user browses the current card.

---

### 💬 3. Advanced Chat, Video & Social *(The Product Flex)*
* **100% Free WebRTC Audio & HD Video Calling**:
  * Peer-to-Peer 60fps streaming with public Google STUN servers (`$0/month` overhead).
  * **FaceTime & iOS WhatsApp UI**: Floating PiP (Picture-in-Picture) selfie preview, pulsating ripple rings, live call timer, and active camera flip controls.
* **Real-Time Presence & Receipt System**: Live presence dots (`🟢 online`), active typing indicators, and delivery status (`sent` ➔ `seen`).
* **Dynamic Audio Waveform Visualizer**: Generates real-time visual frequency bars for recorded voice notes instead of a static play button.
* **Episodic 8-Step Onboarding Wizard**: Frictionless step-by-step setup with auto-saving progress resume if the browser tab is closed.

---

### 🔒 4. Modern Auth, AI & Security *(The Backend Flex)*
* **Passwordless OTP Authentication**: Frictionless SMS/Phone-based verification with brute-force rate-limiting.
* **Stateless HTTP-Only JWT Sessions**: Secure token cookies protected against XSS and CSRF attacks.
* **AI Real-Time Dynamic Vibe Scoring**: Algorithmically analyzes user activity times and in-app behavior to assign dynamic personas (*Night Owl 🦉, Early Spark 🌅, Flirt Mode 😏, Smooth Talker 💬*).
* **AI Live Face-Matching Identity Verification**: Native webcam stream snapshot comparison against primary profile photo with verified badge reward.
* **100% Free Geo-Search Engine**: OpenStreetMap Nominatim integration for 1-tap discovery of real gyms, cafes, sports turfs, and rooftop venues without paid Google Maps billing.
* **Initial-Based Anonymous Chat**: Real-time anonymous radar matching displaying the other person's first alphabet (`User A`) and rotating funny facts/dating trivia while searching.

---

## ✨ The Feature Breakdown

<table>
<tr>
<td width="50%">

### 🎯 Hyper-Personalized Discovery
* Multi-filter feed (Distance, Age, Intent, Verified only)
* Prompt card likes & profile photo carousels
* Undo last pass feature for second chances
* 0-accidental touch design with dedicated action buttons

</td>
<td width="50%">

### 📹 P2P Video & Voice Calling
* 100% Free WebRTC connection
* Native iOS FaceTime & WhatsApp styling
* Live camera flip, mic mute, and camera toggle
* Floating picture-in-picture selfie preview

</td>
</tr>
<tr>
<td width="50%">

### 🎭 Anonymous Speed Chat
* Real-time radar scan with rotating hilarious trivia
* Privacy-first initial display (`User A`, `User P`)
* 1-tap reveal & mutual connection upgrade
* Instant in-app notifications when someone likes you

</td>
<td width="50%">

### 📅 Real-World Meetups & Events
* Host events for Gyms, Cafes, Sports, Bars, and Cinema
* Free venue search powered by OpenStreetMap
* Attendee RSVP list with host approval controls
* Public and private community hangouts

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ AI Face Verification
* Live browser webcam capture
* AI facial matching against profile photos
* Instant verified checkmark badge (`✓`)
* Comprehensive block & report moderation

</td>
<td width="50%">

### 💎 DateBuddy Gold Tier
* Unlimited daily likes and rewinds
* Daily Super Likes with spotlight badges
* See who liked your profile before matching
* Razorpay payment gateway integration

</td>
</tr>
</table>

---

## 🗄️ Database Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    DateBuddy Schema                         │
└─────────────────────────────────────────────────────────────┘

👤 USERS & PROFILES
├── users ─────────────────── Core accounts, verification, bio, city
├── photos ────────────────── Multiple high-res profile photos (1:N)
├── user_interests ────────── Interest tag bindings (N:M)
├── verifications ─────────── AI Face verification logs
└── subscriptions ─────────── DateBuddy Gold tier & payment records

💬 SOCIAL & DISCOVERY
├── swipes ────────────────── Likes, Passes, Super Likes
├── matches ───────────────── Mutual match pairings
├── messages ──────────────── Text, photos, voice notes & locations
├── notifications ─────────── Real-time likes, matches & call alerts
└── call_signals ──────────── WebRTC peer offer/answer exchange

🎭 ANONYMOUS RADAR
├── random_chat_queue ────── Active searching users by vibe
├── random_chat_sessions ─── Matched anonymous pairs with initials
└── random_chat_messages ─── Ephemeral chat messages

📅 IRL MEETUPS & EVENTS
├── meetups ───────────────── Community events & venue data
├── meetup_attendees ──────── RSVP lists (Going / Maybe / Cancelled)
└── groups ────────────────── Interest communities & member hubs
```

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/anshulr0019/DateBuddy.git
cd DateBuddy
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Configure Environment Variables
Create a `.env.local` file in the project root:

```env
# Database Connection (Neon / Supabase / PostgreSQL)
DATABASE_URL="postgresql://user:password@host/datebuddy?sslmode=require"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# JWT Secret
JWT_SECRET="your_super_secret_jwt_key_here"

# (Optional) Razorpay for Gold Subscriptions
RAZORPAY_KEY_ID="rzp_test_xxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
```

### 4️⃣ Push Database Schema
```bash
npm run db:push
```

### 5️⃣ Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your browser (or open in responsive mobile mode `390px × 844px` for the full mobile app experience).

---

## 📡 API Endpoints

<details>
<summary><b>Click to expand full REST API endpoints</b></summary>
<br/>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Send phone OTP |
| `POST` | `/api/auth/verify-otp` | Verify OTP & issue session token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/feed` | Smart discovery feed with cursor pagination |
| `POST` | `/api/swipes` | Record like/pass/super_like & trigger alerts |
| `DELETE` | `/api/swipes` | Rewind/undo last pass |
| `GET` | `/api/matches` | Get user's mutual matches |
| `POST` | `/api/calls/signal` | Send WebRTC offer/answer/ICE candidates |
| `GET` | `/api/calls/signal` | Poll pending WebRTC handshake signals |
| `POST` | `/api/random-chat/queue` | Enter anonymous radar queue |
| `GET` | `/api/random-chat/session` | Poll anonymous chat session state |
| `POST` | `/api/places/search` | 100% Free OpenStreetMap venue search |
| `POST` | `/api/meetups` | Create new meetup event |
| `POST` | `/api/users/verification` | Run AI face matching & assign badge |

</details>

---

## 🛠️ Built With

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
* **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, zero `any`)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS custom keyframes
* **Real-time WebRTC**: Peer-to-Peer with Google STUN (`stun.l.google.com:19302`)
* **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Drizzle ORM](https://orm.drizzle.team/)
* **Haptics**: Native Web Vibration API with iOS Taptic presets

---

<div align="center">

Made with 💖 for genuine connections.

**[⭐ Star DateBuddy on GitHub](https://github.com/anshulr0019/DateBuddy)**

</div>
