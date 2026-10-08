import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Microscope,
  Bot,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Leaf,
  Droplets,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  MessageSquare,
  Activity,
  Send
} from 'lucide-react';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [typedTextIndex, setTypedTextIndex] = useState(0);

  const sampleQuestions = [
    "What is the organic treatment for tomato leaf curl?",
    "Best fertilizer ratio for paddy rice tillering stage?",
    "How to manage high humidity fungal blight?"
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypedTextIndex((prev) => (prev + 1) % sampleQuestions.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7EF] font-sans selection:bg-[#A7D96A] selection:text-[#123B24] overflow-x-hidden">

      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass-nav py-3.5 shadow-farm-sm'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#123B24] flex items-center justify-center shadow-farm-sm">
              <span className="text-xl">🌱</span>
            </div>
            <div>
              <span className={`text-lg font-black tracking-tight ${scrolled ? 'text-[#123B24]' : 'text-white'}`}>
                AgriNex <span className="text-[#6BCB45]">AI</span>
              </span>
            </div>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold">
            <a
              href="#home"
              className={`transition-colors ${scrolled ? 'text-[#1A2E1A] hover:text-[#185C2B]' : 'text-white/90 hover:text-white'}`}
            >
              Home
            </a>
            <a
              href="#diagnosis"
              className={`transition-colors ${scrolled ? 'text-[#1A2E1A] hover:text-[#185C2B]' : 'text-white/90 hover:text-white'}`}
            >
              AI Diagnosis
            </a>
            <a
              href="#agrigpt"
              className={`transition-colors ${scrolled ? 'text-[#1A2E1A] hover:text-[#185C2B]' : 'text-white/90 hover:text-white'}`}
            >
              AgriGPT
            </a>
            <a
              href="#community"
              className={`transition-colors ${scrolled ? 'text-[#1A2E1A] hover:text-[#185C2B]' : 'text-white/90 hover:text-white'}`}
            >
              Community
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                scrolled
                  ? 'text-[#123B24] hover:bg-[#EEF3E8]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6BCB45] to-[#A7D96A] text-[#123B24] text-xs font-black shadow-farm-sm hover:shadow-glow-green transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section id="home" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-24 pb-20 px-6 sm:px-10">
        {/* Full-width cinematic farm background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80"
            alt="Cinematic lush green crop field"
            className="w-full h-full object-cover"
          />
          {/* Dark green gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#123B24]/90 via-[#123B24]/80 to-[#123B24]/95" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#123B24]/40 to-[#123B24]" />
        </div>

        {/* Floating Data Cards */}
        <div className="hidden lg:block absolute top-36 left-12 z-10 animate-float-1 pointer-events-none">
          <div className="floating-data-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF3E8] flex items-center justify-center text-lg text-[#185C2B]">
              🌱
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#546E7A] uppercase tracking-wider">CROP HEALTH</p>
              <p className="text-sm font-black text-[#185C2B]">94% Optimal</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute top-40 right-14 z-10 animate-float-2 pointer-events-none">
          <div className="floating-data-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg text-[#6FA8C9]">
              💧
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#546E7A] uppercase tracking-wider">SOIL MOISTURE</p>
              <p className="text-sm font-black text-[#123B24]">72% Adequate</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-24 left-16 z-10 animate-float-3 pointer-events-none">
          <div className="floating-data-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg text-[#F9A825]">
              🌡️
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#546E7A] uppercase tracking-wider">TEMPERATURE</p>
              <p className="text-sm font-black text-[#123B24]">28°C Optimal</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-28 right-16 z-10 animate-float-4 pointer-events-none">
          <div className="floating-data-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg text-[#6BCB45]">
              ⚠️
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#546E7A] uppercase tracking-wider">DISEASE RISK</p>
              <p className="text-sm font-black text-[#185C2B]">LOW • Protected</p>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-white/20 text-xs font-bold text-[#A7D96A] mb-6 shadow-farm-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6BCB45]" />
            <span>THE FUTURE OF SMART AGRICULTURE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6"
          >
            Empower Your Farming With <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6BCB45] via-[#A7D96A] to-[#6BCB45]">AI Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-[#EEF3E8]/90 max-w-2xl leading-relaxed mb-10 font-normal"
          >
            Detect crop diseases, consult an AI advisor, and connect with a farming community.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#6BCB45] to-[#A7D96A] text-[#123B24] font-black text-sm shadow-farm-md hover:shadow-glow-green flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Start Free Diagnostic</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-dark text-white border border-white/20 font-bold text-sm hover:bg-white/15 flex items-center justify-center gap-2 transition-all"
            >
              <span>Explore AgriNex</span>
              <ChevronRight className="w-4 h-4 text-[#A7D96A]" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="bg-white border-y border-[#EEF3E8] py-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#185C2B] shrink-0">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#123B24]">AI Diagnosis</h4>
              <p className="text-xs text-[#546E7A]">60+ Crop Pathologies</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#185C2B] shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#123B24]">Real-Time Insights</h4>
              <p className="text-xs text-[#546E7A]">Soil & Weather Analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#185C2B] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#123B24]">Farmer Community</h4>
              <p className="text-xs text-[#546E7A]">Agronomist Knowledge Share</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#185C2B] shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#123B24]">Crop Advisory</h4>
              <p className="text-xs text-[#546E7A]">Organic & Chemical Plans</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI DIAGNOSIS SECTION ─── */}
      <section id="diagnosis" className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image left with animated scan line */}
          <div className="relative rounded-[32px] overflow-hidden border border-[#EEF3E8] shadow-farm-lg group">
            <img
              src="https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=1200&q=80"
              alt="Detailed crop leaf foliage"
              className="w-full h-[420px] object-cover"
            />
            {/* Animated green scan line */}
            <div className="animate-scan-line" />
            <div className="absolute top-4 left-4 glass px-3.5 py-1.5 rounded-full text-xs font-bold text-[#123B24] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6BCB45] animate-ping" />
              <span>Vision Neural Network</span>
            </div>
            <div className="absolute bottom-4 right-4 glass px-4 py-2 rounded-2xl text-xs font-black text-[#123B24] shadow-farm-sm">
              🔬 98.4% Confidence Score
            </div>
          </div>

          {/* Text right */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF3E8] text-[#185C2B] text-xs font-black uppercase tracking-wider">
              <span>🔬</span> AI Vision Technology
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#123B24] tracking-tight leading-tight">
              Know Your Crop Before It's Too Late
            </h2>
            <p className="text-sm text-[#546E7A] leading-relaxed">
              Early detection makes the difference between a bumper harvest and total yield loss. Our neural vision model identifies subtle leaf discolorations, necrosis, mildew, and pest attacks in seconds.
            </p>

            <div className="space-y-3.5 pt-2">
              {[
                "Instant disease identification across 60+ plant types",
                "Graded severity scores: Healthy, Low, Moderate, Severe",
                "Organic home-prepared bio-fungicide remedies",
                "Precise chemical treatment dosages and spray schedules"
              ].map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#185C2B] shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-semibold text-[#1A2E1A]">{bullet}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                to="/register"
                className="btn-primary py-3.5 px-6 rounded-2xl text-xs font-bold inline-flex items-center gap-2"
              >
                <span>Try Crop Diagnosis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AGRIGPT SECTION ─── */}
      <section id="agrigpt" className="py-24 px-6 sm:px-10 bg-[#123B24] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=2000&q=80"
            alt="Farm landscape"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Left */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-dark text-[#A7D96A] text-xs font-black uppercase tracking-wider border border-white/10">
              <Bot className="w-4 h-4 text-[#6BCB45]" />
              <span>Smart Agricultural Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Your AI Agricultural Advisor
            </h2>
            <p className="text-sm sm:text-base text-[#EEF3E8]/80 leading-relaxed font-normal">
              Have questions about fertilizer ratios, pest cycles, or irrigation? AgriGPT is an agronomy specialist designed to answer complex farm questions in simple, actionable language.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="glass-dark p-4 rounded-2xl border border-white/10">
                <h4 className="text-xs font-black text-[#6BCB45]">🌾 Crop Nutrition</h4>
                <p className="text-[11px] text-[#EEF3E8]/70 mt-1">NPK ratios, micro-nutrients, and fertigation</p>
              </div>
              <div className="glass-dark p-4 rounded-2xl border border-white/10">
                <h4 className="text-xs font-black text-[#6BCB45]">🛡️ Integrated Pest Control</h4>
                <p className="text-[11px] text-[#EEF3E8]/70 mt-1">Organic neem sprays, bio-traps, and pesticides</p>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/register"
                className="btn-accent py-3.5 px-6 rounded-2xl text-xs font-black inline-flex items-center gap-2"
              >
                <span>Meet AgriGPT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Animated Chat Preview Card Right */}
          <div className="glass-dark p-6 rounded-[28px] border border-white/15 shadow-farm-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6BCB45] to-[#185C2B] flex items-center justify-center text-xl shadow-sm">
                  🤖
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">AgriGPT</h4>
                  <p className="text-[10px] text-[#6BCB45] font-bold">ACTIVE ADVISOR</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-white/80 font-bold">Live Stream</span>
            </div>

            {/* Simulated Conversation */}
            <div className="space-y-3 py-2">
              <div className="flex justify-end">
                <div className="bg-[#185C2B] text-white px-4 py-3 rounded-[18px_18px_4px_18px] text-xs font-medium max-w-[85%]">
                  {sampleQuestions[typedTextIndex]}
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-white text-[#1A2E1A] px-4 py-3.5 rounded-[18px_18px_18px_4px] text-xs leading-relaxed max-w-[90%] border-l-4 border-[#6BCB45] shadow-sm">
                  <p className="font-bold text-[#123B24] mb-1">🌿 AgriGPT Recommendation:</p>
                  <p>Apply 5% Neem Seed Kernel Extract (NSKE) spray early morning. Ensure proper soil potassium balance to reinforce leaf cellular walls.</p>
                </div>
              </div>
            </div>

            {/* Chat Input Mockup */}
            <div className="pt-2">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2.5 border border-white/15">
                <input
                  type="text"
                  placeholder="Ask about fertilizer, pest control, weather..."
                  readOnly
                  className="bg-transparent text-xs text-white placeholder-white/50 flex-1 outline-none"
                />
                <button className="w-7 h-7 rounded-full bg-[#6BCB45] text-[#123B24] flex items-center justify-center font-bold">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF3E8] text-[#185C2B] text-xs font-black uppercase tracking-wider">
            <span>✨</span> Built for Modern Farmers
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#123B24] tracking-tight">
            Everything Needed for Higher Yields
          </h2>
          <p className="text-sm text-[#546E7A]">
            A complete suite of smart agriculture software tools tailored for farmers, agronomists, and researchers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Microscope,
              title: "AI Crop Diagnosis",
              desc: "Instant disease detection from leaf photos with confidence scoring and treatment regimens.",
              color: "text-[#185C2B]",
              bg: "bg-[#EEF3E8]"
            },
            {
              icon: Bot,
              title: "AgriGPT Advisor",
              desc: "Multi-lingual intelligent farming chat assistant for irrigation, nutrition, and pest remedies.",
              color: "text-blue-700",
              bg: "bg-blue-50"
            },
            {
              icon: BarChart3,
              title: "Smart Farm Insights",
              desc: "Track field health trends, weather patterns, and seasonal crop recommendations.",
              color: "text-amber-700",
              bg: "bg-amber-50"
            },
            {
              icon: Users,
              title: "Farmer Community",
              desc: "Share knowledge, alert neighbors of disease outbreaks, and trade agricultural insights.",
              color: "text-emerald-700",
              bg: "bg-emerald-50"
            }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="farm-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-5 shadow-farm-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-[#123B24] mb-2">{feature.title}</h3>
                  <p className="text-xs text-[#546E7A] leading-relaxed">{feature.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#EEF3E8] flex items-center gap-1 text-xs font-bold text-[#185C2B]">
                  <span>Explore Feature</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── COMMUNITY SECTION ─── */}
      <section id="community" className="py-24 px-6 sm:px-10 bg-white border-t border-[#EEF3E8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF3E8] text-[#185C2B] text-xs font-black uppercase tracking-wider">
                <span>🌱</span> Nationwide Network
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#123B24] tracking-tight">
                Connect With a Thriving Farmer Community
              </h2>
              <p className="text-sm text-[#546E7A]">
                Exchange real-time field observations, crop price updates, and organic success stories with growers across the country.
              </p>
            </div>

            <Link
              to="/register"
              className="btn-primary py-3 px-6 rounded-xl text-xs font-bold shrink-0 inline-flex items-center gap-2"
            >
              <span>Join the Farmer Community</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Sample Community Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Ramesh Patil",
                location: "Maharashtra",
                crop: "Sugarcane & Cotton",
                avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ramesh",
                text: "Sprayed Trichoderma viride bio-fungicide last week. Root rot symptoms completely halted in my 4-acre field! 🌾",
                time: "2 hours ago"
              },
              {
                name: "Sunita Devi",
                location: "Punjab",
                crop: "Paddy & Wheat",
                avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sunita",
                text: "AgriGPT suggested shifting drip irrigation cycles to 6 AM. Saved nearly 30% water during this high-temperature week.",
                time: "5 hours ago"
              },
              {
                name: "Arun Kumar",
                location: "Karnataka",
                crop: "Tomato & Capsicum",
                avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Arun",
                text: "Scanner detected early blight at 96% confidence. Started copper oxychloride immediately before spores could spread to adjacent plots.",
                time: "1 day ago"
              }
            ].map((post, idx) => (
              <div key={idx} className="farm-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={post.avatar}
                    alt={post.name}
                    className="w-11 h-11 rounded-full border-2 border-[#6BCB45] object-cover bg-white"
                  />
                  <div>
                    <h4 className="text-sm font-black text-[#123B24]">{post.name}</h4>
                    <p className="text-[11px] text-[#546E7A] font-medium">{post.location} • {post.crop}</p>
                  </div>
                </div>
                <p className="text-xs text-[#1A2E1A] leading-relaxed font-medium">"{post.text}"</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#EEF3E8] text-[10px] font-bold text-[#546E7A]">
                  <span>{post.time}</span>
                  <span className="text-[#185C2B]">AgriNex Verified Farmer</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CALL TO ACTION ─── */}
      <section className="py-24 px-6 sm:px-10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto rounded-[36px] overflow-hidden relative shadow-farm-xl">
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80"
            alt="Golden harvest field"
            className="w-full h-[400px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#123B24]/95 via-[#185C2B]/90 to-[#123B24]/80" />

          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl leading-tight">
              Grow Smarter With AgriNex
            </h2>
            <p className="text-sm sm:text-base text-[#EEF3E8]/90 max-w-xl leading-relaxed font-normal">
              Join thousands of modern farmers utilizing artificial intelligence to safeguard crops and maximize profitability.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                to="/register"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#6BCB45] to-[#A7D96A] text-[#123B24] font-black text-sm shadow-farm-md hover:shadow-glow-green transition-all"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-2xl glass-dark text-white border border-white/20 font-bold text-sm hover:bg-white/10 transition-all"
              >
                Sign In to Platform
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-[#EEF3E8] py-12 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#123B24] flex items-center justify-center text-sm shadow-sm">
              🌱
            </div>
            <span className="text-base font-black text-[#123B24]">
              AgriNex <span className="text-[#6BCB45]">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold text-[#546E7A]">
            <a href="#home" className="hover:text-[#185C2B] transition-colors">Home</a>
            <a href="#diagnosis" className="hover:text-[#185C2B] transition-colors">AI Diagnosis</a>
            <a href="#agrigpt" className="hover:text-[#185C2B] transition-colors">AgriGPT</a>
            <a href="#community" className="hover:text-[#185C2B] transition-colors">Community</a>
            <Link to="/login" className="hover:text-[#185C2B] transition-colors">Sign In</Link>
          </div>

          <p className="text-xs text-[#546E7A]">
            &copy; {new Date().getFullYear()} AgriNex AI. Intelligence for Every Acre.
          </p>
        </div>
      </footer>

    </div>
  );
}
