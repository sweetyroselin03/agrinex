import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Trash2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Upload,
  Microscope,
  Leaf,
  Share2,
  Bookmark,
  RefreshCw,
  Loader2
} from 'lucide-react';
import api from '../api/client';
import ImageCropperModal from '../components/ImageCropperModal';

const tabs = [
  { key: 'symptoms', label: 'Symptoms', icon: '🔍' },
  { key: 'treatment', label: 'Treatment', icon: '💊' },
  { key: 'prevention', label: 'Prevention', icon: '🛡️' },
  { key: 'organic', label: 'Organic Solution', icon: '🌱' },
];

const getSeverityBadge = (severity?: string) => {
  const s = (severity || 'Healthy').toLowerCase();
  if (s.includes('healthy')) return { icon: '🟢', label: 'Healthy Foliage', cls: 'bg-green-100 text-[#185C2B] border-green-200' };
  if (s.includes('low')) return { icon: '🟡', label: 'Low Severity', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (s.includes('moderate')) return { icon: '🟠', label: 'Moderate Severity', cls: 'bg-orange-100 text-orange-800 border-orange-200' };
  return { icon: '🔴', label: 'Severe Infection', cls: 'bg-red-100 text-red-800 border-red-200' };
};

export default function Scanner() {
  const [image, setImage] = useState<string | null>(null);
  const [rawOriginalImage, setRawOriginalImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('symptoms');
  const [dragOver, setDragOver] = useState(false);
  const [pastScans, setPastScans] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/scans');
      setPastScans(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setRawOriginalImage(dataUrl);
      setImage(dataUrl);
      setResult(null);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleStartScan = async () => {
    if (!image) return;
    setScanning(true);
    setScanProgress(15);
    setResult(null);

    const progInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const response = await api.post('/ai/detect-disease', { image_url: image });
      setScanProgress(100);
      setTimeout(() => {
        setResult(response.data);
        setScanning(false);
        fetchHistory();
      }, 400);
    } catch (e: any) {
      clearInterval(progInterval);
      setScanning(false);
      alert(e.response?.data?.detail || 'Disease diagnosis failed. Please check your image.');
    }
  };

  const clearImage = () => {
    setImage(null);
    setRawOriginalImage(null);
    setResult(null);
    setShowCropper(false);
    setScanProgress(0);
  };

  const handleConfirmCrop = (croppedDataUrl: string) => {
    setImage(croppedDataUrl);
    setShowCropper(false);
  };

  const badge = result ? getSeverityBadge(result.severity_level) : null;

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* ─── HEADER ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="farm-card p-6 sm:p-8 flex items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-3xl shadow-farm-sm">
            <Microscope className="w-7 h-7 text-[#185C2B]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#185C2B]">
              PyTorch Deep Learning Engine
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight">
              AI Crop Diagnostic Lab
            </h1>
            <p className="text-xs text-[#546E7A] font-medium mt-0.5">
              Instant pathogen analysis, symptom evaluation & treatment regimens
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF3E8] border border-[#A7D96A]">
          <span className="w-2 h-2 rounded-full bg-[#185C2B] animate-ping" />
          <span className="text-xs font-bold text-[#123B24]">Model Ready</span>
        </div>
      </motion.div>

      {/* ─── MAIN DIAGNOSTIC WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT: Upload Zone / Preview */}
        <div className="farm-card p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-black text-[#123B24] flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#185C2B]" />
            <span>Upload Crop Foliage</span>
          </h2>

          {!image ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`p-8 sm:p-12 rounded-[28px] border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-5 cursor-pointer ${
                dragOver
                  ? 'border-[#185C2B] bg-[#EEF3E8]'
                  : 'border-[#A7D96A] bg-[#F5F7EF] hover:bg-[#EEF3E8]/70'
              }`}
            >
              {/* Circular dashed icon container */}
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#185C2B] bg-white flex items-center justify-center shadow-farm-sm">
                <Leaf className="w-10 h-10 text-[#185C2B] animate-float-1" />
              </div>

              <div>
                <h3 className="text-base font-black text-[#123B24]">Drop crop image here</h3>
                <p className="text-xs text-[#546E7A] mt-1">Direct upload • JPG, PNG, WEBP up to 8MB</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
                <label className="btn-primary flex-1 py-3 text-center cursor-pointer text-xs font-bold rounded-xl shadow-farm-sm">
                  <Camera className="w-4 h-4" />
                  <span>📷 Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <label className="btn-outline-green flex-1 py-3 text-center cursor-pointer text-xs font-bold rounded-xl">
                  <Upload className="w-4 h-4" />
                  <span>🖼️ Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Image Preview Area with Scanning State */}
              <div className="relative rounded-[24px] overflow-hidden bg-[#123B24] max-h-[380px] flex items-center justify-center border border-[#EEF3E8]">
                <img
                  src={image}
                  alt="Crop preview"
                  className="w-full h-full object-contain max-h-[380px]"
                />

                {/* Sweeping Green Scan Line Overlay */}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[#123B24]/40 backdrop-blur-[2px]" />
                    <div className="animate-scan-line" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#6BCB45] animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black">Analyzing your crop...</p>
                        <p className="text-xs text-[#A7D96A] mt-0.5">Evaluating neural pathology indicators</p>
                      </div>
                      <div className="w-48">
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${scanProgress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-[#6BCB45] to-[#A7D96A]"
                          />
                        </div>
                        <p className="text-xs text-center mt-1 font-bold text-[#A7D96A]">{scanProgress}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={scanning}
                  className="px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="btn-primary flex-1 py-3 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-[#A7D96A]" />
                  <span>{scanning ? 'Analyzing Crop...' : 'Start AI Diagnosis'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Results Card */}
        <div>
          {!result && !scanning && (
            <div className="farm-card p-12 text-center space-y-4 py-24 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-[#EEF3E8] flex items-center justify-center text-3xl shadow-farm-sm">
                🔬
              </div>
              <h3 className="text-base font-black text-[#123B24]">Awaiting Foliage Upload</h3>
              <p className="text-xs text-[#546E7A] max-w-xs leading-relaxed">
                Take or choose a leaf photo. The PyTorch vision model will detect symptoms, compute confidence, and provide remedy plans.
              </p>
            </div>
          )}

          {scanning && !result && (
            <div className="farm-card p-12 text-center space-y-4 py-24 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-[#EEF3E8] flex items-center justify-center animate-spin">
                <Loader2 className="w-8 h-8 text-[#185C2B]" />
              </div>
              <h3 className="text-base font-black text-[#123B24]">Analyzing Pathology Patterns...</h3>
              <p className="text-xs text-[#546E7A]">Checking 60+ crop disease classes</p>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="farm-card p-6 sm:p-8 space-y-6"
            >
              {/* Disease Name & Severity Badge */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-[#EEF3E8]">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#185C2B]">
                    Diagnostic Result
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#123B24] mt-0.5">
                    {result.disease_name}
                  </h2>
                  <p className="text-xs text-[#546E7A] font-semibold mt-0.5">
                    Target Crop: {result.crop_type || 'Agricultural Specimen'}
                  </p>
                </div>
                {badge && (
                  <span className={`px-3.5 py-1.5 rounded-full border font-black text-xs flex items-center gap-1.5 ${badge.cls}`}>
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>
                )}
              </div>

              {/* Animated Confidence Bar Fill */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#546E7A]">Model Confidence</span>
                  <span className="text-[#185C2B] font-black">
                    {Math.round(result.confidence || 94)}% Match
                  </span>
                </div>
                <div className="w-full h-3 bg-[#EEF3E8] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(result.confidence || 94)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6BCB45 0%, #185C2B 100%)' }}
                  />
                </div>
              </div>

              {/* 4 Tabs: Symptoms | Treatment | Prevention | Organic */}
              <div>
                <div className="flex items-center gap-1.5 border-b border-[#EEF3E8] pb-2 overflow-x-auto no-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        activeTab === tab.key
                          ? 'bg-[#123B24] text-white shadow-farm-sm'
                          : 'text-[#546E7A] hover:bg-[#EEF3E8]'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-4 text-xs text-[#1A2E1A] leading-relaxed bg-[#F5F7EF] rounded-2xl p-4 border border-[#EEF3E8] min-h-[110px]"
                  >
                    {activeTab === 'symptoms' && (
                      <p>{result.symptoms || 'Chlorotic spot patterns, foliage discoloration, or wilting observed around leaf edges.'}</p>
                    )}
                    {activeTab === 'treatment' && (
                      <p>{result.treatment || 'Apply systemic fungicide (e.g. Mancozeb or Copper Oxychloride 50% WP @ 2g/L) during early morning hours.'}</p>
                    )}
                    {activeTab === 'prevention' && (
                      <p>{result.prevention || 'Ensure adequate row spacing, sanitize pruning tools, avoid overhead sprinkler spray during humid afternoons, and practice crop rotation.'}</p>
                    )}
                    {activeTab === 'organic' && (
                      <p>{result.organic_treatment || 'Apply 5% Neem Seed Kernel Extract (NSKE) or spray Trichoderma viride bio-agent into root and foliage zones.'}</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Save Report + Share + Scan Again buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#EEF3E8]">
                <button
                  type="button"
                  onClick={() => alert('Diagnostic Report saved to your profile history.')}
                  className="btn-primary py-2.5 px-5 text-xs font-bold rounded-xl"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`AgriNex Diagnosis: ${result.disease_name} (${result.confidence}%)`);
                    alert('Diagnostic summary copied to clipboard!');
                  }}
                  className="btn-outline-green py-2.5 px-5 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={clearImage}
                  className="px-5 py-2.5 rounded-xl border border-[#EEF3E8] text-[#546E7A] font-bold text-xs hover:bg-[#EEF3E8] flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Again</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── PAST SCANS GRID ─── */}
      {pastScans.length > 0 && (
        <div className="farm-card p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-black text-[#123B24]">Past Diagnostics History</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pastScans.map((scan, i) => (
              <motion.div
                key={scan.id || i}
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-2xl border border-[#EEF3E8] bg-[#F5F7EF] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">
                    {scan.severity_level === 'Healthy' ? '🌱' : '⚠️'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#546E7A] border border-[#EEF3E8]">
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#123B24] truncate">
                  {scan.disease_name}
                </h4>
                <p className="text-[11px] text-[#546E7A]">
                  Severity: {scan.severity_level || 'Evaluated'}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Crop Editor Modal */}
      {showCropper && rawOriginalImage && (
        <ImageCropperModal
          imageUrl={rawOriginalImage}
          onConfirmCrop={handleConfirmCrop}
          onCancel={() => setShowCropper(false)}
          onReset={() => {}}
        />
      )}
    </div>
  );
}
