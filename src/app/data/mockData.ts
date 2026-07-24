/* ─────────────────────────────────────────────────
   Types
───────────────────────────────────────────────── */
export interface Person {
  id: number; name: string; age: number; location: string
  bio: string; profession: string; education: string
  distance: string; photo: string; online: boolean
  verified: boolean; tags: string[]; mutuals: number
  prompts: { q: string; a: string }[]
}
export interface Community { id: number; name: string; emoji: string; members: string; category: string; photo: string; joined: boolean }
export interface Event { id: number; title: string; emoji: string; date: string; location: string; attendees: number; photo: string; tag: string }
export interface Convo { id: number; name: string; lastMsg: string; time: string; unread: number; photo: string; online: boolean; pinned?: boolean }
export interface Story { id: number; name: string; photo: string; hasNew: boolean; isMe?: boolean }
export interface Post { id: number; author: string; avatar: string; time: string; content: string; photo?: string; likes: number; comments: number; liked: boolean }

/* ─────────────────────────────────────────────────
   Mock Data
───────────────────────────────────────────────── */
export const PEOPLE: Person[] = [
  { id:1, name:'Priya Sharma', age:24, location:'Mumbai, MH', bio:'Day dreamer 🌸 | Coffee & sunsets | Finding more of myself these days ✨', profession:'UX Designer at Swiggy', education:'NID Ahmedabad', distance:'800m away', photo:'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600&h=800&fit=crop&crop=faces', online:true, verified:true, tags:['Yoga','Travel','Design','Coffee'], mutuals:4, prompts:[{q:'I can talk for hours about…', a:'The intersection of design and human emotion.'},{q:'My perfect weekend…', a:'Farmers market, long drive, good book.'}] },
  { id:2, name:'Ananya Gupta', age:26, location:'Delhi, DL', bio:"Bookworm 📚 | Chai over coffee | Let's spark real conversations 💬", profession:'Product Manager at Razorpay', education:'IIT Delhi', distance:'3km away', photo:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&crop=faces', online:false, verified:true, tags:['Books','Music','Art','Films'], mutuals:7, prompts:[{q:'Current obsession…', a:'Learning to play the guitar between meetings.'},{q:'Fun fact…', a:'I can name every Oscar Best Picture since 1980.'}] },
  { id:3, name:'Kavya Menon', age:22, location:'Bangalore, KA', bio:'Engineer by day, dancer by night 💃 | Vibe check: good energy only', profession:'SDE at Google', education:'BITS Pilani', distance:'1.2km away', photo:'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600&h=800&fit=crop&crop=faces', online:true, verified:false, tags:['Dance','Tech','Hiking','Anime'], mutuals:2, prompts:[{q:'Favorite destination…', a:'Coorg during monsoon. Nothing beats it.'},{q:'My perfect weekend…', a:'Hackathon on Saturday, trek on Sunday.'}] },
  { id:4, name:'Meera Nair', age:28, location:'Chennai, TN', bio:'Startup founder | Foodie | Occasional philosopher 🧠', profession:'Founder at Meera Studios', education:'IIM Bangalore', distance:'5km away', photo:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&crop=faces', online:false, verified:true, tags:['Business','Food','Philosophy','Fitness'], mutuals:11, prompts:[{q:'I can talk for hours about…', a:'Behavioral economics and why people do what they do.'},{q:'Current obsession…', a:'Building in public and open startups.'}] },
  { id:5, name:'Riya Kapoor', age:25, location:'Pune, MH', bio:'Photographer & storyteller 📷 | Mountains > Malls', profession:'Freelance Photographer', education:'Symbiosis Pune', distance:'2.5km away', photo:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=faces', online:true, verified:false, tags:['Photography','Travel','Nature','Fitness'], mutuals:3, prompts:[{q:'Favorite destination…', a:'Spiti Valley — went 3 times and still not enough.'},{q:'Fun fact…', a:"I've photographed 12 different countries by 25."}] },
  { id:6, name:'Aisha Khan', age:23, location:'Hyderabad, TS', bio:'AI researcher | Poetry | Making sense of the world, slowly 🌿', profession:'ML Engineer at Microsoft', education:'IIIT Hyderabad', distance:'8km away', photo:'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=600&h=800&fit=crop&crop=faces', online:true, verified:true, tags:['AI','Poetry','Music','Books'], mutuals:6, prompts:[{q:'I can talk for hours about…', a:'Large language models and what consciousness even means.'},{q:'Current obsession…', a:'Urdu poetry and neural embeddings — not that different.'}] },
]

export const COMMUNITIES: Community[] = [
  { id:1, name:'Design Minds', emoji:'🎨', members:'12.4k', category:'Design', photo:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop', joined:true },
  { id:2, name:'Builders Hub', emoji:'💼', members:'8.2k', category:'Business', photo:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop', joined:false },
  { id:3, name:'Fitness First', emoji:'🏋️', members:'21k', category:'Fitness', photo:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop', joined:true },
  { id:4, name:'AI & Tech', emoji:'🤖', members:'34k', category:'Technology', photo:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=200&fit=crop', joined:false },
  { id:5, name:'Travel Tribe', emoji:'✈️', members:'18k', category:'Travel', photo:'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=200&fit=crop', joined:false },
  { id:6, name:'Bookworms', emoji:'📚', members:'9.6k', category:'Books', photo:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop', joined:true },
  { id:7, name:'Music Collective', emoji:'🎵', members:'15.3k', category:'Music', photo:'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=200&fit=crop', joined:false },
  { id:8, name:'Food & Friends', emoji:'🍜', members:'27k', category:'Food', photo:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop', joined:false },
]

export const EVENTS: Event[] = [
  { id:1, title:'Design & Coffee Meetup', emoji:'☕', date:'Sat, 26 Jul · 10am', location:'Café Zoe, Bandra', attendees:34, photo:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=240&fit=crop', tag:'Design' },
  { id:2, title:'Mumbai Hackathon 2025', emoji:'💻', date:'Fri, 1 Aug · 9am', location:'WeWork BKC', attendees:120, photo:'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=240&fit=crop', tag:'Tech' },
  { id:3, title:'Sunset Yoga at Marine Drive', emoji:'🧘', date:'Sun, 27 Jul · 6am', location:'Marine Drive', attendees:18, photo:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=240&fit=crop', tag:'Fitness' },
  { id:4, title:'Indie Book Club July', emoji:'📖', date:'Wed, 30 Jul · 7pm', location:'Atta Galatta, Koramangala', attendees:22, photo:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=240&fit=crop', tag:'Books' },
]

export const CONVOS: Convo[] = [
  { id:1, name:'Priya Sharma', lastMsg:"Can't wait! See you tomorrow 🌸", time:'now', unread:3, photo:'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces', online:true, pinned:true },
  { id:2, name:'Design Minds', lastMsg:'Ananya: That prototype looks 🔥', time:'2m', unread:7, photo:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop', online:false },
  { id:3, name:'Kavya Menon', lastMsg:'When are you free this week?', time:'18m', unread:1, photo:'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=100&h=100&fit=crop&crop=faces', online:true },
  { id:4, name:'Meera Nair', lastMsg:'Loved your take on the podcast 🎙️', time:'2h', unread:0, photo:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces', online:false },
  { id:5, name:'Travel Tribe', lastMsg:'Anyone going to Goa next month?', time:'4h', unread:0, photo:'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&h=100&fit=crop', online:false },
  { id:6, name:'Riya Kapoor', lastMsg:'Check out this shot I took today 📷', time:'Yesterday', unread:0, photo:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=faces', online:true },
]

export const STORIES: Story[] = [
  { id:0, name:'My Story', photo:'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces', hasNew:false, isMe:true },
  { id:1, name:'Ananya', photo:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces', hasNew:true },
  { id:2, name:'Kavya', photo:'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=100&h=100&fit=crop&crop=faces', hasNew:true },
  { id:3, name:'Riya', photo:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=faces', hasNew:true },
  { id:4, name:'Meera', photo:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces', hasNew:false },
  { id:5, name:'Aisha', photo:'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=100&h=100&fit=crop&crop=faces', hasNew:true },
]

export const POSTS: Post[] = [
  { id:1, author:'Ananya Gupta', avatar:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&crop=faces', time:'2h ago', content:"Just wrapped up a 3-hour deep work session and honestly? The focus was unreal. No phone, no notifications. Just me, my notebook, and a playlist of lo-fi jazz. This is the life. 🎵✨", photo:'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=600&h=400&fit=crop', likes:142, comments:18, liked:false },
  { id:2, author:'Kavya Menon', avatar:'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=80&h=80&fit=crop&crop=faces', time:'5h ago', content:"Gave a talk at Google today on distributed systems and the audience was incredible. Questions were so sharp 💡 Always humbling to be in a room of brilliant people.", likes:287, comments:34, liked:true },
  { id:3, author:'Riya Kapoor', avatar:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=faces', time:'8h ago', content:"Golden hour from Spiti Valley last weekend. Words don't do it justice — so here's the photo. 🏔️", photo:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', likes:534, comments:61, liked:false },
]
