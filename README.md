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
┌─────────────────────────────────────────────────────────────┐
│ DateBuddy Database │
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


**Key Relationships:**
- One user → Many photos `(1:N)`
- Users ↔ Interests `(N:M via user_interests)`
- Users ↔ Meetups `(N:M via meetup_attendees)`
- Matches trigger Conversations `(1:1)`

</details>

---

## 🚀 Quick Start

### Prerequisites
✅ Node.js 18+ installed
✅ PostgreSQL database (Neon / Supabase / Local)
✅ npm or yarn package manager


### Installation

```bash
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

