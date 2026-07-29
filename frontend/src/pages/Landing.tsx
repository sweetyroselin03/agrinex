import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Leaf, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  CheckCircle2
} from 'lucide-react';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-brandLight selection:text-brandDark overflow-x-hidden">
      
      {/* ─── NAVIGATION HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌱</span>
          <h1 className="text-xl font-extrabold tracking-tight text-brandDark">AgriNex <span className="text-primary">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-brandDark hover:bg-slate-50 transition-all">
            Sign In
          </Link>
          <Link to="/register" className="px-5 py-2.5 rounded-xl bg-brandDark text-white text-sm font-bold hover:bg-slate-800 shadow-sm transition-all">
            Get Started
          </Link>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brandLight rounded-full blur-[120px] -z-10 opacity-60" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-brandLight border border-primary/20 text-brandDark px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          The Future of Smart Agriculture is Here
        </motion.div>

        <motion.h1 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-brandDark max-w-4xl leading-[1.1] mb-6"
        >
          Empower Your Farming with <span className="text-primary">AI Intelligence</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-md sm:text-lg text-textSec max-w-2xl leading-relaxed mb-8"
        >
          Detect crop diseases in seconds, consult our smart AgriGPT assistant, and connect with a global community of modern farmers to maximize your yield.
        </motion.p>

        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <Link to="/register" className="px-8 py-4 rounded-xl bg-primary text-brandDark text-md font-extrabold hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 transition-all">
            Start Free Diagnostic
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#download" className="px-8 py-4 rounded-xl border border-slate-200 text-brandDark text-md font-bold hover:bg-slate-50 flex items-center justify-center gap-2 transition-all">
            <Smartphone className="w-5 h-5 text-slate-400" />
            Download Mobile App
          </a>
        </motion.div>

        {/* Dashboard Preview Frame */}
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4, type: "spring" }}
          className="w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white p-3"
        >
          <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 aspect-[16/9] flex flex-col justify-center items-center p-6 relative">
            {/* Mockup Elements */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white -z-10" />
            <div className="flex flex-col items-center">
              <span className="text-5xl mb-4 animate-float">🌾</span>
              <h3 className="text-xl font-bold text-brandDark">AgriNex Enterprise Platform</h3>
              <p className="text-textSec text-sm mt-1 max-w-md">Live weather metrics, smart crop diagnosis reports, real-time community boards, and chats integrated natively.</p>
            </div>
            {/* Visual indicators */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[11px] font-bold text-textSec uppercase tracking-widest border-t border-slate-200/50 pt-4">
              <span>📡 IoT Sensors Active</span>
              <span>⚡ Groq AI Engine</span>
              <span>🛡️ Secure Ledger</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── STATISTICS ─── */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "98.7%", label: "Scan Accuracy" },
            { value: "10k+", label: "Registered Farmers" },
            { value: "50k+", label: "Crops Scanned" },
            { value: "< 2s", label: "Analysis Time" }
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-brandDark">{stat.value}</h3>
              <p className="text-xs sm:text-sm text-textSec font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-brandDark tracking-tight mb-4">Complete Suite of AI Farming Tools</h2>
          <p className="text-textSec leading-relaxed">Everything a modern enterprise farmer needs to monitor soil conditions, prevent yield loss, and share real-time insights.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {[
            {
              icon: Leaf,
              title: "AI Disease Detection",
              desc: "Upload simple crop leaf photos to instantly identify blight, rust, pests, or nutrient deficiencies.",
              color: "text-emerald-500",
              bgColor: "bg-emerald-500/10"
            },
            {
              icon: MessageSquare,
              title: "AgriGPT Smart Chatbot",
              desc: "Get context-aware advice on irrigation, fertilizing schedules, and pest controls in multiple languages.",
              color: "text-sky-500",
              bgColor: "bg-sky-500/10"
            },
            {
              icon: Users,
              title: "Social Farmer Feed",
              desc: "Ask questions, comment on crop threads, share warnings, and like updates with farmers near you.",
              color: "text-purple",
              bgColor: "bg-purple/10"
            },
            {
              icon: TrendingUp,
              title: "Market Intelligence",
              desc: "Track global and local grain, fruit, and vegetable pricing trends to time your harvest and maximize sales.",
              color: "text-amber-500",
              bgColor: "bg-amber-500/10"
            }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-brandDark mb-2">{item.title}</h3>
                <p className="text-textSec text-sm leading-relaxed flex-1">{item.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-brandDark tracking-tight mb-4">Three Steps to Protect Your Yield</h2>
            <p className="text-textSec text-sm">Getting started with AgriNex is completely free and requires zero hardware setup.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {[
              { step: "01", title: "Take a Photo", desc: "Take a picture of any plant or crop showing spots, yellowing, or abnormal symptoms." },
              { step: "02", title: "Let AI Analyze", desc: "Our deep learning models check the leaf contours and spot colors to determine matches." },
              { step: "03", title: "Get Treatment Plans", desc: "Receive prevention guidelines, organic cures, and pesticide tips immediately." }
            ].map((item, i) => (
              <div key={i} className="relative space-y-4">
                <div className="text-5xl font-black text-primary/20 leading-none">{item.step}</div>
                <h3 className="text-lg font-bold text-brandDark">{item.title}</h3>
                <p className="text-textSec text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DOWNLOAD & CTA SECTION ─── */}
      <section id="download" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="bg-brandDark rounded-3xl p-8 sm:p-16 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
          
          <div className="space-y-6 max-w-2xl relative z-10 text-center lg:text-left">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to Maximize Your Crop Output?
            </h2>
            <p className="text-slate-400 text-md sm:text-lg leading-relaxed">
              Create an account now to start scanning or consult our guides. Download the AgriNex app for direct push alert notifications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register" className="px-6 py-3.5 rounded-xl bg-primary text-brandDark font-extrabold hover:bg-emerald-400 shadow-md text-center transition-all">
                Sign Up Now
              </Link>
              <button className="px-6 py-3.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-750 text-center border border-slate-700 transition-all">
                Download for Android (APK)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 shrink-0 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 w-full sm:w-auto relative z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">Enterprise Standard Security</span>
            </div>
            {[
              "100% Encrypted Data Storage",
              "Render Cloud SLA uptime",
              "Secure authentication tokens"
            ].map((tip, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-50 border-t border-slate-100 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-brandDark">AgriNex AI</span>
          </div>
          <p className="text-xs text-textSec">
            &copy; {new Date().getFullYear()} AgriNex Inc. All rights reserved. Smart Farming. Better Future.
          </p>
        </div>
      </footer>

    </div>
  );
}
