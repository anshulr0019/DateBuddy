<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=💕%20DateBuddy&fontSize=80&fontColor=fff&animation=twinkling&fontAlignY=35&desc=Where%20Connections%20Become%20Real&descAlignY=60&descSize=22" />

<br/>

<!-- Animated Typing Subtitle -->
<a href="https://github.com/anshulr0019/DateBuddy">
  <img src="https://readme-typing-svg.demolab.com?font=Outfit&weight=700&size=22&duration=2800&pause=1000&color=FF6B9D&center=true&vCenter=true&width=700&lines=Premium+Gen-Z+Dating+Platform+🔥;100%25+Free+P2P+Video+%26+Audio+Calling+📹;AI+Dynamic+Persona+Scoring+🤖;Anonymous+Speed+Dating+Radar+🎲;Real-World+Meetup+Hosting+📍;Face-Match+Identity+Verification+🛡️" alt="Typing SVG" />
</a>

<br/><br/>

<!-- Premium Tech Stack Badges -->
<img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" />
<img src="https://img.shields.io/badge/Capacitor_8_iOS-1199FF?style=for-the-badge&logo=capacitor&logoColor=white" />
<img src="https://img.shields.io/badge/WebRTC_P2P-333333?style=for-the-badge&logo=webrtc&logoColor=white" />

<br/><br/>

<!-- GitHub Stats Badges -->
<img src="https://img.shields.io/github/stars/anshulr0019/DateBuddy?style=flat-square&color=FF6B9D" />
<img src="https://img.shields.io/github/forks/anshulr0019/DateBuddy?style=flat-square&color=7B68EE" />
<img src="https://img.shields.io/github/last-commit/anshulr0019/DateBuddy?style=flat-square&color=4ECDC4" />
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" />
<img src="https://img.shields.io/badge/Built%20with-💖-rose?style=flat-square" />

<br/><br/>

<!-- HERO MOCKUP (Replace the src below with your actual GIF or Image) -->
<picture>
  <!-- <source media="(prefers-color-scheme: dark)" srcset="link-to-your-dark-gif.gif"> -->
  <img alt="DateBuddy App UI" src="https://placehold.co/800x400/1A1A2E/FF6B9D?text=Replace+With+High-Fidelity+App+GIF&font=montserrat" width="800">
</picture>

</div>

---

## 🌟 The Vision

**DateBuddy** is a full-stack, mobile-first social discovery app engineered specifically for Gen-Z. It goes far beyond swiping. It is a complete ecosystem allowing users to **host real-world meetups**, **video call for free**, **speed-date anonymously**, and let a dynamic **AI engine calculate their vibe**.

Built with a relentless focus on fluid UI, zero paid-API dependencies (100% free WebRTC & OSM), and native iOS performance via Capacitor.

---

## ✨ Top-Tier Engineering & UX

*   **Velocity-Based Gesture Engine:** Swipe cards that calculate finger drag velocity for organic, physical fling momentum. Horizontal swipe-to-like was intentionally removed to prevent accidental touches—actions require intentional taps.
*   **$0/Month Infrastructure for Calls & Maps:** Engineered to use pure browser-native WebRTC peer-to-peer (via Google STUN) and OpenStreetMap Nominatim. No Agora. No Twilio. No Google Maps API fees.
*   **Dynamic Glassmorphism:** Context-aware frosted glass (`backdrop-blur`) components that adapt to underlying moving aurora gradients.
*   **Safe-Area Inset Architecture:** Zero-clipping edge-to-edge UI that perfectly wraps around the iPhone Dynamic Island and bottom home indicator.
*   **Optimistic UI Mutations:** Instantly mutating the UI on likes and messages *before* the server responds, ensuring a 0ms perceived latency.

---

## 📱 Core Features Showcase

### 📹 1. WebRTC Calling (FaceTime UI)
Completely free, high-definition audio and video calling built from scratch.
*   **Audio Call UI:** Blurred partner photo background, centered avatar with pulsing ripple rings, live call timer.
*   **Video Call UI:** Full-screen edge-to-edge remote video stream. Your selfie camera floats in a draggable Picture-in-Picture (PiP) window. Hovering glassmorphic control dock.

### 🎭 2. Anonymous Radar Speed Dating
Match with strangers based on a selected vibe (Chill, Deep, Flirty).
*   **Rotating Trivia:** While the radar scans, funny trivia auto-rotates every 3.5s (e.g., *"Otters hold hands while sleeping so they don't float away"*).
*   **True Anonymity:** Users are identified only by their first initial (e.g., `User A`). Full identity is only revealed if both users press "Connect".

### 🤖 3. AI Dynamic Vibe Persona
The app watches *how* and *when* you use it, then auto-assigns your active persona. It is earned, not selected.

| Usage Trigger | Auto-Assigned Vibe |
|:---|:---|
| Active between 10 PM – 4 AM | 🦉 **Night Owl** |
| Active between 5 AM – 9 AM | 🌅 **Early Spark** |
| Long avg. message length | 🧠 **Deep Conversationalist** |
| High emoji use, fast replies | 😏 **Flirt Mode** |
| Spike in matches/views | 🔥 **High Demand** |

### 📅 4. IRL Meetup Hosting & Venue Discovery
Users can host physical meetups for their Gym, Turf, or local Cafe.
*   **Venue Picker:** 1-tap live search for real gyms and cafes powered by OpenStreetMap.
*   **RSVP System:** Host approval, capacity limits, and attendee tracking.

### 🛡️ 5. Live Face-Match Verification
Uses webcam selfie capture. AI compares the live selfie against uploaded profile photos. If passed, the premium `✓` verified badge is permanently unlocked.

---

## 🗄️ Architecture & Schemas

<details>
<summary><b>✨ Click to view the Database Schema (PostgreSQL + Drizzle ORM)</b></summary>

<br/>

**Users & Auth**
*   `users` — id, name, phone, dob, gender, bio, location, isVerified
*   `photos` — userId, url, orderIndex
*   `interests` & `user_interests` — master tag list & relations
*   `otp_codes` — phoneNumber, codeHash, attempts, expiresAt

**Social & Real-Time**
*   `swipes` — swiperId, swipedId, action (like/pass/super_like) *(Unique constraint prevents double-swiping)*
*   `matches` — user1Id, user2Id, matchedAt
*   `messages` — matchId, senderId, type (text/photo/voice), isRead
*   `notifications` — userId, type, title, body, isRead

**Anonymous Radar**
*   `random_chat_queue` — userId, vibe, ageMin, ageMax, expiresAt
*   `random_chat_sessions` — userAId, userBId, aliasA, aliasB, status
*   `random_chat_messages` — sessionId, senderId, content

**Meetups & Community**
*   `meetups` — hostId, title, venueName, lat, lng, date, maxAttendees
*   `meetup_attendees` — meetupId, userId, status

</details>

<details>
<summary><b>🔌 Click to view Core API Routes (Serverless Next.js Handlers)</b></summary>

<br/>

| Method | Route | Description |
|:---|:---|:---|
| `POST` | `/api/auth/send-otp` | Sends SMS via Firebase |
| `POST` | `/api/auth/verify-otp` | Verifies OTP & sets HTTP-Only JWT Cookie |
| `GET` | `/api/feed` | Paginated discover profile deck |
| `POST` | `/api/swipes` | Records action, triggers Match calculation |
| `POST` | `/api/calls/signal` | Sends WebRTC SDP Offers/Answers/ICE |
| `POST` | `/api/places/search` | OpenStreetMap Venue Search |
| `POST` | `/api/users/verification` | AI Face-Match processing |

</details>

---

## ⚡ Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/anshulr0019/DateBuddy.git
cd DateBuddy
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```env
DATABASE_URL="postgresql://[neon-db-url]"
JWT_SECRET="your-secure-jwt-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# Optional: Razorpay for Gold Subscriptions
RAZORPAY_KEY_ID="rzp_test_xxxx"
```

### 3. Push Schema & Run
```bash
npm run db:push
npm run dev
```
*Tip: Open `http://localhost:3000` in Chrome DevTools. Set device view to **iPhone 15 Pro (393×852)** for the intended native experience.*

---

## 🗺️ Roadmap

- [x] Velocity-based swipe UI (No accidental dragging)
- [x] 100% Free WebRTC Video & Audio Calling
- [x] AI Dynamic Vibe Persona Engine
- [x] Anonymous Radar Speed Dating
- [x] OpenStreetMap IRL Meetup Integration
- [ ] "Two Truths & A Lie" interactive chat widget
- [ ] AI Rizz Wingman — context-aware banter suggestions
- [ ] Spotify / Instagram profile integration
- [ ] Spontaneous "Who's Down?" live venue beacon

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" />

**Designed & Engineered with 💖 by [Anshul](https://github.com/anshulr0019)**

[![GitHub Stars](https://img.shields.io/github/stars/anshulr0019/DateBuddy?style=social)](https://github.com/anshulr0019/DateBuddy)

</div>
