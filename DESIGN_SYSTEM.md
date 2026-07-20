# Dil Se - Design System & Component Library

## 🎨 Visual Design Language

### Color System

#### Primary Colors
```
--pink: #FF6B9D         → Primary CTA, likes, active states
--purple: #7B68EE       → Super likes, premium features
--navy: #1A1A2E         → Primary text, high contrast
--lavender: #E6E6FA     → Message bubbles, soft backgrounds
--bg-main: #FAFAFA      → Main background, off-white
```

#### Gradients
```css
/* Primary Gradient (Pink to Purple) */
background: linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%);

/* Psychedelic Gradient (Animated) */
background: linear-gradient(45deg, #FF6B9D, #7B68EE, #FF69B4, #9B59B6, #FF1493, #8A2BE2);
background-size: 400% 400%;
animation: psychedelic 15s ease infinite;
```

#### Semantic Colors
```
Success: #4CAF50        → Verification, positive actions
Warning: #FFC107        → Alerts, special offers
Error: #F44336          → Errors, delete actions
Info: #2196F3           → Information, help text
```

### Typography Scale

#### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

#### Type Scale
```
Display:    32px / 40px (line-height), Bold, -0.5px (letter-spacing)
H1:         28px / 36px, Bold
H2:         24px / 32px, Bold
H3:         20px / 28px, Semibold
Body Large: 18px / 28px, Regular
Body:       16px / 24px, Regular
Body Small: 14px / 20px, Regular
Caption:    12px / 16px, Regular
Label:      11px / 14px, Medium
```

### Spacing System

#### Base Unit: 4px

```
xs:  4px   (1 unit)
sm:  8px   (2 units)
md:  12px  (3 units)
lg:  16px  (4 units)
xl:  24px  (6 units)
2xl: 32px  (8 units)
3xl: 48px  (12 units)
4xl: 64px  (16 units)
```

### Border Radius

```
sm:     4px    → Input fields, small elements
md:     8px    → Buttons, cards
lg:     12px   → Primary buttons, modals
xl:     16px   → Cards, containers
2xl:    24px   → Large cards
full:   9999px → Pills, circular elements
```

### Shadows

```css
/* Card Shadow */
box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);

/* Button Shadow */
box-shadow: 0px 4px 12px rgba(255, 107, 157, 0.3);

/* Modal Shadow */
box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.16);

/* Bottom Nav Shadow */
box-shadow: 0px -2px 8px rgba(0, 0, 0, 0.04);
```

## 📦 Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%);
  color: white;
  border-radius: 12px;
  padding: 14px 24px;
  font-weight: 600;
  font-size: 16px;
  min-height: 48px;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: #FF6B9D;
  border: 2px solid #FF6B9D;
  border-radius: 12px;
  padding: 14px 24px;
  font-weight: 600;
  font-size: 16px;
  min-height: 48px;
}
```

#### Icon Button (Swipe Actions)
```css
/* Pass Button */
width: 64px;
height: 64px;
background: white;
border-radius: 50%;
box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);

/* Like Button */
background: linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%);

/* Super Like Button */
background: linear-gradient(135deg, #7B68EE 0%, #2196F3 100%);
```

### Input Fields

#### Text Input
```css
.input-field {
  width: 100%;
  min-height: 44px;
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #FF6B9D;
}
```

### Cards

#### Standard Card
```css
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
}
```

#### Profile Card
```css
aspect-ratio: 3/4;
border-radius: 20px;
overflow: hidden;
position: relative;
```

### Chat Bubbles

#### Sent Message
```css
.chat-bubble-sent {
  background: linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%);
  color: white;
  border-radius: 18px 18px 4px 18px;
  padding: 12px 16px;
  max-width: 75%;
}
```

#### Received Message
```css
.chat-bubble-received {
  background: #F0F0F5;
  color: #1A1A2E;
  border-radius: 18px 18px 18px 4px;
  padding: 12px 16px;
  max-width: 75%;
}
```

### Navigation

#### Bottom Navigation
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  max-width: 390px;
  width: 100%;
  background: white;
  border-top: 1px solid #E0E0E0;
  height: 68px;
  display: flex;
  justify-content: space-around;
  z-index: 100;
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #999;
  transition: color 0.2s;
}

.bottom-nav-item.active {
  color: #FF6B9D;
}
```

### Progress Indicators

#### Linear Progress Bar
```css
/* Container */
height: 4px;
background: #E0E0E0;
border-radius: 2px;
overflow: hidden;

/* Fill */
background: linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%);
transition: width 0.3s ease;
```

#### Circular Progress (Profile Strength)
```css
/* Using SVG circle with gradient stroke */
stroke-dasharray: circumference;
stroke-dashoffset: circumference * (1 - percentage);
stroke-linecap: round;
```

### Badges & Tags

#### Interest Tag
```css
padding: 6px 12px;
background: rgba(255, 107, 157, 0.1);
color: #FF6B9D;
border-radius: 20px;
font-size: 14px;
```

#### Notification Badge
```css
position: absolute;
background: #FF6B9D;
color: white;
border-radius: 10px;
padding: 2px 6px;
font-size: 10px;
font-weight: 700;
```

#### Verified Badge
```css
display: inline-flex;
align-items: center;
color: #2196F3;
```

## 🎭 Animations & Transitions

### Standard Transitions
```css
/* Button Press */
transition: transform 0.2s, opacity 0.2s;
active: transform: scale(0.98);

/* Fade In */
transition: opacity 0.3s ease;

/* Slide In */
transition: transform 0.3s ease;
```

### Keyframe Animations

#### Psychedelic Gradient
```css
@keyframes psychedelic {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

#### Pulse (Match Celebration)
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

#### Spin (Loading)
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Swipe Gestures
```css
/* Swipe Right (Like) */
transform: translateX(100px) rotate(12deg);
opacity: 0;
transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

/* Swipe Left (Pass) */
transform: translateX(-100px) rotate(-12deg);
opacity: 0;
```

## 📐 Layout Patterns

### Mobile Container
```css
.mobile-container {
  max-width: 390px;
  min-height: 844px;
  margin: 0 auto;
  background: #FAFAFA;
  position: relative;
  overflow-x: hidden;
}
```

### Safe Areas (iOS Notch/Home Bar)
```css
.safe-top {
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Content Padding
```css
/* Standard page padding */
padding: 16px;

/* Full-bleed sections */
padding: 0;
margin-left: -16px;
margin-right: -16px;
```

## 🎯 Interactive States

### Button States
```
Default:   Full opacity, normal scale
Hover:     Slight scale (1.02) - web only
Active:    Scale (0.98), slight opacity (0.9)
Disabled:  Opacity (0.4), cursor not-allowed
Loading:   Disabled state + spinner
```

### Input States
```
Default:   Border #E0E0E0
Focus:     Border #FF6B9D, outline none
Error:     Border #F44336, error text below
Success:   Border #4CAF50, success icon
Disabled:  Background #F5F5F5, opacity 0.6
```

### Card States
```
Default:   Base shadow
Hover:     Enhanced shadow (web)
Active:    Pressed state (mobile)
Selected:  Border #FF6B9D, background tint
```

## ♿ Accessibility Guidelines

### Touch Targets
- Minimum size: 44×44px
- Recommended: 48×48px
- Spacing between: 8px minimum

### Color Contrast
- Text on white: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum
- UI elements: 3:1 minimum

### Focus States
- Visible focus indicator on all interactive elements
- Custom focus ring: 2px solid #FF6B9D with 2px offset

### Screen Reader Support
- Semantic HTML (button, nav, main, etc.)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content

## 📱 Responsive Behavior

### Breakpoints
```
Mobile First Approach - Base: 390px
No desktop breakpoints (mobile-only app)
```

### Orientation
```
Portrait: Default, optimized
Landscape: Discouraged, show rotation prompt
```

### Font Scaling
```
Support iOS Dynamic Type
Max scale: 200%
Min scale: 75%
```

## 🎨 Icon System

### Primary Icons (Emoji-based)
```
Like:        💖
Pass:        ❌
Super Like:  ⭐
Match:       💕
Chat:        💬
Profile:     👤
Discover:    🔥
Verified:    ✓
Settings:    ⚙️
```

### Backup (SVG Icons if needed)
- Feather Icons or Heroicons
- 24×24px default size
- Consistent stroke width: 2px

## 🔄 Loading States

### Skeleton Screens
```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
}
```

### Spinners
```css
.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #FF6B9D;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}
```

## 📝 Microcopy Guidelines

### Tone of Voice
- Casual, friendly, Gen Z appropriate
- Use emojis liberally
- Short, punchy sentences
- Avoid corporate jargon

### Example Phrases
```
Good: "Let's find your vibe 💕"
Bad:  "Please complete your profile to continue"

Good: "Oops! No internet 📡"
Bad:  "Network connection error"

Good: "You're all caught up! 🌟"
Bad:  "No more profiles available"
```

### Error Messages
```
Empty State:  "No [items] yet" + emoji + encouraging CTA
Network:      "Oops! Check your connection 📡"
Server:       "Something went wrong on our end 😕"
Validation:   Inline, helpful, specific
```

## 🎉 Celebration Moments

### Match Celebration
- Full-screen psychedelic gradient
- Large emoji (💕)
- Profile photos with animated entrance
- Confetti/particle effects (optional)

### Verification Success
- Gradient background
- Large checkmark with pulse animation
- Encouraging message
- Quick transition

### Premium Unlock
- Shimmer effect on premium features
- Gold/gradient accents
- "Unlocked" animation

---

This design system ensures consistency across all 38+ screens while maintaining the playful, Gen Z-friendly aesthetic that makes Dil Se stand out in the Indian dating market.
