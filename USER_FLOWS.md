# Dil Se - Complete User Flow Map

## 🗺️ Navigation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SPLASH SCREEN (/)                       │
│                     Auto-advance (3s)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   WELCOME/LOGIN (/welcome)                   │
│          Phone + OTP  |  Google  |  Apple                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              OTP VERIFICATION (/verify-otp)                  │
│                    6-digit input                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ONBOARDING FLOW (7 Steps)                   │
│                                                              │
│  1. Basic Info (/onboarding/basic-info) ────────► 14%       │
│     Name, DOB, Gender, Looking For                           │
│                         │                                    │
│  2. Location (/onboarding/location) ────────────► 28%       │
│     GPS or Manual City Selection                             │
│                         │                                    │
│  3. Photos (/onboarding/photos) ─────────────────► 42%      │
│     Upload 2-6 photos                                        │
│                         │                                    │
│  4. Bio (/onboarding/bio) ───────────────────────► 56%      │
│     Free text or prompt answers                              │
│                         │                                    │
│  5. Interests (/onboarding/interests) ───────────► 70%      │
│     Select 5+ interest tags                                  │
│                         │                                    │
│  6. Preferences (/onboarding/preferences) ────────► 84%     │
│     Age range, distance                                      │
│                         │                                    │
│  7. Review (/onboarding/review) ──────────────────► 100%    │
│     Preview + Profile Strength                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              TUTORIAL (/onboarding/tutorial)                 │
│           3 slides: Swipe | Super Like | Match               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
╔═════════════════════════════════════════════════════════════╗
║                    MAIN APP (Bottom Nav)                     ║
╠═════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │            🔥 DISCOVER (/discover)                    │  ║
║  │  ┌────────────────────────────────────────────┐      │  ║
║  │  │  Profile Card with Photos                  │      │  ║
║  │  │  • Name, Age, Distance                     │      │  ║
║  │  │  • Bio & Interests                         │      │  ║
║  │  │  • Verification Badge                      │      │  ║
║  │  └────────────────────────────────────────────┘      │  ║
║  │                                                       │  ║
║  │         [❌ Pass]  [⭐ Super]  [💖 Like]              │  ║
║  │                                                       │  ║
║  │  ┌─────────────┐  ┌─────────────┐                   │  ║
║  │  │ Out of Likes│  │ Match Modal │                   │  ║
║  │  │   Modal     │  │  Celebrate! │                   │  ║
║  │  │  ↓ Premium  │  │ ↓ Send Msg  │                   │  ║
║  │  └─────────────┘  └─────────────┘                   │  ║
║  └──────────────────────────────────────────────────────┘  ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │            💬 MATCHES (/matches)                      │  ║
║  │  ┌────────────────────────────────────────────┐      │  ║
║  │  │  New Matches (Horizontal Scroll)           │      │  ║
║  │  │  [👤] [👤] [👤] [👤]                        │      │  ║
║  │  └────────────────────────────────────────────┘      │  ║
║  │                                                       │  ║
║  │  Conversations List:                                 │  ║
║  │  ┌────────────────────────────────────────────┐      │  ║
║  │  │ 👤 Priya, 24        "Hey! How's..."   2m   │      │  ║
║  │  │    🟢 Active now                      [2]  │      │  ║
║  │  ├────────────────────────────────────────────┤      │  ║
║  │  │ 👤 Riya, 25         "Would love..."   1h   │      │  ║
║  │  └────────────────────────────────────────────┘      │  ║
║  │                    ↓ Tap to open                     │  ║
║  │                                                       │  ║
║  │         CHAT INTERFACE (/chat/[id])                  │  ║
║  │  ┌────────────────────────────────────────────┐      │  ║
║  │  │  Header: Photo | Name | Status              │     │  ║
║  │  ├────────────────────────────────────────────┤      │  ║
║  │  │  Messages Area:                             │     │  ║
║  │  │    Their msg (left, lavender)              │     │  ║
║  │  │             Your msg (right, gradient)      │     │  ║
║  │  │                                             │     │  ║
║  │  │  [Suggested Openers if first msg]          │     │  ║
║  │  ├────────────────────────────────────────────┤      │  ║
║  │  │  [+] [Type message...]           [Send →]  │     │  ║
║  │  │  📷 GIF 🎤                                  │     │  ║
║  │  └────────────────────────────────────────────┘      │  ║
║  └──────────────────────────────────────────────────────┘  ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │            👤 PROFILE (/profile)                      │  ║
║  │  ┌────────────────────────────────────────────┐      │  ║
║  │  │  Photo Carousel (swipeable)                │      │  ║
║  │  │  [Photo 1] [Photo 2] [Photo 3] [+ Add]     │      │  ║
║  │  ├────────────────────────────────────────────┤      │  ║
║  │  │  Profile Strength: 68% [○○○○○○○○··]        │      │  ║
║  │  ├────────────────────────────────────────────┤      │  ║
║  │  │  Basic Info: Name, Age, City               │      │  ║
║  │  │  Bio: "Coffee enthusiast..."               │      │  ║
║  │  │  Prompts & Answers                         │      │  ║
║  │  │  Interests: 📷 ✈️ ☕ 🏃 🎵                   │      │  ║
║  │  ├────────────────────────────────────────────┤      │  ║
║  │  │  [Get Verified ✓] (if not verified)       │      │  ║
║  │  │  [Preview Profile]                         │      │  ║
║  │  │  [Upgrade to Premium ✨]                   │      │  ║
║  │  └────────────────────────────────────────────┘      │  ║
║  │                                                       │  ║
║  │  Edit Mode (/profile/edit):                          │  ║
║  │    All sections editable + Save button               │  ║
║  └──────────────────────────────────────────────────────┘  ║
║                                                              ║
╚═════════════════════════════════════════════════════════════╝
```

## 📱 Secondary Flows

### Verification Flow
```
/verification (Info)
       │
       ▼
Camera View
  • Show pose instructions
  • Record video
       │
       ▼
Processing (AI verification)
       │
       ├─► Success ──► Verified Badge
       │
       └─► Failed ───► Retry Option
```

### Premium Subscription Flow
```
/premium
   │
   ├─► Free vs Premium Comparison
   │
   ├─► Plan Selection:
   │     • Daily (₹50)
   │     • Weekly (₹300, save 14%)
   │     • Monthly (₹1000, save 34%)
   │
   ├─► Special Offer (50% off first day)
   │
   └─► Payment ──► [UPI | Cards | Wallets]
```

### Settings Flow
```
/settings
   │
   ├─► Account Settings
   │     • Phone Number
   │     • Email
   │     • Connected Accounts
   │     • Delete Account
   │
   ├─► Discovery Settings
   │     • Age Range (slider)
   │     • Distance (slider)
   │     • Looking For
   │     • Only Verified (toggle)
   │
   ├─► Notifications
   │     • Push (toggle)
   │     • Matches (toggle)
   │     • Messages (toggle)
   │     • Likes (toggle)
   │
   ├─► Privacy & Safety
   │     • Block List
   │     • 2FA
   │     • Privacy Policy
   │     • Terms
   │
   ├─► Premium
   │     • Current Plan
   │     • Upgrade / Manage
   │
   └─► About
         • Help & Support
         • Guidelines
         • Version
         • Logout
```

## 🎯 User Actions Map

### Swipe Screen Actions
```
Profile Card:
  • Tap left/right edge → Navigate photos
  • Tap center → Expand full profile
  • Swipe right → Like
  • Swipe left → Pass
  • Tap star button → Super Like
  • Tap profile → View full profile

Action Buttons:
  • ❌ (Pass) → Next profile
  • ⭐ (Super Like) → Highlight match + next
  • 💖 (Like) → Check for match + next
  • ↶ (Undo) → Return to last profile (1/day free)

Top Bar:
  • 🔔 (Notifications) → /notifications
  • ⚙️ (Settings) → /settings
```

### Chat Actions
```
Message:
  • Long press → React | Reply | Copy | Report | Delete
  • Tap timestamp → Expand details
  • Tap photo → Full screen view

Input Bar:
  • + → Attachment menu (Camera | Gallery | Voice | GIF)
  • Text input → Type message
  • ➤ → Send message

Header:
  • ← → Back to matches
  • Profile photo → View full profile
  • ⋮ → Options (Mute | Report | Block | Unmatch)
```

### Profile Actions
```
Own Profile:
  • Edit → /profile/edit
  • Settings → /settings
  • Photo → Edit/reorder
  • Get Verified → /verification
  • Preview → See how others see you
  • Upgrade → /premium

Other's Profile:
  • Swipe photos → View all
  • ❌ → Pass
  • ⭐ → Super Like
  • 💖 → Like
  • ⋮ → Report | Block
```

## 🔄 State Transitions

### Match Flow
```
User A Likes User B
       │
       ▼
Check if User B liked User A
       │
       ├─► No → Store swipe, no notification
       │
       └─► Yes → CREATE MATCH
              │
              ├─► Show Match Modal to A
              ├─► Show Match Modal to B
              ├─► Add to Matches list
              └─► Enable chat
```

### Like Limit Flow
```
User attempts to Like
       │
       ▼
Check subscription tier
       │
       ├─► Premium → Allow (unlimited)
       │
       └─► Free → Check daily limit
              │
              ├─► < 20 → Allow, increment counter
              │
              └─► ≥ 20 → Show "Out of Likes" modal
                     │
                     ├─► Upgrade → /premium
                     └─► Wait → Show timer till reset
```

### Verification Flow
```
Start Verification
       │
       ▼
Record Video (follow poses)
       │
       ▼
Upload to Server
       │
       ▼
AI Processing (< 30 seconds)
       │
       ├─► Match found → Set verified = true
       │                 Show success
       │                 Add badge to profile
       │
       └─► No match → Show retry option
                      Explain tips
```

## 📊 Screen Hierarchy

### Level 1: Core App
- Discover (primary)
- Matches (engagement)
- Profile (self-management)

### Level 2: Supporting Flows
- Chat (from matches)
- Settings (from profile/top bar)
- Premium (from multiple entry points)
- Verification (from profile)

### Level 3: Onboarding
- Welcome → OTP → 7 Steps → Tutorial → Discover

### Level 4: Modals & Overlays
- Match celebration
- Out of likes
- Report/block confirmations
- Attachment picker
- Filter menu

## 🚪 Entry & Exit Points

### Entry Points
```
1. New User:
   Splash → Welcome → Onboarding → Discover

2. Returning User (Free):
   Splash → Auto-login → Discover
   (Skip if logged in recently)

3. Returning User (Premium):
   Splash → Auto-login → Discover
   (Show premium badge/benefits)

4. Deep Links:
   • /profile/[id] → View specific profile
   • /chat/[id] → Open specific chat
   • /premium → Direct to upgrade
```

### Exit Points
```
1. Logout:
   Settings → Logout → Confirm → Welcome

2. Delete Account:
   Settings → Delete → Confirm → Data removal → Welcome

3. Block/Report:
   Chat/Profile → Block → Confirm → Remove from matches

4. Unmatch:
   Chat → Unmatch → Confirm → Remove chat
```

## 🎨 Visual Flow Summary

```
[Purple/Pink = Interactive]
[Gray = Information]
[Red = Destructive]
[Green = Success/Positive]

Onboarding: Progress bar (gradient fill)
Discover: Swipe overlays (green/red)
Match: Full-screen celebration (psychedelic)
Chat: Message bubbles (gradient/lavender)
Premium: Gold accents
Settings: Simple list
```

## ⚡ Quick Actions

### From Discover:
- Like → 1 tap
- Pass → 1 swipe left
- Super Like → 1 tap star
- View profile → Tap center
- Filters → Top right icon

### From Matches:
- Open chat → 1 tap on conversation
- View profile → Tap photo
- Delete chat → Swipe left

### From Chat:
- Send message → Type + tap send
- Send photo → + → Camera/Gallery
- React to message → Long press

### From Profile:
- Edit → Top right button
- Add photo → Tap + slot
- Get verified → Tap CTA card
- Upgrade → Tap premium card

---

This flow map covers all 38+ screens and hundreds of interaction points, ensuring a smooth, intuitive experience for Gen Z users in India.
