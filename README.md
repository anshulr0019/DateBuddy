# Date Buddy - Social Networking Platform 💕

A complete mobile-first dating application designed for the Indian Gen Z market (ages 18-30) with affordable pricing (₹50/day subscription).

## 🎨 Design Specifications

### Screen Size & Orientation
- **Dimensions:** 390 × 844 (iPhone standard)
- **Orientation:** Portrait only
- **Design Style:** Light mode with pastel psychedelic accents

### Color Palette
- **Background:** #FAFAFA (Soft off-white)
- **Primary Pink:** #FF6B9D (Action buttons, accents)
- **Primary Purple:** #7B68EE (Gradients, super likes)
- **Navy Text:** #1A1A2E (High contrast text)
- **Lavender:** #E6E6FA (Subtle backgrounds)
- **Gradients:** Pink to Purple (135deg)

### Typography
- **Font Family:** System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Headings:** 24-28px, Bold
- **Body Text:** 16px, Regular
- **Small Text:** 14px
- **Labels:** 12px

## 🚀 Complete User Flows

### FLOW 1: ONBOARDING (New User Journey)

#### Screen 1: Splash Screen (/)
- Full-screen psychedelic gradient animation
- App logo "💕 Dil Se" centered
- Tagline: "Find your vibe"
- Auto-advances after 3 seconds

#### Screen 2: Welcome/Login (/welcome)
- Phone number input with +91 country code
- "Send OTP" button (gradient pink-purple)
- Terms & Privacy acceptance text
- Google/Apple sign-in options

#### Screen 3: OTP Verification (/verify-otp)
- 6-digit OTP input boxes
- Auto-focus and auto-advance
- "Didn't receive code? Resend" link
- Back navigation

#### Screen 4: Basic Info (/onboarding/basic-info)
- Progress: Step 1 of 7 (14%)
- Name input field
- Date of birth picker (18+ validation)
- Gender selection (Male/Female/Non-binary/Other)
- Looking for (Men/Women/Everyone)

#### Screen 5: Location (/onboarding/location)
- Progress: Step 2 of 7 (28%)
- GPS auto-detect option
- Manual city input with Indian cities dropdown
- Helps find matches nearby

#### Screen 6: Photo Upload (/onboarding/photos)
- Progress: Step 3 of 7 (42%)
- 2x3 grid (6 photo slots)
- Minimum 2 photos required
- Photo counter and validation

#### Screen 7: Bio & Prompts (/onboarding/bio)
- Progress: Step 4 of 7 (56%)
- Free text bio (150 character limit)
- Fun prompt options:
  - "My perfect weekend is..."
  - "I'm weirdly good at..."
  - "Let's debate about..."
- Skip option available

#### Screen 8: Interests (/onboarding/interests)
- Progress: Step 5 of 7 (70%)
- 25+ interest tags with emojis
- Select minimum 5 interests
- Multi-select with gradient backgrounds

#### Screen 9: Preferences (/onboarding/preferences)
- Progress: Step 6 of 7 (84%)
- Age range slider (18-40)
- Distance slider (5-100 km)
- Settings can be changed later

#### Screen 10: Profile Review (/onboarding/review)
- Progress: Step 7 of 7 (100%)
- Preview card with profile
- Profile strength indicator (circular progress)
- "Start Swiping" or "Add More Details" options

#### Screen 11: Tutorial (/onboarding/tutorial)
- 3-slide carousel with swipe gestures
- Slide 1: Swipe right to like 💖
- Slide 2: Tap star for Super Like ⭐
- Slide 3: Match and chat 💕
- Skip or navigate through slides

### FLOW 2: MAIN APP (Discovery & Swiping)

#### Screen 12: Discovery/Swipe (/discover)
**Top Bar:**
- Dil Se logo (gradient text)
- Notification bell with badge count
- Settings/filters icon

**Main Card Area:**
- Full-screen profile card with:
  - Photo carousel (tap sides to navigate)
  - Name, age, verification badge
  - Distance indicator
  - Bio snippet
  - Interest tags (3-5 shown)
  - Photo dots indicator

**Action Buttons:**
- Pass (❌) - Gray circle
- Super Like (⭐) - Purple gradient
- Like (💖) - Pink gradient
- Undo (↶) - Small, top-left (1 per day for free users)

**Swipe Overlays:**
- Green "LIKE" on right swipe
- Red "PASS" on left swipe
- Purple "SUPER LIKE" on tap star
- Psychedelic trail animation

**Empty State:**
- "No more profiles nearby 🌍"
- Adjust preferences suggestion
- Come back later message

**Bottom Nav (All Main Screens):**
- Discover (🔥) - Active
- Matches (💬) - Badge for new messages
- Profile (👤)

#### Out of Likes Modal
- Appears at daily limit (20 likes for free users)
- Free vs Premium comparison table
- "Upgrade for ₹50" call-to-action
- Timer showing reset countdown

### FLOW 3: MATCHING & CHAT

#### Match Celebration Modal
- Full-screen psychedelic gradient
- "It's a Match! 💕" headline
- Two circular profile photos with borders
- "Send Message" (primary action)
- "Keep Swiping" (secondary)
- "View Profile" link

#### Screen 16: Matches/Chat List (/matches)
**New Matches Section:**
- Horizontal scrolling row
- Circular profile photos with "New" badges
- Names below photos

**Conversations List:**
- Profile photo with green active dot
- Name, age
- Last message preview (truncated)
- Timestamp
- Unread count badge (pink circle)
- Swipe left to reveal Delete/Unmatch

**Empty State:**
- "No matches yet" message
- "Keep swiping" encouragement
- "Go to Discover" button

#### Screen 17-18: Chat Interface (/chat/[id])
**Header:**
- Back button
- Profile photo (tappable)
- Name, age
- Active status ("Active now 🟢")
- Three-dot menu

**First Time (Empty Chat):**
- "Break the ice! 💬" centered
- 3 suggested conversation starters
- Tappable cards that fill input field

**Active Chat:**
- Date separators (Today/Yesterday/Date)
- Sent messages (right, gradient bubble)
- Received messages (left, lavender bubble)
- Read receipts (✓✓)
- Photo/GIF/Voice message support
- Emoji reactions

**Input Bar:**
- Plus icon (attachment menu)
- Text input (expandable)
- Send arrow (gradient when typing)
- Quick actions: GIF/Camera/Mic

**Attachment Menu:**
- Camera (take photo/video)
- Gallery (choose photos)
- Voice Message
- GIF Picker

**Context Menu (Long-press):**
- React 👍
- Reply 💬
- Copy 📋
- Report ⚠️
- Delete 🗑️ (own messages only)

**Three-Dot Menu:**
- View Profile
- Mute Notifications
- Report
- Block
- Unmatch

### FLOW 4: PROFILE & SETTINGS

#### Screen 26: User Profile (/profile)
**Header:**
- "Profile" title
- Edit button
- Settings icon

**Content:**
- Photo carousel (swipeable, 6-9 photos)
- Add photo slots
- Profile strength indicator (circular %)
- Basic info card
- Bio section
- Prompts & answers
- Interests grid
- Verification status/CTA
- "Preview Profile" button
- Premium upgrade card (gradient)

#### Profile Edit
- All sections editable
- Photo upload/reorder
- Bio editing (150 char limit)
- Prompt selection
- Interest multi-select
- Save changes button

#### Verification Flow (/verification)
**Info Screen:**
- Benefits list:
  - Stand out from crowd
  - 50% more matches
  - Show you're real
- How it works (3 steps)
- "Start Verification" button

**Camera Screen:**
- Live camera preview
- Face outline overlay
- Pose instructions (Wave/Smile/Turn)
- Record button

**Processing:**
- Loading spinner
- "Verifying..." message

**Success:**
- Psychedelic gradient background
- Large checkmark ✓
- "You're Verified!" message
- Verified badge notification

**Failed:**
- Retry option
- Tips for better verification
- "Maybe Later" option

#### Settings (/settings)
**Account Settings:**
- Phone number
- Email
- Connected accounts
- Delete account (red)

**Discovery Settings:**
- Age range slider
- Maximum distance slider
- Show me preference
- Only verified profiles toggle

**Notifications:**
- Push notifications toggle
- Match notifications toggle
- Message notifications toggle
- Likes notifications toggle

**Privacy & Safety:**
- Block list
- Two-factor authentication
- Privacy policy link
- Terms of service link

**Premium:**
- Current plan status
- "Upgrade to Premium" button
- Manage subscription (if premium)

**About:**
- Help & Support
- Community guidelines
- App version
- Logout (red text)

#### Premium Subscription (/premium)
**Header:**
- Psychedelic gradient background
- "Upgrade Your Experience ✨"
- Close button

**Comparison Table:**
- FREE vs PREMIUM features:
  - Daily Likes: 20 vs Unlimited
  - See Who Liked You: 2/day vs Unlimited
  - Rewinds: 1/day vs Unlimited
  - Super Likes: 1/day vs 5/day
  - Profile Boost: ❌ vs ✓
  - Advanced Filters: ❌ vs ✓
  - Read Receipts: ❌ vs ✓
  - Ad-Free: ❌ vs ✓

**Pricing Plans:**
- Daily: ₹50 (₹50/day)
- Weekly: ₹300 (₹43/day, Save 14%)
- Monthly: ₹1000 (₹33/day, Save 34%)

**Special Offer:**
- "First-time offer: 50% off first day!"

**Payment:**
- "Get Premium" button
- Payment methods: UPI, Cards, Wallets
- Auto-renewal notice
- Cancel anytime

## 🗄️ Database Schema

### Tables
- **users** - User profiles and authentication
- **photos** - User photos with ordering
- **interests** - Available interests
- **user_interests** - User-interest junction
- **prompts** - Available prompt questions
- **user_prompt_answers** - User answers
- **preferences** - User matching preferences
- **swipes** - Like/pass/super like actions
- **matches** - Mutual matches
- **messages** - Chat messages
- **subscriptions** - Premium subscriptions
- **daily_limits** - Free user daily limits
- **verifications** - Verification requests
- **notifications** - In-app notifications
- **reports** - User reports
- **blocks** - Blocked users
- **profile_views** - Profile view tracking

## 🎯 Key Features

### Free Users (₹0)
- 20 likes per day
- 2 profile reveals per day
- 1 rewind per day
- 1 super like per day
- Basic filters
- Ads shown

### Premium Users (₹50/day)
- Unlimited likes
- Unlimited profile reveals
- Unlimited rewinds
- 5 super likes per day
- 24-hour profile boost
- Advanced filters
- Read receipts
- Ad-free experience

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + Custom CSS
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** Phone OTP (mock in demo)
- **Deployment:** Vercel-ready

## 🎨 Design Highlights

### Psychedelic Animations
- Splash screen gradient animation
- Match celebration background
- Loading states
- Swipe trail effects

### Mobile Optimizations
- 390×844 container
- Touch-friendly buttons (48px min)
- Swipe gestures
- Safe area padding
- Bottom navigation
- One-handed operation

### Gen Z Appeal
- Emoji-heavy interface
- Casual, friendly copy
- Gamified elements
- Social proof (verification badges)
- Affordable pricing
- Quick onboarding

## 📱 User Experience Principles

1. **Speed:** 7-step onboarding completable in 3-5 minutes
2. **Simplicity:** Clear visual hierarchy, minimal text
3. **Safety:** Verification system, report/block features
4. **Engagement:** Daily limits encourage return visits
5. **Value:** Clear premium benefits, affordable pricing for Indian market

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up database
npx drizzle-kit push

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```


## 🎉 Demo Features

- Complete onboarding flow (7 steps)
- Profile discovery with swipe mechanics
- Match celebration modal
- Real-time chat interface
- Premium subscription flow
- Verification system
- Settings & preferences
- Profile editing

## 📄 License

This is a demonstration project showcasing modern dating app UX design and implementation.

---

Built with 💕 for the Indian Gen Z market
