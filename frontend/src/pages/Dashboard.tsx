import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Leaf, 
  MessageSquare, 
  Users, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [weather, setWeather] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingScans, setLoadingScans] = useState(true);

  // Fetch Weather & Scan History
  useEffect(() => {
    fetchWeatherData();
    fetchScanHistory();
  }, []);

  const fetchWeatherData = async (lat = 18.5204, lon = 73.8567) => {
    // Attempt navigator geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await api.get('/weather/current', {
              params: { lat: position.coords.latitude, lon: position.coords.longitude }
            });
            setWeather(res.data);
          } catch (e) {
            fallbackWeather();
          } finally {
            setLoadingWeather(false);
          }
        },
        () => {
          // Fallback to Pune coordinates if blocked
          fetchWeatherWithCoords(lat, lon);
        }
      );
    } else {
      fetchWeatherWithCoords(lat, lon);
    }
  };

  const fetchWeatherWithCoords = async (lat: number, lon: number) => {
    try {
      const res = await api.get('/weather/current', { params: { lat, lon } });
      setWeather(res.data);
    } catch (e) {
      fallbackWeather();
    } finally {
      setLoadingWeather(false);
    }
  };

  const fallbackWeather = () => {
    setWeather({
      temp: 31,
      feels_like: 34,
      condition: 'Partly Cloudy',
      humidity: 55,
      wind: 12,
      uv_index: 6.5,
      rain_probability: 20,
      location: 'Maharashtra, India',
      soil_moisture: 'Moderate — 45% moisture',
      farming_suitability: 'Good — Most field activities suitable',
      alerts: [{ type: 'good', severity: 'low', message: '✅ Favorable farming conditions today!', icon: 'CheckCircle' }],
      forecast: [
        { day: 'Mon', temp: 31, condition: 'Sunny', icon: 'Sun' },
        { day: 'Tue', temp: 30, condition: 'Cloudy', icon: 'Cloud' },
        { day: 'Wed', temp: 28, condition: 'Rain', icon: 'CloudRain' },
        { day: 'Thu', temp: 30, condition: 'Sunny', icon: 'Sun' },
        { day: 'Fri', temp: 32, condition: 'Partly Cloudy', icon: 'CloudSun' },
      ]
    });
  };

  const fetchScanHistory = async () => {
    try {
      const res = await api.get('/ai/scan-history', { params: { limit: 4 } });
      setScans(res.data);
    } catch (e) {
      console.warn('Failed to load scan history');
    } finally {
      setLoadingScans(false);
    }
  };

  // Mock data for analytics chart
  const analyticsData = [
    { name: 'Week 1', moisture: 42, scans: 2 },
    { name: 'Week 2', moisture: 55, scans: 4 },
    { name: 'Week 3', moisture: 48, scans: 1 },
    { name: 'Week 4', moisture: 60, scans: 5 },
    { name: 'Week 5', moisture: 58, scans: 3 },
    { name: 'Week 6', moisture: 68, scans: 6 },
    { name: 'Week 7', moisture: 75, scans: 4 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8"
    >
      
      {/* ─── WELCOME HEADER BANNER ─── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brandDark to-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#00D98B]" />
            <span className="text-xs text-primary font-bold uppercase tracking-widest">Enterprise Dashboard</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome, {user?.full_name || 'Farmer Partner'}
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            {user?.village ? `${user.village}, ${user.district}` : 'Ready to diagnose crop conditions and maximize harvest rates today.'}
          </p>
        </div>

        <Link to="/scan" className="relative z-10 shrink-0 self-start md:self-center px-6 py-3.5 rounded-xl bg-primary text-brandDark font-extrabold text-sm hover:bg-emerald-400 shadow-md flex items-center gap-2 transition-all">
          <Leaf className="w-4 h-4" />
          Launch Scan Camera
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* ─── QUICK ACTIONS GRID ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'AI Crop Diagnostic', link: '/scan', desc: 'Scan disease instantly', emoji: '🍂', color: 'border-emerald-500/20 text-emerald-600', iconBg: 'bg-emerald-50' },
          { label: 'Consult AgriGPT', link: '/chat', desc: 'Expert chatbot help', emoji: '🤖', color: 'border-sky-500/20 text-sky-600', iconBg: 'bg-sky-50' },
          { label: 'Community Feed', link: '/community', desc: 'Connect & share warnings', emoji: '👥', color: 'border-purple/20 text-purple', iconBg: 'bg-purple/10' },
          { label: 'Crop Alerts & Inbox', link: '/notifications', desc: 'View alerts & notifications', emoji: '🔔', color: 'border-amber-500/20 text-amber-600', iconBg: 'bg-amber-50' }
        ].map((action, i) => (
          <Link 
            key={i} 
            to={action.link} 
            className={`glass-card p-6 flex items-start gap-4 hover:-translate-y-1 hover:border-slate-350 border ${action.color} group transition-all`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${action.iconBg} group-hover:scale-110 transition-all shrink-0`}>
              {action.emoji}
            </div>
            <div>
              <h4 className="font-bold text-brandDark group-hover:text-primary transition-colors text-sm">{action.label}</h4>
              <p className="text-textSec text-xs mt-1">{action.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* ─── MIDDLE SPLIT: WEATHER VS ANALYTICS CHART ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Live Weather Widget */}
        <section className="lg:col-span-1 glass-card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] -z-10" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-extrabold text-brandDark text-md">Agri Weather Intelligence</h3>
              <p className="text-textSec text-xs flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {weather?.location || 'Maharashtra, India'}
              </p>
            </div>
            <span className="text-3xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
              {weather?.condition.includes('Rain') ? '🌧️' : weather?.condition.includes('Clear') ? '☀️' : '🌤️'}
            </span>
          </div>

          {loadingWeather ? (
            <div className="py-12 flex justify-center items-center text-textSec text-sm">
              <span className="animate-spin text-primary mr-2">🌱</span>
              Reading sensors...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-brandDark tracking-tighter">{weather?.temp}°</span>
                <span className="text-lg text-textSec font-semibold">C</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-textSec ml-2">
                  {weather?.condition}
                </span>
              </div>

              {/* Weather info grid */}
              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-textSec uppercase">Humidity</p>
                    <p className="text-brandDark">{weather?.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-textSec uppercase">Wind Speed</p>
                    <p className="text-brandDark">{weather?.wind} km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-textSec uppercase">Precipitation</p>
                    <p className="text-brandDark">{weather?.rain_probability}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-textSec uppercase">UV Index</p>
                    <p className="text-brandDark">{weather?.uv_index}</p>
                  </div>
                </div>
              </div>

              {/* Suitability warning */}
              <div className="p-3.5 rounded-xl bg-brandLight/65 border border-primary/10 flex items-start gap-2.5 text-xs text-slate-800">
                <CheckCircle className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-brandDark">Farming Suitability</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{weather?.farming_suitability}</p>
                </div>
              </div>

              {/* Soil Moisture */}
              <div className="text-xs">
                <span className="text-[10px] text-textSec font-bold uppercase tracking-wider block">Estimated Soil Moisture</span>
                <span className="font-bold text-brandDark mt-0.5 block">{weather?.soil_moisture}</span>
              </div>
            </div>
          )}
        </section>

        {/* Recharts Analytics Chart */}
        <section className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-brandDark text-md">Soil Moisture & Scan Trends</h3>
              <p className="text-textSec text-xs">Soil moisture saturation (%) compared against scan events</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Moisture</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> AI Scans</span>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D98B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00D98B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="moisture" stroke="#00D98B" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
                <Area type="monotone" dataKey="scans" stroke="#6366F1" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>

      {/* ─── BOTTOM SPLIT: RECENT DIAGNOSTIC SCANS ─── */}
      <section className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-extrabold text-brandDark text-md">Recent Diagnostic Scans</h3>
            <p className="text-textSec text-xs">View diagnostic history from your fields</p>
          </div>
          <Link to="/scan" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            New Scan
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingScans ? (
          <div className="py-12 flex justify-center items-center text-textSec text-sm">
            <span className="animate-spin text-primary mr-2">🌱</span>
            Loading scan history...
          </div>
        ) : scans.length === 0 ? (
          <div className="py-12 text-center text-textSec text-sm">
            No crop scans detected yet. Click "Launch Scan Camera" above to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scans.map((scan) => {
              const isInvalid = !scan.is_valid_crop;
              const dateStr = new Date(scan.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={scan.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col hover:shadow-md transition-all">
                  <div className="relative aspect-[4/3] bg-slate-150">
                    <img 
                      src={scan.image_url} 
                      alt="Crop Scan" 
                      className="w-full h-full object-cover"
                    />
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isInvalid 
                        ? 'bg-rose/10 text-rose border border-rose/25'
                        : scan.severity_level === 'Critical'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/25'
                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25'
                    }`}>
                      {isInvalid ? 'Invalid' : scan.severity_level || 'Alert'}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-brandDark text-sm truncate">{scan.disease_name}</h4>
                      <p className="text-[10px] text-textSec font-semibold uppercase tracking-wider mt-0.5">
                        {scan.detected_object || 'Plant Crop'}
                      </p>
                    </div>

                    <div className="border-t border-slate-50 pt-2 flex justify-between items-center text-[10px] font-medium text-textSec">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-350" />
                        {dateStr}
                      </span>
                      {!isInvalid && (
                        <span className="font-bold text-primary">
                          {Math.round(scan.confidence)}% conf
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </motion.div>
  );
}
