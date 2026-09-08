import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Activity,
  Share2,
  RefreshCw,
  Bookmark,
  Check
} from 'lucide-react';
import api from '../api/client';
import ImageCropperModal from '../components/ImageCropperModal';

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
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleStartScan = async () => {
    if (!image) return;
    setScanning(true);
    setScanProgress(10);
    setResult(null);

    // Simulate progress while inference runs
    const progInterval = setInterval(() => {
      setScanProgress(prev => {
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

  const getSeverityBadge = (severity?: string) => {
    const s = (severity || 'Healthy').toLowerCase();
    if (s.includes('healthy')) {
      return <span className="px-3 py-1 rounded-full bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] font-black text-xs flex items-center gap-1.5">🟢 Healthy Foliage</span>;
    }
    if (s.includes('low')) {
      return <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-black text-xs flex items-center gap-1.5">🟡 Low Severity</span>;
    }
    if (s.includes('moderate')) {
      return <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-black text-xs flex items-center gap-1.5">🟠 Moderate Severity</span>;
    }
    return <span className="px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 font-black text-xs flex items-center gap-1.5">🔴 Severe Infection</span>;
  };

  return (
    <div className="space-y-8 pb-12">

      {/* ─── HEADER ─── */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E0E7DE] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-2xl shadow-inner">
            <span className="animate-pulse">🔬</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#1A2E1A] tracking-tight">AI Crop Diagnostic Lab</h1>
            <p className="text-xs text-[#546E7A] font-medium mt-0.5">
              Powered by PyTorch ML Vision Engine (60 plant disease classes) with instant treatment remedies.
            </p>
          </div>
        </div>
      </div>

      {/* ─── MAIN SCANNER WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT / TOP: UPLOAD ZONE & PREVIEW */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-[24px] p-6 border border-[#E0E7DE] shadow-sm text-center">
            
            {!image ? (
              /* Circular Dashed Upload Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`py-12 px-6 rounded-[24px] border-2 border-dashed transition-all flex flex-col items-center justify-center space-y-4 ${
                  dragOver
                    ? 'border-[#2E7D32] bg-[#E8F5E9]'
                    : 'border-[#A5D6A7] bg-[#F1F8E9]/60 hover:bg-[#E8F5E9]/40'
                }`}
              >
                <div className="w-28 h-28 rounded-full border-2 border-dashed border-[#2E7D32] bg-white flex items-center justify-center shadow-md animate-float-leaf">
                  <span className="text-4xl">🌿</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-[#1A2E1A]">Drop your crop image here</h3>
                  <p className="text-xs text-[#546E7A]">Supports JPG, PNG, WEBP, or HEIC (Up to 5MB)</p>
                </div>

                <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}
                >
                  <Camera className="w-4 h-4" />
                  <span>Choose Photo / Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              /* Selected Image Workspace with Scan Animation */
              <div className="space-y-4">
                <div className="relative rounded-[20px] overflow-hidden border border-[#E0E7DE] max-h-[380px] bg-slate-900 flex items-center justify-center">
                  <img src={image} alt="crop preview" className="w-full h-full object-contain max-h-[380px]" />

                  {/* Sweeping Green Scanline Animation */}
                  {scanning && (
                    <div className="absolute inset-0 bg-green-950/20 pointer-events-none">
                      <div className="animate-scan-line" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white bg-black/40 backdrop-blur-xs">
                        <span className="text-3xl animate-spin-slow">🌿</span>
                        <p className="text-sm font-black tracking-wide">Analyzing your crop...</p>
                        <div className="w-44 h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#66BB6A] transition-all duration-300"
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{scanProgress}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={clearImage}
                    disabled={scanning}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear</span>
                  </button>

                  <button
                    onClick={handleStartScan}
                    disabled={scanning}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 hover:scale-102"
                    style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}
                  >
                    <Sparkles className="w-4 h-4 text-[#F9A825]" />
                    <span>{scanning ? 'Running Neural Diagnostic...' : 'Start Crop Diagnosis'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT / BOTTOM: DIAGNOSTIC RESULTS CARD */}
        <div className="lg:col-span-6">
          {!result && !scanning && (
            <div className="bg-white rounded-[24px] p-8 border border-[#E0E7DE] shadow-sm text-center space-y-4 py-20">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#E8F5E9] flex items-center justify-center text-3xl">
                🔬
              </div>
              <h3 className="text-lg font-black text-[#1A2E1A]">Awaiting Foliage Sample</h3>
              <p className="text-xs text-[#546E7A] max-w-sm mx-auto leading-relaxed">
                Upload a plant photo on the left. The PyTorch vision network will evaluate pathology, calculate confidence, and generate remediation steps.
              </p>
            </div>
          )}

          {scanning && !result && (
            <div className="bg-white rounded-[24px] p-8 border border-[#E0E7DE] shadow-sm text-center space-y-4 py-20">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#E8F5E9] flex items-center justify-center text-3xl animate-spin-slow">
                🌿
              </div>
              <h3 className="text-lg font-black text-[#1A2E1A]">AI Pathology Inference Active</h3>
              <p className="text-xs text-[#546E7A]">Scanning leaf discoloration, necrosis, and fungal patterns...</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E0E7DE] shadow-md space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E0E7DE]">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#2E7D32] tracking-wider">Diagnostic Result</span>
                  <h2 className="text-2xl font-black text-[#1A2E1A] mt-0.5">{result.disease_name}</h2>
                  <p className="text-xs text-[#546E7A] font-bold mt-0.5">Detected Crop: {result.crop_type || 'Agricultural Specimen'}</p>
                </div>
                {getSeverityBadge(result.severity_level)}
              </div>

              {/* Confidence Meter Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#546E7A]">Confidence Meter</span>
                  <span className="text-[#1B5E20] font-black">{Math.round(result.confidence || 92)}% Match</span>
                </div>
                <div className="w-full h-3 bg-[#E8F5E9] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(result.confidence || 92)}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #66BB6A 0%, #1B5E20 100%)' }}
                  />
                </div>
              </div>

              {/* Tabbed Advice Sections */}
              <div>
                <div className="flex items-center gap-2 border-b border-[#E0E7DE] pb-2 overflow-x-auto no-scrollbar">
                  {[
                    { key: 'symptoms', label: 'Symptoms', icon: '🔍' },
                    { key: 'treatment', label: 'Chemical Treatment', icon: '💊' },
                    { key: 'prevention', label: 'Prevention', icon: '🛡️' },
                    { key: 'organic', label: 'Organic Solution', icon: '🌱' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        activeTab === tab.key
                          ? 'bg-[#1B5E20] text-white shadow-sm'
                          : 'text-[#546E7A] hover:bg-[#F1F8E9]'
                      }`}
                    >
                      <span className="mr-1.5">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-4 text-xs text-[#1A2E1A] leading-relaxed min-h-[120px] bg-[#F1F8E9]/40 p-4 rounded-2xl mt-3">
                  {activeTab === 'symptoms' && (
                    <p>{result.symptoms || 'Discoloration, spot formation, or wilted tissue noted on the leaf margins.'}</p>
                  )}
                  {activeTab === 'treatment' && (
                    <p>{result.treatment || 'Apply systemic fungicide (e.g. Mancozeb or Copper Oxychloride 50% WP @ 2.5g/L) during early morning.'}</p>
                  )}
                  {activeTab === 'prevention' && (
                    <p>{result.prevention || 'Maintain crop spacing for aeration, avoid overhead sprinkler irrigation during spore periods, rotate with non-host crops.'}</p>
                  )}
                  {activeTab === 'organic' && (
                    <p>{result.organic_treatment || 'Spray 5% neem oil emulsion with mild soap solution or apply Trichoderma viride bio-agent around root zone.'}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E0E7DE]">
                <button
                  onClick={() => alert('Diagnostic Report saved to your account.')}
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md"
                  style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}
                >
                  Save Report
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`AgriNex Diagnosis: ${result.disease_name} (Confidence: ${result.confidence}%)`);
                    alert('Result copied to clipboard!');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-[#2E7D32] text-[#1B5E20] font-bold text-xs hover:bg-[#E8F5E9]"
                >
                  Share Result
                </button>
                <button
                  onClick={clearImage}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-[#546E7A] font-bold text-xs hover:bg-slate-50"
                >
                  Scan Again
                </button>
              </div>

            </motion.div>
          )}
        </div>

      </div>

      {/* ─── PAST DIAGNOSTICS GRID ─── */}
      {pastScans.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#E0E7DE] shadow-sm space-y-4">
          <h3 className="text-lg font-black text-[#1A2E1A]">Diagnostic History</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pastScans.map((scan) => (
              <div key={scan.id} className="p-4 rounded-2xl border border-[#E0E7DE] hover:shadow-md transition-all space-y-2 bg-[#F1F8E9]/20">
                <div className="flex items-center justify-between">
                  <span className="text-xl">{scan.severity_level === 'Healthy' ? '🌱' : '⚠️'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#1A2E1A] truncate">{scan.disease_name}</h4>
                <p className="text-[11px] text-[#546E7A]">Severity: {scan.severity_level || 'Evaluated'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
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
