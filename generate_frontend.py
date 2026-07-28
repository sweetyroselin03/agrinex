import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

frontend_dir = r"c:\Users\trasr\OneDrive\Desktop\AGRI NEW 12_5\frontend\src"

create_file(f"{frontend_dir}/App.tsx", """
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HomeIcon, UsersIcon, CameraIcon, ChatBubbleBottomCenterTextIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Chatbot from './pages/Chatbot';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="bg-light min-h-screen font-sans flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Splash onComplete={() => {}} />} />
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/chat" element={<Chatbot />} />
        </Routes>

        {isAuthenticated && (
          <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-3 px-2 pb-6">
            <Link to="/dashboard" className="flex flex-col items-center text-gray-500 hover:text-primary">
              <HomeIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link to="/community" className="flex flex-col items-center text-gray-500 hover:text-primary">
              <UsersIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Community</span>
            </Link>
            <div className="flex flex-col items-center -mt-6">
              <div className="bg-primary p-4 rounded-full text-white shadow-lg">
                <CameraIcon className="w-6 h-6" />
              </div>
            </div>
            <Link to="/chat" className="flex flex-col items-center text-gray-500 hover:text-primary">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
              <span className="text-xs mt-1">AI Chat</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center text-gray-500 hover:text-primary">
              <UserCircleIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </nav>
        )}
      </div>
    </Router>
  );
}

export default App;
""")

create_file(f"{frontend_dir}/pages/Splash.tsx", """
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Splash({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
      navigate('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-primary">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-white text-center"
      >
        <h1 className="text-4xl font-bold tracking-wider mb-2">AgriNex AI</h1>
        <p className="text-accent text-sm">Empowering the future of farming</p>
      </motion.div>
    </div>
  );
}
""")

create_file(f"{frontend_dir}/pages/Login.tsx", """
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    try {
      await axios.post('https://agrinex-backend-c1ig.onrender.com/api/auth/otp/generate', { phone });
      setStep(2);
    } catch (e) {
      console.error(e);
      // For demo, assume success
      setStep(2);
    }
  };

  const handleVerify = async () => {
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
    <div className="p-6 h-screen flex flex-col justify-center bg-white">
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h2 className="text-3xl font-bold text-dark mb-2">Welcome Back</h2>
        <p className="text-gray-500 mb-8">Sign in to continue your journey</p>

        {step === 1 ? (
          <div className="space-y-4">
            <input 
              type="tel"
              placeholder="Mobile Number"
              className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button 
              onClick={handleSendOTP}
              className="w-full bg-primary text-white p-4 rounded-xl font-semibold shadow-lg hover:bg-opacity-90 transition-all"
            >
              Get OTP
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              type="text"
              placeholder="Enter OTP"
              className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary tracking-widest text-center text-xl"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button 
              onClick={handleVerify}
              className="w-full bg-primary text-white p-4 rounded-xl font-semibold shadow-lg hover:bg-opacity-90 transition-all"
            >
              Verify & Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
""")

create_file(f"{frontend_dir}/pages/Dashboard.tsx", """
import React from 'react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  return (
    <div className="p-4 h-full overflow-y-auto bg-light pb-24">
      <header className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-dark">Hello, Farmer</h1>
          <p className="text-sm text-gray-500">Your farm is looking good today</p>
        </div>
        <img src="https://i.pravatar.cc/100" alt="profile" className="w-12 h-12 rounded-full border-2 border-primary" />
      </header>

      <motion.div 
        className="glass-card bg-primary text-white p-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Weather Forecast</h3>
            <p className="text-3xl font-bold my-2">28°C</p>
            <p className="text-sm text-accent">Sunny • 10% Precipitation</p>
          </div>
          <div className="text-5xl">☀️</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div className="glass-card p-4 text-center" whileTap={{ scale: 0.95 }}>
          <div className="bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            🦠
          </div>
          <h4 className="font-semibold text-dark text-sm">Crop Scan</h4>
        </motion.div>
        <motion.div className="glass-card p-4 text-center" whileTap={{ scale: 0.95 }}>
          <div className="bg-highlight/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            🌾
          </div>
          <h4 className="font-semibold text-dark text-sm">Market Price</h4>
        </motion.div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-bold text-dark mb-3">Government Schemes</h3>
        <div className="glass-card p-4">
          <h4 className="font-semibold text-primary">PM Kisan Yojana</h4>
          <p className="text-sm text-gray-500 mt-1">Financial support of ₹6000 per year in 3 equal installments.</p>
          <button className="mt-3 text-sm font-semibold text-highlight">Apply Now →</button>
        </div>
      </div>
    </div>
  );
}
""")

create_file(f"{frontend_dir}/pages/Community.tsx", """
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function Community() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('https://agrinex-backend-c1ig.onrender.com/api/posts');
        setPosts(res.data);
      } catch (e) {
        setPosts([
          { id: 1, user_id: 1, content: "My tomato harvest this year! Looks promising. 🍅", created_at: new Date().toISOString() }
        ]);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-light pb-24">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 z-10">
        <h1 className="text-xl font-bold text-dark">Community</h1>
      </div>
      <div className="p-4 space-y-4">
        {posts.map((post: any) => (
          <motion.div key={post.id} className="glass-card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary rounded-full"></div>
              <div>
                <p className="font-semibold text-sm">User {post.user_id}</p>
                <p className="text-xs text-gray-400">Just now</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-3">{post.content}</p>
            <div className="flex gap-4 border-t border-gray-100 pt-3">
              <button className="flex items-center gap-1 text-gray-500 text-sm">
                <HeartIcon className="w-5 h-5" /> 24
              </button>
              <button className="flex items-center gap-1 text-gray-500 text-sm">
                <ChatBubbleLeftIcon className="w-5 h-5" /> 5
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
""")

create_file(f"{frontend_dir}/pages/Chatbot.tsx", """
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function Chatbot() {
  const [messages, setMessages] = useState<{id: number, text: string, is_ai: boolean}[]>([
    { id: 1, text: "Hello! I am AgriNex AI. How can I help you with your farm today?", is_ai: true }
  ]);
  const [input, setInput] = useState('');

  const sendMsg = async () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), text: input, is_ai: false };
    setMessages(prev => [...prev, newMsg]);
    const userText = input;
    setInput('');
    
    try {
      const res = await axios.post('https://agrinex-backend-c1ig.onrender.com/api/chat', { message: userText });
      setMessages(prev => [...prev, { id: Date.now() + 1, text: res.data.message, is_ai: true }]);
    } catch (e) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: "I'm offline right now, but make sure to water your crops!", is_ai: true }]);
      }, 1000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-light pb-20">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 z-10">
        <h1 className="text-xl font-bold text-dark">AgriNex AI Assistant</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <motion.div 
            key={m.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.is_ai ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.is_ai ? 'bg-white shadow-sm border border-gray-100 text-dark' : 'bg-primary text-white'}`}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 absolute bottom-16 w-full max-w-md">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none"
            placeholder="Ask about crops, weather..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMsg()}
          />
          <button 
            className="bg-primary text-white p-2 rounded-full w-10 h-10 flex items-center justify-center"
            onClick={sendMsg}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
""")

print("Frontend files generated.")
