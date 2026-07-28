import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

frontend_dir = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend"

# Tailwind config
create_file(f"{frontend_dir}/tailwind.config.js", """
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#10B981",
        secondary: "#34D399",
        dark: "#0F172A",
        light: "#F8FAFC",
        accent: "#F59E0B",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        card: "#FFFFFF",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'floating': '0 20px 40px -10px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
""")

# Index CSS
create_file(f"{frontend_dir}/src/index.css", """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-light text-textPrimary font-sans antialiased;
  }
}

.glass-card {
  @apply bg-white/80 backdrop-blur-xl shadow-glass rounded-3xl border border-white;
}

.dark-glass-card {
  @apply bg-dark/80 backdrop-blur-xl shadow-glass rounded-3xl border border-white/10;
}

/* Hide scrollbar for clean UI */
::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}
""")

# App.tsx
create_file(f"{frontend_dir}/src/App.tsx", """
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HomeIcon, UsersIcon, ViewfinderCircleIcon, ChatBubbleBottomCenterTextIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, UsersIcon as UsersSolid, ViewfinderCircleIcon as ScanSolid, ChatBubbleBottomCenterTextIcon as ChatSolid, UserCircleIcon as UserSolid } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Chatbot from './pages/Chatbot';

function BottomNav() {
  const location = useLocation();
  const tabs = [
    { path: '/dashboard', label: 'Home', IconOutline: HomeIcon, IconSolid: HomeSolid },
    { path: '/community', label: 'Community', IconOutline: UsersIcon, IconSolid: UsersSolid },
    { path: '/scan', label: 'Scan', IconOutline: ViewfinderCircleIcon, IconSolid: ScanSolid, isCenter: true },
    { path: '/chat', label: 'AI Chat', IconOutline: ChatBubbleBottomCenterTextIcon, IconSolid: ChatSolid },
    { path: '/profile', label: 'Profile', IconOutline: UserCircleIcon, IconSolid: UserSolid },
  ];

  return (
    <div className="absolute bottom-6 w-full px-6 pointer-events-none z-50">
      <motion.nav 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white/90 backdrop-blur-2xl shadow-floating border border-white/40 rounded-3xl flex justify-around items-center py-4 px-2 pointer-events-auto"
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === '/scan' && location.pathname === '/scan');
          if (tab.isCenter) {
            return (
              <Link to="/scan" key={tab.path} className="relative -top-8 flex flex-col items-center group">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-tr from-primary to-secondary p-4 rounded-full text-white shadow-xl shadow-primary/30"
                >
                  <tab.IconOutline className="w-7 h-7" />
                </motion.div>
              </Link>
            );
          }
          return (
            <Link to={tab.path} key={tab.path} className="flex flex-col items-center relative group">
              {isActive ? (
                <motion.div layoutId="nav-pill" className="absolute inset-0 bg-primary/10 rounded-2xl -z-10 scale-125" />
              ) : null}
              {isActive ? (
                <tab.IconSolid className="w-6 h-6 text-primary mb-1 transition-colors" />
              ) : (
                <tab.IconOutline className="w-6 h-6 text-textSecondary group-hover:text-primary transition-colors" />
              )}
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-textSecondary'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="bg-light min-h-screen font-sans flex flex-col max-w-[420px] mx-auto shadow-2xl overflow-hidden relative sm:border sm:border-gray-200">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Splash onComplete={() => {}} />} />
            <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/community" element={<Community />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/scan" element={<div className="flex h-full items-center justify-center text-textSecondary">Scan UI Redesign Placeholder</div>} />
            <Route path="/profile" element={<div className="flex h-full items-center justify-center text-textSecondary">Profile UI Redesign Placeholder</div>} />
          </Routes>
        </AnimatePresence>
        
        {isAuthenticated && <BottomNav />}
      </div>
    </Router>
  );
}

export default App;
""")

# Splash.tsx
create_file(f"{frontend_dir}/src/pages/Splash.tsx", """
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Splash({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
      navigate('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-dark to-slate-800 relative overflow-hidden">
      {/* Animated Background Particles */}
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }} 
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
        className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[80px]"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }} 
        className="absolute w-72 h-72 bg-secondary/20 rounded-full blur-[60px] top-10 right-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center z-10 flex flex-col items-center"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-primary/30 flex items-center justify-center text-white text-4xl"
        >
          🌿
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
          AgriNex <span className="text-primary font-light">AI</span>
        </h1>
        <p className="text-secondary/80 text-sm font-medium tracking-wide">Smart Farming Powered by AI</p>
      </motion.div>
    </div>
  );
}
""")

# Login.tsx
create_file(f"{frontend_dir}/src/pages/Login.tsx", """
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!phone) return;
    try {
      await axios.post('https://agrinex-backend-c1ig.onrender.com/api/auth/otp/generate', { phone });
      setStep(2);
    } catch (e) {
      console.error(e);
      setStep(2); // Fallback for UI demo
    }
  };

  const handleVerify = async () => {
    if (!otp) return;
    try {
      // await axios.post('https://agrinex-backend-c1ig.onrender.com/api/auth/otp/verify', { phone, otp });
      onLogin();
      navigate('/dashboard');
    } catch (e) {
      onLogin();
      navigate('/dashboard');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="p-6 h-full flex flex-col justify-center bg-light relative overflow-hidden"
    >
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

      <motion.div 
        initial={{ y: 40, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
        className="glass-card p-8 relative z-10 w-full"
      >
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">
          👋
        </div>
        <h2 className="text-3xl font-bold text-textPrimary mb-2">Welcome Back</h2>
        <p className="text-textSecondary text-sm mb-8">Sign in to your smart farm dashboard.</p>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block">Mobile Number</label>
                <input 
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-textPrimary placeholder-gray-400"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSendOTP}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-2xl font-semibold shadow-lg shadow-primary/25 transition-all"
              >
                Send OTP
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block">Enter OTP</label>
                <input 
                  type="text"
                  placeholder="• • • •"
                  className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-[0.5em] text-center text-xl font-bold text-textPrimary"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleVerify}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-2xl font-semibold shadow-lg shadow-primary/25 transition-all"
              >
                Verify & Login
              </motion.button>
              <button onClick={() => setStep(1)} className="w-full text-textSecondary text-sm font-medium hover:text-primary transition-colors">
                Change Mobile Number
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
""")

# Dashboard.tsx
create_file(f"{frontend_dir}/src/pages/Dashboard.tsx", """
import React from 'react';
import { motion } from 'framer-motion';
import { BellIcon, CloudIcon, CloudRainIcon } from '@heroicons/react/24/outline';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function Dashboard() {
  return (
    <motion.div 
      initial="hidden" animate="show" variants={containerVariants}
      className="p-6 h-full overflow-y-auto bg-light pb-32"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="flex justify-between items-center mb-8 pt-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="https://i.pravatar.cc/150?img=11" alt="profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white rounded-full"></div>
          </div>
          <div>
            <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Good Morning</p>
            <h1 className="text-xl font-bold text-textPrimary leading-tight">Ramesh Kumar</h1>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 relative">
          <BellIcon className="w-5 h-5 text-textPrimary" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-white"></span>
        </motion.button>
      </motion.header>

      {/* Weather Card */}
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-primary to-secondary rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h3 className="text-white/80 font-medium text-sm mb-1">Your Farm Weather</h3>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tighter">28°</span>
              <span className="text-xl mb-1 font-medium">C</span>
            </div>
            <p className="text-white/90 text-sm mt-2 font-medium">Partly Cloudy • Pune</p>
          </div>
          <div className="text-5xl drop-shadow-md">⛅</div>
        </div>
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/20 relative z-10">
          <div className="flex items-center gap-2">
            <CloudRainIcon className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium">10% Rain</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudIcon className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium">12 km/h Wind</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-8">
        <h3 className="text-lg font-bold text-textPrimary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="glass-card p-5 text-left group">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <span className="text-2xl">🦠</span>
            </div>
            <h4 className="font-bold text-textPrimary mb-1">Crop Scan</h4>
            <p className="text-xs text-textSecondary font-medium">Detect diseases instantly</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="glass-card p-5 text-left group">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <span className="text-2xl">📈</span>
            </div>
            <h4 className="font-bold text-textPrimary mb-1">Market Prices</h4>
            <p className="text-xs text-textSecondary font-medium">Live mandi rates</p>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Schemes */}
      <motion.div variants={itemVariants} className="mb-4">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-textPrimary">Subsidies</h3>
          <button className="text-sm font-semibold text-primary">View All</button>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-accent flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-textPrimary text-base">PM Kisan Samman Nidhi</h4>
            <span className="bg-green-100 text-primary text-[10px] px-2 py-1 rounded-full font-bold uppercase">Active</span>
          </div>
          <p className="text-sm text-textSecondary leading-relaxed">Financial benefit of ₹6000 per year payable in 3 equal installments.</p>
          <button className="self-start mt-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-semibold text-textPrimary transition-colors shadow-sm">
            Check Eligibility
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
""")

# Community.tsx
create_file(f"{frontend_dir}/src/pages/Community.tsx", """
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HeartIcon, ChatBubbleOvalLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

export default function Community() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('https://agrinex-backend-c1ig.onrender.com/api/posts');
        setPosts(res.data.length ? res.data : getDefaultPosts());
      } catch (e) {
        setPosts(getDefaultPosts());
      }
    };
    fetchPosts();
  }, []);

  const getDefaultPosts = () => [
    { id: 1, user_id: 1, name: "Kisan Network", content: "Organic farming yielding great results this season! Using natural compost makes a huge difference. 🌾✨", created_at: new Date().toISOString(), likes: 234, comments: 45, image: "https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80&w=800" },
    { id: 2, user_id: 2, name: "Anita Devi", content: "Can anyone suggest the best pesticide for tomato leaf curl? Seeing early signs. 🍅", created_at: new Date().toISOString(), likes: 12, comments: 8 }
  ];

  return (
    <div className="h-full flex flex-col bg-light relative">
      {/* Header */}
      <div className="pt-8 pb-4 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <h1 className="text-2xl font-bold text-textPrimary">Community Feed</h1>
      </div>

      {/* Stories mock */}
      <div className="px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar border-b border-gray-100 bg-white">
        <div className="flex flex-col items-center gap-1 min-w-max">
          <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            <span className="text-2xl">+</span>
          </div>
          <span className="text-xs font-medium text-textSecondary">Add Story</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-max">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px]">
              <img src={`https://i.pravatar.cc/150?img=${i+20}`} className="w-full h-full rounded-full border-2 border-white object-cover" />
            </div>
            <span className="text-xs font-medium text-textPrimary">User {i}</span>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto pb-32">
        {posts.map((post: any, idx: number) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            key={post.id} className="bg-white mb-3 shadow-sm border-y border-gray-100 sm:border-x sm:mx-4 sm:rounded-2xl sm:mt-4"
          >
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`https://i.pravatar.cc/150?img=${post.user_id + 10}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-sm text-textPrimary">{post.name || `User ${post.user_id}`}</h4>
                  <p className="text-xs text-textSecondary">2 hrs ago • Maharashtra</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-textPrimary">•••</button>
            </div>
            
            {/* Post Content */}
            <p className="px-4 pb-3 text-sm text-textPrimary leading-relaxed">{post.content}</p>
            {post.image && (
              <div className="w-full h-64 bg-gray-100">
                <img src={post.image} alt="post" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Post Actions */}
            <div className="p-4 flex items-center justify-between border-t border-gray-50">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 group">
                  <motion.div whileTap={{ scale: 0.8 }}>
                    <HeartIcon className="w-6 h-6 text-textSecondary group-hover:text-red-500 transition-colors" />
                  </motion.div>
                  <span className="text-sm font-semibold text-textSecondary group-hover:text-red-500 transition-colors">{post.likes || 0}</span>
                </button>
                <button className="flex items-center gap-2 group">
                  <ChatBubbleOvalLeftIcon className="w-6 h-6 text-textSecondary group-hover:text-primary transition-colors" />
                  <span className="text-sm font-semibold text-textSecondary group-hover:text-primary transition-colors">{post.comments || 0}</span>
                </button>
                <button className="flex items-center gap-2 group">
                  <ShareIcon className="w-6 h-6 text-textSecondary group-hover:text-primary transition-colors" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="absolute bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center z-40"
      >
        <span className="text-3xl font-light mb-1">+</span>
      </motion.button>
    </div>
  );
}
""")

# Chatbot.tsx
create_file(f"{frontend_dir}/src/pages/Chatbot.tsx", """
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperAirplaneIcon, MicrophoneIcon, SparklesIcon } from '@heroicons/react/24/solid';

export default function Chatbot() {
  const [messages, setMessages] = useState<{id: number, text: string, is_ai: boolean, isTyping?: boolean}[]>([
    { id: 1, text: "Hello! I am AgriNex AI. Ask me about crop diseases, fertilizers, or weather forecasts.", is_ai: true }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async (textToSend: string = input) => {
    if (!textToSend.trim()) return;
    
    const newMsg = { id: Date.now(), text: textToSend, is_ai: false };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    
    // Add typing indicator
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, text: "...", is_ai: true, isTyping: true }]);

    try {
      const res = await axios.post('https://agrinex-backend-c1ig.onrender.com/api/chat', { message: textToSend });
      setMessages(prev => prev.map(m => m.id === typingId ? { id: typingId, text: res.data.message, is_ai: true } : m));
    } catch (e) {
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === typingId ? { id: typingId, text: "I'm currently offline. Please check your connection.", is_ai: true } : m));
      }, 1000);
    }
  };

  const suggestions = ["Detect tomato disease", "Best fertilizer for wheat", "When to irrigate corn?"];

  return (
    <div className="h-full flex flex-col bg-light">
      {/* Header */}
      <div className="pt-8 pb-4 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-sm">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-textPrimary">AgriNex AI</h1>
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Online
            </p>
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className={`flex ${m.is_ai ? 'justify-start' : 'justify-end'}`}
            >
              {m.is_ai && !m.isTyping && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2 flex-shrink-0 mt-1">
                  <SparklesIcon className="w-4 h-4" />
                </div>
              )}
              
              <div className={`max-w-[75%] p-4 text-sm leading-relaxed shadow-sm ${
                m.is_ai 
                  ? 'bg-white rounded-2xl rounded-tl-sm border border-gray-100 text-textPrimary' 
                  : 'bg-primary rounded-2xl rounded-tr-sm text-white'
              }`}>
                {m.isTyping ? (
                  <motion.div className="flex gap-1 items-center h-5 px-2" animate="animate">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </motion.div>
                ) : (
                  m.text
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-[88px] w-full px-4 bg-gradient-to-t from-light via-light to-transparent pb-2 pt-6">
        {messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 px-1">
            {suggestions.map((s, i) => (
              <button 
                key={i} onClick={() => sendMsg(s)}
                className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-textSecondary hover:border-primary hover:text-primary transition-colors shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <div className="bg-white rounded-3xl p-2 flex items-end gap-2 shadow-lg border border-gray-100">
          <button className="p-3 text-gray-400 hover:text-primary transition-colors">
            <MicrophoneIcon className="w-6 h-6" />
          </button>
          <textarea 
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 text-sm text-textPrimary placeholder-gray-400"
            placeholder="Message AgriNex AI..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMsg();
              }
            }}
          />
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className={`p-3 rounded-full flex items-center justify-center transition-colors ${input.trim() ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-gray-100 text-gray-400'}`}
            onClick={() => sendMsg()}
            disabled={!input.trim()}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
""")

print("Frontend UI redesign script generated.")
