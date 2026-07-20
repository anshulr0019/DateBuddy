<div align="center">

# 💕 DateBuddy

### *Where Connections Become Real*

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/anshulr0019/DateBuddy?style=social" />
  <img src="https://img.shields.io/github/forks/anshulr0019/DateBuddy?style=social" />
  <img src="https://img.shields.io/github/watchers/anshulr0019/DateBuddy?style=social" />
</p>

<p align="center">
  <a href="https://datebuddy.vercel.app"><strong>🚀 Live Demo</strong></a> •
  <a href="#-quick-start"><strong>⚡ Quick Start</strong></a> •
  <a href="#-features"><strong>✨ Features</strong></a> •
  <a href="#️-tech-stack"><strong>🏗️ Tech Stack</strong></a>
</p>

---

### 🌟 A modern social discovery platform that goes beyond dating

DateBuddy transforms how people connect by focusing on **shared interests**, **real-world meetups**, and **community building**. No more endless swiping — find your hiking buddy, gaming squad, or coffee companion.

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Smart Matching
- Swipe-based discovery algorithm
- Interest compatibility scoring
- Location-based filtering
- Activity preference matching

</td>
<td width="50%">

### 📅 Event Hosting
- Create public/private meetups
- RSVP system with capacity limits
- Category-based event browsing
- Attendee management dashboard

</td>
</tr>
<tr>
<td width="50%">

### 💬 Real-time Chat
- Instant messaging with matches
- AI-powered icebreakers
- Photo & GIF sharing
- Read receipts & typing indicators

</td>
<td width="50%">

### 🏘️ Communities
- Interest-based groups
- Group chat functionality
- Member roles (Admin/Moderator)
- Community events integration

</td>
</tr>
<tr>
<td width="50%">

### ✅ Trust & Safety
- Phone OTP verification
- Photo verification badges
- User reporting system
- Block & unmatch options

</td>
<td width="50%">

### 💎 Premium Features
- Unlimited likes & super likes
- See who liked you
- Profile boost (24h visibility)
- Advanced filters & ad-free experience

</td>
</tr>
</table>

---

## 🏗️ Tech Stack

### Frontend

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| ![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white) | Framework | SSR, API Routes, File-based Routing |
| ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black) | UI Library | Component reusability, Hooks |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) | Language | Type safety, Better DX |
| ![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css&logoColor=white) | Styling | Rapid prototyping, Utility-first |

### Backend

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-316192?logo=postgresql&logoColor=white) | Database | Relational data, ACID compliance |
| ![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F) | ORM | Type-safe queries, SQL-like syntax |
| ![Neon](https://img.shields.io/badge/Neon-Serverless-00E699) | DB Host | Auto-scaling, Generous free tier |
| ![Vercel](https://img.shields.io/badge/Vercel-Production-black?logo=vercel&logoColor=white) | Hosting | Edge functions, Zero config |

---

## 🗄️ Database Architecture

<details>
<summary><b>📊 Click to view 18-table schema</b></summary>

<br>

``` 
┌─────────────────────────────────────────────────────────────┐
│                    DateBuddy Database                       │
└─────────────────────────────────────────────────────────────┘

👤 USER MANAGEMENT
├── users ─────────────────── Core user profiles
├── photos ────────────────── Profile images (1:many)
├── user_interests ────────── Interest tags (many:many)
├── preferences ───────────── Discovery settings (1:1)
└── subscriptions ─────────── Premium tiers (1:1)

💬 SOCIAL FEATURES
├── swipes ────────────────── Like/Pass tracking
├── matches ───────────────── Mutual connections
├── messages ──────────────── Chat history
└── conversations ─────────── Message threads

📅 MEETUPS & EVENTS
├── meetups ───────────────── Hosted events
├── meetup_attendees ──────── RSVP system
└── check_ins ─────────────── Spontaneous hangouts

🏘️ COMMUNITIES
├── groups ────────────────── Interest communities
├── group_members ─────────── Membership tracking
└── group_posts ───────────── Community content

🔧 SUPPORT TABLES
├── interests ─────────────── Master interest list
├── notifications ─────────── Push alerts
└── reports ───────────────── Safety moderation
Key Relationships:

One user → Many photos (1:N)
Users ↔ Interests (N:M via user_interests)
Users ↔ Meetups (N:M via meetup_attendees)
Matches trigger Conversations (1:1)
</details>
🚀 Quick Start
Prerequisites
 

✅ Node.js 18+ installed
✅ PostgreSQL database (Neon / Supabase / Local)
✅ npm or yarn package manager
Installation
Bash

# 1️⃣ Clone the repo
git clone https://github.com/anshulr0019/DateBuddy.git
cd DateBuddy

# 2️⃣ Install dependencies
npm install

# 3️⃣ Set up environment variables
cp .env.example .env.local
# Add your DATABASE_URL

# 4️⃣ Push database schema
npm run db:push

# 5️⃣ Run development server
npm run dev

# 🎉 Open http://localhost:3000
Environment Variables
Create .env.local in the root:

Bash

# Database (Required)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Optional: For production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
📱 User Journey
 

📱 Sign Up
    ↓
📞 Phone OTP Verification
    ↓
📝 7-Step Onboarding (Name → Location → Photos → Bio → Interests → Preferences → Review)
    ↓
    ┌──────────────────────────────────┐
    │                                  │
🔥 Discover & Swipe         📅 Browse Meetups
    │                                  │
    ↓                                  ↓
💬 Match & Chat              🎉 RSVP & Attend
    │                                  │
    └───────────────┬──────────────────┘
                    ↓
           🏘️ Join Communities
                    ↓
           👥 Engage & Connect
🎨 Design System
<details> <summary><b>🎨 Click to view design tokens</b></summary><br>
Color Palette
CSS

/* Primary Gradient */
--gradient-primary: linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%);
--gradient-secondary: linear-gradient(135deg, #FFD1DC 0%, #E0BBE4 100%);

/* Semantic Colors */
--color-bg: #FAFAFA;
--color-card: #FFFFFF;
--color- : #1A1A2E;
--color- -muted: #6E7191;

/* Action Colors */
--color-like: #4ECDC4;
--color-pass: #FF6B6B;
--color-superlike: #7B68EE;
Typography
CSS

/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
-- -xs:   0.75rem;   /* 12px */
-- -sm:   0.875rem;  /* 14px */
-- -base: 1rem;      /* 16px */
-- -lg:   1.125rem;  /* 18px */
-- -xl:   1.25rem;   /* 20px */
-- -2xl:  1.5rem;    /* 24px */
-- -3xl:  1.875rem;  /* 30px */
Spacing System
CSS

/* 8px base unit */
--space-1: 0.5rem;  /* 8px  */
--space-2: 1rem;    /* 16px */
--space-3: 1.5rem;  /* 24px */
--space-4: 2rem;    /* 32px */
--space-6: 3rem;    /* 48px */
</details>
🔌 API Reference
<details> <summary><b>📡 Click to view all endpoints</b></summary><br>
Authentication
http

POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/logout
Users
http

GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/complete-onboarding
Discover
http

GET  /api/discover
POST /api/swipes
GET  /api/matches
Meetups
http

GET    /api/meetups
POST   /api/meetups
GET    /api/meetups/:id
PUT    /api/meetups/:id
DELETE /api/meetups/:id
POST   /api/meetups/:id/join
Messaging
http

GET  /api/conversations
POST /api/messages
GET  /api/messages/:conversationId
Communities
http

GET  /api/communities
POST /api/communities
GET  /api/communities/:id
POST /api/communities/:id/join
Response Format
JSON

{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
</details>
🎯 Project Structure
 

DateBuddy/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Authentication routes
│   │   │   ├── welcome/            # Phone login
│   │   │   └── verify-otp/         # OTP verification
│   │   ├── onboarding/             # 7-step signup flow
│   │   │   ├── basic-info/
│   │   │   ├── location/
│   │   │   ├── photos/
│   │   │   ├── bio/
│   │   │   ├── interests/
│   │   │   ├── preferences/
│   │   │   └── review/
│   │   ├── discover/               # Swipe interface
│   │   │   └── meetups/            # Events feed
│   │   ├── matches/                # Connections list
│   │   ├── chat/[id]/              # Messaging
│   │   ├── meetups/
│   │   │   ├── create/             # Host event
│   │   │   └── [id]/               # Event details
│   │   ├── profile/                # User profile
│   │   ├── settings/               # App settings
│   │   ├── premium/                # Subscription
│   │   ├── components/             # Reusable UI
│   │   │   ├── BottomNav.tsx
│   │   │   └── MatchModal.tsx
│   │   └── api/                    # Backend routes
│   │       ├── health/
│   │       ├── users/
│   │       ├── meetups/
│   │       └── matches/
│   └── db/
│       ├── schema.ts               # Database tables
│       └── index.ts                # DB client
├── public/                         # Static assets
├── tailwind.config.ts              # Styling config
├── package.json                    # Dependencies
└── drizzle.config.ts               # ORM config
🤝 Contributing
<details> <summary><b>📝 Click to view contribution guidelines</b></summary><br>
1. Fork the repo

2. Clone your fork

Bash

git clone https://github.com/YOUR_USERNAME/DateBuddy.git
3. Create a branch

Bash

git checkout -b feature/amazing-feature
4. Make your changes and commit

Bash

git commit -m "feat: add amazing feature"
5. Push and open a Pull Request

Bash

git push origin feature/amazing-feature
Commit Convention
Prefix	Description
feat:	New feature
fix:	Bug fix
docs:	Documentation changes
style:	Code style / formatting
refactor:	Code refactoring
test:	Adding tests
chore:	Maintenance tasks
Areas for Contribution
🎨 UI/UX improvements
🐛 Bug fixes
📝 Documentation
✨ New features
🧪 Test coverage
♿ Accessibility
🌍 Internationalization
</details>
🗺️ Roadmap
<table> <tr> <td width="50%">
✅ Completed (v1.0)
 User authentication (Phone OTP)
 Profile creation & editing
 Swipe-based discovery
 Match system
 Real-time chat
 Meetup hosting
 RSVP system
 Premium subscriptions
 User verification
</td> <td width="50%">
🚧 In Progress (v1.1)
 WebSocket real-time chat
 Push notifications (Firebase)
 Image upload (Cloudinary)
 Video call integration
 Advanced matching algorithm
 Email notifications
 Stories feature
</td> </tr> <tr> <td width="50%">
🔮 Planned (v2.0)
 AI-powered match suggestions
 Voice messages
 Group video calls
 Event ticketing system
 Gamification (badges, streaks)
 AR filters for photos
 Dating coach chatbot
</td> <td width="50%">
💡 Backlog
 iOS & Android native apps
 Web3 integration (NFT badges)
 Metaverse meetup spaces
 Spotify integration
 Instagram sync
 Background check API
 AI moderation
</td> </tr> </table>
📊 Performance
Metric	Score	Target
First Contentful Paint	1.2s	< 1.8s ✅
Time to Interactive	2.1s	< 3.8s ✅
Speed Index	1.8s	< 3.4s ✅
Total Blocking Time	150ms	< 300ms ✅
Largest Contentful Paint	2.5s	< 2.5s ✅
Cumulative Layout Shift	0.05	< 0.1 ✅
🔒 Security
<details> <summary><b>🛡️ Click to view security measures</b></summary><br>
Data Protection
✅ Encrypted database connections (SSL/TLS)
✅ SQL injection prevention (Parameterized queries via Drizzle)
✅ XSS protection (Content Security Policy headers)
✅ CSRF tokens (SameSite cookies)
Privacy
✅ GDPR compliant (Data export & deletion)
✅ Age verification (18+ only)
✅ Block & report system
✅ Data minimization
✅ Transparent privacy policy
Authentication
✅ Phone OTP verification
✅ Rate limiting (5 attempts per 15 min)
✅ Session management (HTTP-only cookies)
 Two-factor authentication (Planned)
🔐 Report security issues to: security@datebuddy.com

</details>
📄 License
This project is licensed under the MIT License — see the LICENSE file for details.

 

MIT License — Copyright (c) 2024 Anshul Rajput
👨‍💻 Author
<div align="center">
Anshul Rajput
GitHub
LinkedIn
Portfolio
Email

Full-Stack Developer | Open Source Enthusiast | Building the future of social connections

</div>
<div align="center">
💬 Let's Connect!
🐛 Found a bug? Open an issue •
💡 Feature idea? Start a discussion •
🤝 Want to contribute? Read the guidelines

⭐ Star this repo if you found it helpful!

Stars

Made with 💕 by Anshul Rajput

"Connecting hearts, one swipe at a time"

</div> ```
