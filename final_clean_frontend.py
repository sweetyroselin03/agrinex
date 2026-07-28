import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

frontend_dir = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend"

# 1. main.tsx
create_file(f"{frontend_dir}/src/main.tsx", """
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
""")

# 2. App.tsx
create_file(f"{frontend_dir}/src/App.tsx", """
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Scanner from './pages/Scanner';
import Chatbot from './pages/Chatbot';
import Schemes from './pages/Schemes';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Settings from './pages/Settings';

function AppRoutes() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        
        {/* Protected Routes inside MainLayout */}
        <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="community" element={<Community />} />
          <Route path="scan" element={<Scanner />} />
          <Route path="chat" element={<Chatbot />} />
          <Route path="schemes" element={<Schemes />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="bg-light min-h-screen font-sans flex flex-col max-w-[420px] mx-auto shadow-2xl overflow-hidden relative sm:border sm:border-gray-200">
        <AppRoutes />
      </div>
    </Router>
  );
}
""")

# 3. MainLayout.tsx
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
    { path: '/chat', label: 'AI Chat', IconOutline: ChatBubbleBottomCenterTextIcon, IconSolid: ChatSolid },
    { path: '/profile', label: 'Profile', IconOutline: UserCircleIcon, IconSolid: UserSolid },
  ];

  const hideNav = ['/scan', '/edit-profile', '/settings'].includes(location.pathname);

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <Outlet />
      </div>
      
      {!hideNav && (
        <div className="absolute bottom-6 w-full px-6 pointer-events-none z-50">
          <motion.nav 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/90 backdrop-blur-xl shadow-floating border border-white/40 rounded-[2rem] flex justify-around items-center py-4 px-2 pointer-events-auto"
          >
            {tabs.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
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
                  {isActive && <motion.div layoutId="nav-pill" className="absolute inset-0 bg-primary/10 rounded-2xl -z-10 scale-125" />}
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
      )}
    </div>
  );
}
""")

# 4. Splash.tsx
create_file(f"{frontend_dir}/src/pages/Splash.tsx", """
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/onboarding'), 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-dark to-slate-900 relative overflow-hidden"
    >
      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[80px]" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ repeat: Infinity, duration: 4, delay: 1 }} className="absolute w-72 h-72 bg-secondary/20 rounded-full blur-[60px] top-10 right-10" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center z-10 flex flex-col items-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-primary/30 flex items-center justify-center text-white text-4xl">🌿</motion.div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">AgriNex <span className="text-primary font-light">AI</span></h1>
        <p className="text-secondary/80 text-sm font-medium tracking-wide">Smart Farming Powered by AI</p>
      </motion.div>
    </motion.div>
  );
}
""")

# 5. Onboarding.tsx
create_file(f"{frontend_dir}/src/pages/Onboarding.tsx", """
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const slides = [
  { id: 1, title: "AI Crop Assistance", desc: "Detect diseases instantly and get expert recommendations.", icon: "🔍" },
  { id: 2, title: "Farmer Community", desc: "Connect with farmers, share tips, and grow together.", icon: "🤝" },
  { id: 3, title: "Government Subsidies", desc: "Stay updated with the latest schemes and apply easily.", icon: "🏛️" }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const nextStep = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else navigate('/login');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -100 }} className="h-full flex flex-col bg-light relative p-6">
      <div className="flex justify-end pt-4">
        <button onClick={() => navigate('/login')} className="text-textSecondary text-sm font-semibold hover:text-primary">Skip</button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.1, y: -20 }} transition={{ duration: 0.4 }} className="flex flex-col items-center">
            <div className="w-48 h-48 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-glass text-6xl">{slides[step].icon}</div>
            </div>
            <h2 className="text-2xl font-bold text-textPrimary mb-3">{slides[step].title}</h2>
            <p className="text-textSecondary px-4">{slides[step].desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-12 flex flex-col items-center gap-8">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextStep} className="w-full bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-2xl font-bold shadow-lg shadow-primary/25">
          {step === slides.length - 1 ? "Get Started" : "Next"}
        </motion.button>
      </div>
    </motion.div>
  );
}
""")

# 6. Login.tsx
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
    try {
      await axios.post('https://agrinex-backend-c1ig.onrender.com/api/auth/otp/generate', { phone });
    } catch (e) { console.warn("API Error, proceeding for UI demo"); }
    setStep(2);
  };

  const handleVerify = async () => {
    if (!otp) return;
    onLogin();
    navigate('/dashboard');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full flex flex-col justify-center bg-light relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-8 relative z-10 w-full">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">👋</div>
        <h2 className="text-3xl font-bold text-textPrimary mb-2">Welcome Back</h2>
        <p className="text-textSecondary text-sm mb-8">Sign in to your smart farm dashboard.</p>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block">Mobile Number</label>
                <input type="tel" placeholder="+91 98765 43210" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSendOTP} className="w-full bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-2xl font-semibold shadow-lg shadow-primary/25">Send OTP</motion.button>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block">Enter OTP</label>
                <input type="text" placeholder="• • • •" className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-[0.5em] text-center text-xl font-bold" value={otp} onChange={(e) => setOtp(e.target.value)} />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleVerify} className="w-full bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-2xl font-semibold shadow-lg shadow-primary/25">Verify & Login</motion.button>
              <button onClick={() => setStep(1)} className="w-full text-textSecondary text-sm font-medium hover:text-primary">Change Mobile Number</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
""")

# 7. Dashboard.tsx
create_file(f"{frontend_dir}/src/pages/Dashboard.tsx", """
import { motion } from 'framer-motion';
import { BellIcon, CloudIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Link to="/profile"><img src="https://i.pravatar.cc/150?img=11" alt="profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" /></Link>
          <div>
            <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Good Morning</p>
            <h1 className="text-xl font-bold text-textPrimary leading-tight">Ramesh Kumar</h1>
          </div>
        </div>
        <Link to="/notifications" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 relative">
          <BellIcon className="w-5 h-5 text-textPrimary" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-white"></span>
        </Link>
      </header>

      <div className="bg-gradient-to-br from-primary to-secondary rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h3 className="text-white/80 font-medium text-sm mb-1">Your Farm Weather</h3>
            <div className="flex items-end gap-2"><span className="text-5xl font-bold tracking-tighter">28°</span><span className="text-xl mb-1 font-medium">C</span></div>
            <p className="text-white/90 text-sm mt-2 font-medium">Partly Cloudy • Pune</p>
          </div>
          <div className="text-5xl drop-shadow-md">⛅</div>
        </div>
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/20 relative z-10">
          <div className="flex items-center gap-2"><CloudIcon className="w-5 h-5 text-white/80" /><span className="text-sm font-medium">10% Rain</span></div>
          <div className="flex items-center gap-2"><CloudIcon className="w-5 h-5 text-white/80" /><span className="text-sm font-medium">12 km/h</span></div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-textPrimary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/scan" className="glass-card p-5 group block">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"><span className="text-2xl">🦠</span></div>
            <h4 className="font-bold text-textPrimary mb-1">Crop Scan</h4>
            <p className="text-xs text-textSecondary font-medium">Detect diseases</p>
          </Link>
          <Link to="/chat" className="glass-card p-5 group block">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4"><span className="text-2xl">🤖</span></div>
            <h4 className="font-bold text-textPrimary mb-1">AI Advisor</h4>
            <p className="text-xs text-textSecondary font-medium">Ask anything</p>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-textPrimary">Subsidies</h3>
          <Link to="/schemes" className="text-sm font-semibold text-primary">View All</Link>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-accent flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-textPrimary text-base">PM Kisan Yojana</h4>
            <span className="bg-green-100 text-primary text-[10px] px-2 py-1 rounded-full font-bold uppercase">Active</span>
          </div>
          <p className="text-sm text-textSecondary leading-relaxed">Financial benefit of ₹6000 per year.</p>
        </div>
      </div>
    </motion.div>
  );
}
""")

# 8. Community.tsx
create_file(f"{frontend_dir}/src/pages/Community.tsx", """
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HeartIcon, ChatBubbleOvalLeftIcon, ShareIcon } from '@heroicons/react/24/outline';

export default function Community() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('https://agrinex-backend-c1ig.onrender.com/api/posts');
        setPosts(res.data.length ? res.data : getDefaultPosts());
      } catch (e) { setPosts(getDefaultPosts()); }
    };
    fetchPosts();
  }, []);

  const getDefaultPosts = () => [
    { id: 1, user_id: 1, name: "Kisan Network", content: "Organic farming yielding great results this season! 🌾✨", likes: 234, comments: 45, image: "https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80&w=800" },
    { id: 2, user_id: 2, name: "Anita Devi", content: "Can anyone suggest the best pesticide for tomato leaf curl? 🍅", likes: 12, comments: 8 }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-light">
      <div className="pt-8 pb-4 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-bold text-textPrimary">Community</h1>
        <button className="bg-primary/10 text-primary w-8 h-8 rounded-full font-bold">+</button>
      </div>
      <div className="px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
        <div className="flex flex-col items-center gap-1 min-w-max">
          <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-2xl">+</div>
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
      <div>
        {posts.map((post, idx) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white mb-3 shadow-sm sm:rounded-2xl sm:mx-4 sm:mt-4 sm:border sm:border-gray-100 border-y border-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`https://i.pravatar.cc/150?img=${post.user_id + 10}`} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-sm text-textPrimary">{post.name || `User ${post.user_id}`}</h4>
                  <p className="text-xs text-textSecondary">2 hrs ago</p>
                </div>
              </div>
            </div>
            <p className="px-4 pb-3 text-sm text-textPrimary leading-relaxed">{post.content}</p>
            {post.image && <div className="w-full h-64 bg-gray-100"><img src={post.image} className="w-full h-full object-cover" /></div>}
            <div className="p-4 flex gap-6 border-t border-gray-50">
              <button className="flex items-center gap-2 group"><HeartIcon className="w-6 h-6 text-textSecondary group-hover:text-red-500" /><span className="text-sm font-semibold">{post.likes}</span></button>
              <button className="flex items-center gap-2 group"><ChatBubbleOvalLeftIcon className="w-6 h-6 text-textSecondary group-hover:text-primary" /><span className="text-sm font-semibold">{post.comments}</span></button>
              <button className="flex items-center gap-2 group"><ShareIcon className="w-6 h-6 text-textSecondary group-hover:text-primary" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
""")

# 9. Scanner.tsx
create_file(f"{frontend_dir}/src/pages/Scanner.tsx", """
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult({ disease: 'Early Blight', confidence: 92, severity: 'Medium', treatment: 'Use organic neem oil extract and copper-based fungicides.' });
    }, 2500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-dark flex flex-col relative">
      <div className="absolute top-6 left-6 z-10 bg-black/40 p-2 rounded-full backdrop-blur-md" onClick={() => navigate(-1)}>
        <XMarkIcon className="w-6 h-6 text-white" />
      </div>
      
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
        {!result ? (
          <>
            <div className="w-72 h-96 border-2 border-primary/50 rounded-3xl relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl m-2"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl m-2"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl m-2"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl m-2"></div>
              
              {scanning && <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="absolute w-full h-1 bg-primary shadow-[0_0_15px_#10B981] z-20" />}
              <p className="text-white/50 text-sm">Point camera at crop leaf</p>
            </div>
            
            <div className="absolute bottom-10 flex gap-6 items-center">
              <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md"><PhotoIcon className="w-6 h-6 text-white" /></button>
              <button onClick={handleScan} className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${scanning ? 'bg-primary' : 'bg-transparent'}`}>
                <div className="w-16 h-16 bg-white rounded-full"></div>
              </button>
              <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md"><CameraIcon className="w-6 h-6 text-white" /></button>
            </div>
          </>
        ) : (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-0 w-full bg-white rounded-t-[2rem] p-6 shadow-2xl z-30">
            <h3 className="text-2xl font-bold text-textPrimary mb-1">Analysis Complete</h3>
            <p className="text-textSecondary text-sm mb-4">AI found a match with {result.confidence}% confidence.</p>
            
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-red-700">{result.disease}</span>
                <span className="text-xs font-bold px-2 py-1 bg-red-200 text-red-800 rounded-full uppercase">Severity: {result.severity}</span>
              </div>
              <p className="text-sm text-red-900/80">{result.treatment}</p>
            </div>
            <button onClick={() => setResult(null)} className="w-full bg-gray-100 text-textPrimary p-4 rounded-xl font-bold mt-2">Scan Another</button>
          </motion.div>
        )}
      </div>
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
  const [messages, setMessages] = useState([{ id: 1, text: "Hello! I am AgriNex AI. Ask me about crops, fertilizers, or weather.", is_ai: true }]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMsg = async (textToSend: string = input) => {
    if (!textToSend.trim()) return;
    const newMsg = { id: Date.now(), text: textToSend, is_ai: false };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, text: "...", is_ai: true, isTyping: true } as any]);

    try {
      const res = await axios.post('https://agrinex-backend-c1ig.onrender.com/api/chat', { message: textToSend });
      setMessages(prev => prev.map(m => m.id === typingId ? { id: typingId, text: res.data.message, is_ai: true } : m));
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === typingId ? { id: typingId, text: "I'm offline right now.", is_ai: true } : m));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-light">
      <div className="pt-8 pb-4 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center gap-3 z-20 sticky top-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-sm"><SparklesIcon className="w-5 h-5" /></div>
        <div><h1 className="text-lg font-bold text-textPrimary">AgriNex AI</h1><p className="text-xs text-primary font-medium">Online</p></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${m.is_ai ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] p-4 text-sm leading-relaxed shadow-sm ${m.is_ai ? 'bg-white rounded-2xl rounded-tl-sm text-textPrimary border border-gray-100' : 'bg-primary rounded-2xl rounded-tr-sm text-white'}`}>
                {(m as any).isTyping ? <motion.div className="flex gap-1" animate="animate">{[0, 1, 2].map(i => <motion.div key={i} className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} />)}</motion.div> : m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="absolute bottom-0 w-full px-4 bg-gradient-to-t from-light via-light to-transparent pb-6 pt-6 z-30">
        <div className="bg-white rounded-3xl p-2 flex items-end gap-2 shadow-lg border border-gray-100">
          <textarea className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-sm text-textPrimary placeholder-gray-400 outline-none" placeholder="Message AgriNex AI..." rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(); } }} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`p-3 rounded-full flex items-center justify-center transition-colors ${input.trim() ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'}`} onClick={() => sendMsg()} disabled={!input.trim()}>
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
""")

# 11. Schemes.tsx
create_file(f"{frontend_dir}/src/pages/Schemes.tsx", """
import { motion } from 'framer-motion';

export default function Schemes() {
  const schemes = [
    { title: "PM Kisan Samman Nidhi", desc: "₹6000/year support.", status: "Active" },
    { title: "Kisan Credit Card (KCC)", desc: "Short term credit limit.", status: "Open" }
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full bg-light">
      <h1 className="text-2xl font-bold text-textPrimary mb-6 mt-4">Gov. Schemes</h1>
      <div className="space-y-4">
        {schemes.map((s, i) => (
          <div key={i} className="glass-card p-5 border-l-4 border-l-accent">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-textPrimary text-base">{s.title}</h4>
              <span className="bg-green-100 text-primary text-[10px] px-2 py-1 rounded-full font-bold uppercase">{s.status}</span>
            </div>
            <p className="text-sm text-textSecondary mb-4">{s.desc}</p>
            <button className="bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold text-textPrimary">Apply / Check</button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
""")

# 12. Notifications.tsx
create_file(f"{frontend_dir}/src/pages/Notifications.tsx", """
import { motion } from 'framer-motion';

export default function Notifications() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full bg-light">
      <h1 className="text-2xl font-bold text-textPrimary mb-6 mt-4">Notifications</h1>
      <div className="space-y-4">
        <div className="glass-card p-4 flex gap-4 items-center">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">🌦️</div>
          <div><h4 className="font-bold text-sm text-textPrimary">Rain Alert</h4><p className="text-xs text-textSecondary">Expected rainfall tomorrow at 4 PM.</p></div>
        </div>
      </div>
    </motion.div>
  );
}
""")

# 13. Profile.tsx
create_file(f"{frontend_dir}/src/pages/Profile.tsx", """
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cog6ToothIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export default function Profile() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-light">
      <div className="bg-gradient-to-b from-primary/20 to-light pt-10 pb-6 px-6 flex justify-between items-start">
        <h1 className="text-2xl font-bold text-textPrimary">Profile</h1>
        <Link to="/settings" className="p-2 bg-white rounded-full shadow-sm"><Cog6ToothIcon className="w-6 h-6 text-textPrimary" /></Link>
      </div>
      
      <div className="px-6 -mt-4">
        <div className="glass-card p-6 flex flex-col items-center relative text-center">
          <img src="https://i.pravatar.cc/150?img=11" alt="avatar" className="w-24 h-24 rounded-full border-4 border-white shadow-lg -mt-16 mb-4 object-cover" />
          <h2 className="text-xl font-bold text-textPrimary mb-1">Ramesh Kumar</h2>
          <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">Certified Farmer</span>
          
          <div className="flex gap-8 border-t border-gray-100 pt-4 w-full justify-center">
            <div className="text-center">
              <span className="block text-xl font-bold text-textPrimary">14</span>
              <span className="text-xs text-textSecondary">Scans</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-textPrimary">42</span>
              <span className="text-xs text-textSecondary">Posts</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-textPrimary">890</span>
              <span className="text-xs text-textSecondary">Followers</span>
            </div>
          </div>
        </div>
        
        <Link to="/edit-profile" className="mt-6 glass-card p-4 flex items-center justify-center gap-2 w-full text-textPrimary font-semibold hover:bg-gray-50 transition-colors">
          <PencilSquareIcon className="w-5 h-5" /> Edit Profile Details
        </Link>
      </div>
    </motion.div>
  );
}
""")

# 14. EditProfile.tsx
create_file(f"{frontend_dir}/src/pages/EditProfile.tsx", """
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full bg-light">
      <div className="flex justify-between items-center mb-6 mt-4">
        <button onClick={() => navigate(-1)} className="font-semibold text-textSecondary">Cancel</button>
        <h1 className="text-xl font-bold text-textPrimary">Edit Profile</h1>
        <button onClick={() => navigate(-1)} className="font-semibold text-primary">Save</button>
      </div>
      <div className="space-y-4">
        <div><label className="text-xs font-bold text-textSecondary">Name</label><input type="text" defaultValue="Ramesh Kumar" className="w-full p-4 rounded-xl bg-white border border-gray-100 mt-1" /></div>
        <div><label className="text-xs font-bold text-textSecondary">Farm Location</label><input type="text" defaultValue="Pune, Maharashtra" className="w-full p-4 rounded-xl bg-white border border-gray-100 mt-1" /></div>
        <div><label className="text-xs font-bold text-textSecondary">Farm Size (Acres)</label><input type="text" defaultValue="5.2" className="w-full p-4 rounded-xl bg-white border border-gray-100 mt-1" /></div>
      </div>
    </motion.div>
  );
}
""")

# 15. Settings.tsx
create_file(f"{frontend_dir}/src/pages/Settings.tsx", """
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 h-full bg-light">
      <div className="flex items-center mb-6 mt-4 gap-4">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <h1 className="text-2xl font-bold text-textPrimary">Settings</h1>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-medium text-textPrimary">Language</div>
        <div className="p-4 border-b border-gray-100 font-medium text-textPrimary">Dark Mode</div>
        <div className="p-4 font-medium text-red-500" onClick={() => navigate('/login')}>Logout</div>
      </div>
    </motion.div>
  );
}
""")

print("Clean frontend generation complete.")
