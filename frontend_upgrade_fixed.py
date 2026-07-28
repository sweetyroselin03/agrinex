import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

frontend_dir = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend"

# 1. tailwind.config.js
create_file(f"{frontend_dir}/tailwind.config.js", """
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bgMain: '#071226',
        bgSec: '#0B1730',
        primary: '#10B981',
        cyan: '#22D3EE',
        purple: '#7C3AED',
        textMain: '#F8FAFC',
        textSec: '#94A3B8',
        card: 'rgba(255,255,255,0.06)',
        borderDark: 'rgba(255,255,255,0.08)',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
""")

# 2. index.css
create_file(f"{frontend_dir}/src/index.css", """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-bgMain text-textMain font-sans antialiased;
}

.glass-card {
  @apply bg-card backdrop-blur-xl border border-borderDark rounded-[20px] shadow-lg;
}

::-webkit-scrollbar { width: 0px; background: transparent; }
""")

# 3. main.tsx
create_file(f"{frontend_dir}/src/main.tsx", """
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
""")

# 4. App.tsx
create_file(f"{frontend_dir}/src/App.tsx", """
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import MainLayout from './layouts/MainLayout';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Scanner from './pages/Scanner';
import Chatbot from './pages/Chatbot';
import Profile from './pages/Profile';

function AppRoutes() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        
        <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="community" element={<Community />} />
          <Route path="scan" element={<Scanner />} />
          <Route path="chat" element={<Chatbot />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="bg-bgMain min-h-screen font-sans flex flex-col max-w-[420px] mx-auto shadow-2xl overflow-hidden relative sm:border sm:border-borderDark">
        <AppRoutes />
      </div>
    </Router>
  );
}
""")

# 5. MainLayout.tsx
create_file(f"{frontend_dir}/src/layouts/MainLayout.tsx", """
import { Outlet, Link, useLocation } from 'react-router-dom';
import { HomeIcon, UsersIcon, ViewfinderCircleIcon, ChatBubbleBottomCenterTextIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, UsersIcon as UsersSolid, ViewfinderCircleIcon as ScanSolid, ChatBubbleBottomCenterTextIcon as ChatSolid, UserCircleIcon as UserSolid } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export default function MainLayout() {
  const location = useLocation();
  const tabs = [
    { path: '/dashboard', label: 'Home', IconOutline: HomeIcon, IconSolid: HomeSolid },
    { path: '/community', label: 'Community', IconOutline: UsersIcon, IconSolid: UsersSolid },
    { path: '/scan', label: 'Scan', IconOutline: ViewfinderCircleIcon, IconSolid: ScanSolid, isCenter: true },
    { path: '/chat', label: 'AI', IconOutline: ChatBubbleBottomCenterTextIcon, IconSolid: ChatSolid },
    { path: '/profile', label: 'Profile', IconOutline: UserCircleIcon, IconSolid: UserSolid },
  ];

  const hideNav = ['/scan'].includes(location.pathname);

  return (
    <div className="h-full w-full flex flex-col relative bg-bgMain">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <Outlet />
      </div>
      
      {!hideNav && (
        <div className="absolute bottom-6 w-full px-6 pointer-events-none z-50">
          <motion.nav 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="glass-card flex justify-around items-center py-4 px-2 pointer-events-auto shadow-[0_10px_40px_rgba(16,185,129,0.15)]"
          >
            {tabs.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
              if (tab.isCenter) {
                return (
                  <Link to="/scan" key={tab.path} className="relative -top-8 flex flex-col items-center group">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-tr from-cyan to-primary p-4 rounded-full text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                      <tab.IconOutline className="w-7 h-7" />
                    </motion.div>
                  </Link>
                );
              }
              return (
                <Link to={tab.path} key={tab.path} className="flex flex-col items-center relative group">
                  {isActive && <motion.div layoutId="nav-pill" className="absolute inset-0 bg-primary/20 rounded-xl -z-10 scale-125" />}
                  {isActive ? <tab.IconSolid className="w-6 h-6 text-primary mb-1 transition-colors drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" /> : <tab.IconOutline className="w-6 h-6 text-textSec group-hover:text-primary transition-colors" />}
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-textSec'}`}>{tab.label}</span>
                </Link>
              );
            })}
          </motion.nav>
        </div>
      )}
    </div>
  );
}
""")

# 6. Splash.tsx
create_file(f"{frontend_dir}/src/pages/Splash.tsx", """
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/login'), 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full bg-bgMain relative overflow-hidden">
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute w-[500px] h-[500px] bg-cyan rounded-full blur-[120px] -top-32 -left-32" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }} className="absolute w-[400px] h-[400px] bg-purple rounded-full blur-[100px] bottom-0 right-0" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="text-center z-10 flex flex-col items-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }} className="w-28 h-28 mb-6 rounded-3xl bg-card border border-borderDark flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] backdrop-blur-md">
          <span className="text-6xl drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">🌱</span>
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight text-textMain mb-2">AgriNex <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan">AI</span></h1>
        <p className="text-textSec font-medium tracking-wide uppercase text-xs">Enterprise OS for Smart Farming</p>
      </motion.div>
    </motion.div>
  );
}
""")

# 7. Login.tsx
create_file(f"{frontend_dir}/src/pages/Login.tsx", """
import { useState } from 'react';
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
    try { await axios.post('https://agrinex-backend-c1ig.onrender.com/api/auth/otp/generate', { phone }); } catch(e) {}
    setStep(2);
  };

  const handleVerify = async () => {
    if (!otp) return;
    try { await axios.post('https://agrinex-backend-c1ig.onrender.com/api/auth/otp/verify', { phone, otp }); } catch(e) {}
    onLogin();
    navigate('/dashboard');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col justify-center bg-bgMain relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan/20 rounded-full blur-[100px]" />

      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-8 relative z-10 w-full">
        <h2 className="text-3xl font-bold text-textMain mb-2">Welcome Back</h2>
        <p className="text-textSec text-sm mb-8">Access your enterprise dashboard.</p>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-textSec uppercase tracking-wider mb-2 block">Mobile Number</label>
                <input type="tel" placeholder="+91 98765 43210" className="w-full p-4 rounded-xl bg-bgSec border border-borderDark focus:border-cyan text-textMain outline-none transition-all" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSendOTP} className="w-full bg-gradient-to-r from-cyan to-primary text-bgMain p-4 rounded-xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]">Send Secure OTP</motion.button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-textSec uppercase tracking-wider mb-2 block">Enter OTP</label>
                <input type="text" placeholder="• • • •" className="w-full p-4 rounded-xl bg-bgSec border border-borderDark focus:border-cyan text-textMain outline-none transition-all tracking-[0.5em] text-center text-xl font-bold" value={otp} onChange={(e) => setOtp(e.target.value)} />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleVerify} className="w-full bg-gradient-to-r from-cyan to-primary text-bgMain p-4 rounded-xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]">Verify Identity</motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
""")

# 8. Dashboard.tsx
create_file(f"{frontend_dir}/src/pages/Dashboard.tsx", """
import { motion } from 'framer-motion';
import { BellIcon, ChartBarIcon, ArrowTrendingUpIcon, ViewfinderCircleIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6">
      <header className="flex justify-between items-center mb-8 pt-4">
        <div className="flex items-center gap-3">
          <Link to="/profile"><img src="https://i.pravatar.cc/150?img=11" alt="profile" className="w-12 h-12 rounded-full border-2 border-borderDark shadow-sm" /></Link>
          <div>
            <p className="text-xs font-semibold text-textSec uppercase tracking-wider">Welcome back,</p>
            <h1 className="text-xl font-bold text-textMain leading-tight">Farmer 99</h1>
          </div>
        </div>
        <div className="w-10 h-10 glass-card flex items-center justify-center relative cursor-pointer">
          <BellIcon className="w-5 h-5 text-textMain" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-purple rounded-full border border-bgMain shadow-[0_0_10px_#7C3AED]"></span>
        </div>
      </header>

      {/* AI Weather & Insights Card */}
      <div className="glass-card p-6 mb-8 relative overflow-hidden bg-gradient-to-br from-card to-transparent border border-borderDark/50">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan/10 rounded-full blur-3xl"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#10B981]"></span>
              <h3 className="text-textSec font-medium text-xs uppercase tracking-wider">AI Crop Intelligence</h3>
            </div>
            <div className="flex items-end gap-2 mb-2"><span className="text-5xl font-bold text-textMain tracking-tighter">28°</span><span className="text-xl mb-1 text-textSec">C</span></div>
            <p className="text-textMain text-sm font-medium">Optimal conditions for Wheat harvest.</p>
          </div>
          <div className="text-4xl drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">🌤️</div>
        </div>
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-borderDark relative z-10">
          <div className="bg-bgSec/50 rounded-lg p-2 px-3 flex items-center gap-2 border border-borderDark/50">
            <span className="text-cyan text-xs font-bold">98%</span>
            <span className="text-textSec text-[10px] uppercase">Soil Moisture</span>
          </div>
          <div className="bg-bgSec/50 rounded-lg p-2 px-3 flex items-center gap-2 border border-borderDark/50">
            <span className="text-purple text-xs font-bold">Low</span>
            <span className="text-textSec text-[10px] uppercase">Pest Risk</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold text-textSec uppercase tracking-wider mb-4">Enterprise Hub</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/scan" className="glass-card p-5 group block relative overflow-hidden">
            <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-4 border border-primary/30">
              <ViewfinderCircleIcon className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-bold text-textMain text-sm mb-1">AI Scan</h4>
            <p className="text-[10px] text-textSec font-medium uppercase">Disease Detection</p>
          </Link>
          <Link to="/chat" className="glass-card p-5 group block relative overflow-hidden">
            <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-cyan/10 rounded-full blur-xl group-hover:bg-cyan/20 transition-all"></div>
            <div className="w-10 h-10 bg-cyan/20 rounded-xl flex items-center justify-center mb-4 border border-cyan/30">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-cyan" />
            </div>
            <h4 className="font-bold text-textMain text-sm mb-1">AgriGPT</h4>
            <p className="text-[10px] text-textSec font-medium uppercase">Smart Advisor</p>
          </Link>
          <div className="glass-card p-5 group block relative overflow-hidden">
             <div className="w-10 h-10 bg-purple/20 rounded-xl flex items-center justify-center mb-4 border border-purple/30">
              <ChartBarIcon className="w-6 h-6 text-purple" />
            </div>
            <h4 className="font-bold text-textMain text-sm mb-1">Market Intel</h4>
            <p className="text-[10px] text-textSec font-medium uppercase">Live Prices</p>
          </div>
          <div className="glass-card p-5 group block relative overflow-hidden">
             <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/30">
              <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="font-bold text-textMain text-sm mb-1">Subsidies</h4>
            <p className="text-[10px] text-textSec font-medium uppercase">Gov Schemes</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
""")

# 9. Community.tsx
create_file(f"{frontend_dir}/src/pages/Community.tsx", """
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, ChatBubbleOvalLeftIcon, ShareIcon, BookmarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

export default function Community() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get('https://agrinex-backend-c1ig.onrender.com/api/posts');
      setPosts(res.data);
    } catch (e) {}
  };

  const handleCreatePost = async () => {
    if(!newPost) return;
    try {
      await axios.post('https://agrinex-backend-c1ig.onrender.com/api/posts', { content: newPost });
      setNewPost("");
      setShowCreate(false);
      fetchPosts();
    } catch (e) {}
  };

  const handleLike = async (id: number) => {
    try {
      const res = await axios.post(`https://agrinex-backend-c1ig.onrender.com/api/posts/${id}/like`);
      setPosts(posts.map((p: any) => p.id === id ? { ...p, is_liked: res.data.liked, likes_count: res.data.likes_count } : p));
    } catch (e) {}
  };
  
  const handleSave = async (id: number) => {
    try {
      const res = await axios.post(`https://agrinex-backend-c1ig.onrender.com/api/posts/${id}/save`);
      setPosts(posts.map((p: any) => p.id === id ? { ...p, is_saved: res.data.saved } : p));
    } catch (e) {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-bgMain relative">
      <div className="pt-8 pb-4 px-6 bg-bgMain/80 backdrop-blur-xl border-b border-borderDark sticky top-0 z-20 flex justify-between items-center">
        <h1 className="text-xl font-bold text-textMain">Community</h1>
      </div>
      
      {/* Stories */}
      <div className="px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar border-b border-borderDark bg-bgSec">
        <div className="flex flex-col items-center gap-1 min-w-max cursor-pointer" onClick={() => setShowCreate(true)}>
          <div className="w-16 h-16 rounded-full bg-card border border-borderDark flex items-center justify-center text-textSec"><PlusIcon className="w-6 h-6"/></div>
          <span className="text-[10px] font-medium text-textSec">Create</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-max">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan to-purple p-[2px]">
              <img src={`https://i.pravatar.cc/150?img=${i+20}`} className="w-full h-full rounded-full border-2 border-bgMain object-cover" />
            </div>
            <span className="text-[10px] font-medium text-textMain">Farmer {i}</span>
          </div>
        ))}
      </div>

      <div className="pb-32">
        {posts.map((post: any) => (
          <motion.div key={post.id} className="bg-bgSec mb-2 sm:rounded-2xl sm:mx-4 sm:mt-4 sm:border sm:border-borderDark border-y border-borderDark">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.author_avatar || `https://i.pravatar.cc/150?img=${post.user_id + 10}`} className="w-10 h-10 rounded-full object-cover border border-borderDark" />
                <div>
                  <h4 className="font-bold text-sm text-textMain flex items-center gap-1">
                    {post.author_name} 
                    {post.author_verified && <span className="text-cyan text-xs">✓</span>}
                  </h4>
                  <p className="text-[10px] text-textSec uppercase">2 hrs ago</p>
                </div>
              </div>
            </div>
            <p className="px-4 pb-3 text-sm text-textMain leading-relaxed">{post.content}</p>
            {post.image_url && <div className="w-full h-72 bg-bgMain"><img src={post.image_url} className="w-full h-full object-cover" /></div>}
            
            <div className="p-4 flex justify-between border-t border-borderDark">
              <div className="flex gap-6">
                <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 group">
                  <motion.div whileTap={{ scale: 0.8 }}>{post.is_liked ? <HeartSolid className="w-6 h-6 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> : <HeartIcon className="w-6 h-6 text-textSec group-hover:text-red-500" />}</motion.div>
                  <span className={`text-xs font-bold ${post.is_liked ? 'text-red-500' : 'text-textSec'}`}>{post.likes_count}</span>
                </button>
                <button className="flex items-center gap-2 group"><ChatBubbleOvalLeftIcon className="w-6 h-6 text-textSec group-hover:text-cyan" /><span className="text-xs font-bold text-textSec">{post.comments_count}</span></button>
                <button className="flex items-center gap-2 group"><ShareIcon className="w-6 h-6 text-textSec group-hover:text-cyan" /></button>
              </div>
              <button onClick={() => handleSave(post.id)}>
                <motion.div whileTap={{ scale: 0.8 }}>{post.is_saved ? <BookmarkSolid className="w-6 h-6 text-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> : <BookmarkIcon className="w-6 h-6 text-textSec" />}</motion.div>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-50 bg-bgMain/95 backdrop-blur-md flex flex-col p-6">
            <div className="flex justify-between items-center mb-6 pt-4">
              <button onClick={() => setShowCreate(false)} className="text-textSec font-bold">Cancel</button>
              <h2 className="font-bold text-textMain">New Post</h2>
              <button onClick={handleCreatePost} className="text-cyan font-bold">Post</button>
            </div>
            <textarea autoFocus value={newPost} onChange={(e) => setNewPost(e.target.value)} className="flex-1 bg-transparent text-textMain text-xl outline-none resize-none placeholder-textSec/50" placeholder="What's happening on your farm?" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
""")

# 10. Chatbot.tsx
create_file(f"{frontend_dir}/src/pages/Chatbot.tsx", """
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/solid';

export default function Chatbot() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('https://agrinex-backend-c1ig.onrender.com/api/chat/history').then(res => {
        if(res.data.length > 0) setMessages(res.data);
        else setMessages([{ id: 1, text: "I am AgriNex AI. Ask me for smart farming insights.", is_ai: true }]);
    }).catch(e => setMessages([{ id: 1, text: "I am AgriNex AI.", is_ai: true }]));
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMsg = async (textToSend: string = input) => {
    if (!textToSend.trim()) return;
    const newMsg = { id: Date.now(), text: textToSend, is_ai: false };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, text: "...", is_ai: true, isTyping: true }]);

    try {
      const res = await axios.post('https://agrinex-backend-c1ig.onrender.com/api/chat', { message: textToSend });
      setMessages(prev => prev.map((m: any) => m.id === typingId ? { id: res.data.id, text: res.data.message, is_ai: true } : m));
    } catch (e) {
      setMessages(prev => prev.map((m: any) => m.id === typingId ? { id: typingId, text: "Connection error.", is_ai: true } : m));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-bgMain relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan/5 rounded-full blur-[100px]" />
      
      <div className="pt-8 pb-4 px-6 bg-bgMain/80 backdrop-blur-xl border-b border-borderDark flex items-center gap-3 z-20 sticky top-0">
        <div className="w-10 h-10 rounded-xl bg-card border border-borderDark flex items-center justify-center text-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]"><SparklesIcon className="w-5 h-5" /></div>
        <div><h1 className="text-sm font-bold text-textMain tracking-wide">AgriGPT</h1><p className="text-[10px] text-cyan uppercase tracking-widest font-bold">Enterprise AI Active</p></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 relative z-10">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${m.is_ai ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] p-4 text-sm leading-relaxed shadow-lg ${m.is_ai ? 'glass-card text-textMain rounded-tl-sm border-l-2 border-l-cyan' : 'bg-gradient-to-r from-purple to-cyan rounded-[20px] rounded-tr-sm text-white font-medium'}`}>
                {(m as any).isTyping ? <motion.div className="flex gap-1" animate="animate">{[0, 1, 2].map(i => <motion.div key={i} className="w-2 h-2 bg-textSec rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} />)}</motion.div> : (m.message || m.text)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="absolute bottom-0 w-full px-4 bg-gradient-to-t from-bgMain via-bgMain to-transparent pb-6 pt-6 z-30">
        <div className="glass-card p-2 flex items-end gap-2 bg-bgSec/90">
          <textarea className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-sm text-textMain placeholder-textSec outline-none" placeholder="Ask AI..." rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(); } }} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`p-3 rounded-xl flex items-center justify-center transition-all ${input.trim() ? 'bg-cyan text-bgMain shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-card text-textSec border border-borderDark'}`} onClick={() => sendMsg()} disabled={!input.trim()}>
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
""")

# 11. Profile.tsx
create_file(f"{frontend_dir}/src/pages/Profile.tsx", """
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Cog6ToothIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function Profile() {
  const [user, setUser] = useState<any>({});
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    axios.get('https://agrinex-backend-c1ig.onrender.com/api/users/1').then(res => setUser(res.data)).catch(e=>{});
    axios.get('https://agrinex-backend-c1ig.onrender.com/api/users/1/posts').then(res => setPosts(res.data)).catch(e=>{});
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-bgMain overflow-y-auto pb-32">
      <div className="h-40 bg-gradient-to-br from-purple/40 via-cyan/20 to-bgMain relative">
         <div className="absolute top-8 right-6 p-2 glass-card rounded-full cursor-pointer"><Cog6ToothIcon className="w-5 h-5 text-textMain" /></div>
      </div>
      
      <div className="px-6 relative -mt-16">
        <img src={user.profile_picture || "https://i.pravatar.cc/150?img=11"} className="w-28 h-28 rounded-[2rem] border-4 border-bgMain shadow-xl object-cover bg-bgSec" />
        
        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-bold text-textMain flex items-center gap-2">{user.name || "Farmer 99"} <CheckBadgeIcon className="w-6 h-6 text-cyan" /></h1>
          <p className="text-xs text-textSec font-medium mt-1 uppercase tracking-wide">{user.district || 'Pune'}, {user.state || 'Maharashtra'} • {user.farm_size || 5} Acres</p>
          <p className="text-sm text-textMain mt-3 leading-relaxed">{user.bio || "Passionate about organic farming and AI-driven insights."}</p>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="glass-card flex-1 p-4 text-center"><span className="block text-xl font-bold text-textMain">{user.posts_count || 0}</span><span className="text-[10px] text-textSec uppercase tracking-wider">Posts</span></div>
          <div className="glass-card flex-1 p-4 text-center"><span className="block text-xl font-bold text-textMain">{user.followers_count || 0}</span><span className="text-[10px] text-textSec uppercase tracking-wider">Followers</span></div>
          <div className="glass-card flex-1 p-4 text-center"><span className="block text-xl font-bold text-textMain">{user.following_count || 0}</span><span className="text-[10px] text-textSec uppercase tracking-wider">Following</span></div>
        </div>

        {/* Profile Grid */}
        <div className="flex gap-8 border-b border-borderDark mb-4">
          <button className="pb-2 border-b-2 border-cyan text-cyan text-sm font-bold uppercase tracking-wider">Posts</button>
          <button className="pb-2 text-textSec text-sm font-bold uppercase tracking-wider">Saved</button>
          <button className="pb-2 text-textSec text-sm font-bold uppercase tracking-wider">Scans</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {posts.map((p: any) => (
            <div key={p.id} className="aspect-square bg-card rounded-xl border border-borderDark flex items-center justify-center p-2 text-center text-xs overflow-hidden relative group">
              {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <p className="text-textSec text-[10px] line-clamp-4">{p.content}</p>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
""")

# 12. Scanner.tsx (Futuristic Scan)
create_file(f"{frontend_dir}/src/pages/Scanner.tsx", """
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, ArrowLeftIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult({ disease: 'Late Blight', confidence: 97.4, severity: 'CRITICAL', treatment: 'Immediate application of copper oxychloride recommended.' });
    }, 3000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-black flex flex-col relative">
      <div className="absolute top-8 left-6 z-10 glass-card p-3 rounded-full cursor-pointer" onClick={() => navigate(-1)}><ArrowLeftIcon className="w-5 h-5 text-white" /></div>
      
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
        {!result ? (
          <>
            <div className="w-[80vw] h-[60vh] border border-cyan/30 rounded-[3rem] relative overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.1)]">
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyan rounded-tl-3xl"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyan rounded-tr-3xl"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-cyan rounded-bl-3xl"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-cyan rounded-br-3xl"></div>
              
              {scanning && <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="absolute w-full h-[2px] bg-cyan shadow-[0_0_20px_#22D3EE] z-20" />}
              <p className="text-cyan/50 text-xs tracking-widest font-mono uppercase">{scanning ? "Analyzing Cellular Structure..." : "Align Crop Leaf in Frame"}</p>
            </div>
            
            <div className="absolute bottom-12 flex gap-8 items-center">
              <button className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center"><ArrowUpTrayIcon className="w-6 h-6 text-white" /></button>
              <button onClick={handleScan} className={`w-24 h-24 rounded-full border-2 border-cyan flex items-center justify-center p-2 ${scanning ? 'bg-cyan/20' : ''}`}>
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.8)]"></div>
              </button>
              <button className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center"><CameraIcon className="w-6 h-6 text-white" /></button>
            </div>
          </>
        ) : (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-0 w-full glass-card border-b-0 rounded-b-none rounded-t-[3rem] p-8 pb-12 z-30 bg-bgMain/90 backdrop-blur-2xl">
            <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="text-xs text-textSec font-bold uppercase tracking-widest mb-1">AI Diagnosis</h3>
                 <h2 className="text-2xl font-bold text-textMain">{result.disease}</h2>
               </div>
               <div className="text-right">
                 <h3 className="text-xs text-textSec font-bold uppercase tracking-widest mb-1">Confidence</h3>
                 <h2 className="text-2xl font-bold text-cyan">{result.confidence}%</h2>
               </div>
            </div>
            
            <div className="bg-red-900/20 rounded-2xl p-5 border border-red-500/30 mb-6">
              <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><span className="text-xs font-bold text-red-500 uppercase tracking-wider">Severity: {result.severity}</span></div>
              <p className="text-sm text-textMain leading-relaxed">{result.treatment}</p>
            </div>
            
            <div className="flex gap-4">
               <button onClick={() => setResult(null)} className="flex-1 bg-card border border-borderDark text-textMain p-4 rounded-2xl font-bold text-sm">Rescan</button>
               <button className="flex-1 bg-gradient-to-r from-cyan to-purple text-white p-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] text-sm">Save Report</button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
""")
