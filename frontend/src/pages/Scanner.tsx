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
  Loader2,
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';
import api from '../api/client';
import ImageCropperModal from '../components/ImageCropperModal';
import PageHeader from '../components/ui/PageHeader';

const tabs = [
  { key: 'symptoms', label: 'Symptoms', icon: '🔍' },
  { key: 'treatment', label: 'Treatment', icon: '💊' },
  { key: 'prevention', label: 'Prevention', icon: '🛡️' },
  { key: 'organic', label: 'Organic Remedy', icon: '🌱' },
];

const getSeverityBadge = (severity?: string) => {
  const s = (severity || 'Healthy').toLowerCase();
  if (s.includes('healthy')) return { label: 'Healthy Foliage', cls: 'bg-green-100 text-[#185C2B] border-green-200' };
  if (s.includes('low')) return { label: 'Low Severity', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (s.includes('moderate')) return { label: 'Moderate Severity', cls: 'bg-orange-100 text-orange-800 border-orange-200' };
  return { label: 'Severe Infection', cls: 'bg-red-100 text-red-800 border-red-200' };
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

  // Safe confidence extraction (scale to 0-100)
  const getRawConfidence = (res: any) => {
    if (!res || res.confidence === undefined) return 0;
    const val = Number(res.confidence);
    return val <= 1 ? Math.round(val * 100) : Math.round(val);
  };

  const confidencePct = result ? getRawConfidence(result) : 0;
  const isReliable = confidencePct >= 50; // Critical diagnostic threshold

  const badge = result && isReliable ? getSeverityBadge(result.severity_level) : null;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── PAGE HEADER ─── */}
      <PageHeader
        title="AI Crop Diagnostic Lab"
        description="Upload foliage images for real-time PyTorch deep learning pathogen analysis and curative action plans."
        icon={<Microscope className="w-7 h-7" />}
        badgeText="PyTorch ML Model Ready"
        action={
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF3E8] border border-[#E0E7D8] text-xs font-bold text-[#185C2B]">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-ping" />
            <span>Vision Engine Active</span>
          </div>
        }
      />

      {/* ─── DIAGNOSTIC WORKSPACE GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-start">
        {/* LEFT PANEL: Upload / Preview */}
        <div className="farm-card p-6 sm:p-7 space-y-5">
          <h2 className="text-base font-black text-[#123B24] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#185C2B]" />
            <span>Upload Leaf / Plant Specimen</span>
          </h2>

          {!image ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-4 cursor-pointer ${
                dragOver
                  ? 'border-[#185C2B] bg-[#EEF3E8]'
                  : 'border-[#E0E7D8] bg-[#F5F7EF] hover:bg-[#EEF3E8]/60'
              }`}
            >
              <div className="w-20 h-20 rounded-full border border-[#E0E7D8] bg-white flex items-center justify-center shadow-sm">
                <Leaf className="w-9 h-9 text-[#185C2B]" />
              </div>

              <div>
                <h3 className="text-base font-black text-[#123B24]">Drag crop image here</h3>
                <p className="text-xs text-[#5B7065] mt-1 font-medium">Supports JPG, PNG, WEBP up to 8MB</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
                <label className="btn-primary flex-1 py-3 text-center cursor-pointer text-xs font-bold rounded-xl shadow-sm">
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
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
                  <span>Choose File</span>
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
            <div className="space-y-4">
              {/* Image Container — Strict Aspect Ratio Preservation (`object-contain`) */}
              <div className="relative rounded-2xl overflow-hidden bg-[#123B24] max-h-[360px] flex items-center justify-center border border-[#E0E7D8]">
                <img
                  src={image}
                  alt="Crop preview"
                  className="w-full h-full object-contain max-h-[360px]"
                />

                {/* Scan animation sweep overlay */}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[#123B24]/40 backdrop-blur-[2px]" />
                    <div className="animate-scan-line" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                      <Loader2 className="w-8 h-8 text-[#80B918] animate-spin" />
                      <div className="text-center">
                        <p className="text-sm font-black">Analyzing foliage pathology...</p>
                        <p className="text-xs text-[#A7D96A]">Evaluating crop disease vectors</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={scanning}
                  className="px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="btn-primary flex-1 py-3 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#80B918]" />
                  <span>{scanning ? 'Analyzing Crop...' : 'Start AI Diagnosis'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Results or Safety Warning */}
        <div>
          {!result && !scanning && (
            <div className="farm-card p-10 text-center space-y-4 py-24 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-3xl text-[#185C2B]">
                <Leaf className="w-8 h-8 text-[#185C2B]" />
              </div>
              <h3 className="text-base font-black text-[#123B24]">Awaiting Foliage Upload</h3>
              <p className="text-xs text-[#5B7065] max-w-xs leading-relaxed font-medium">
                Upload or capture a leaf photo. The PyTorch vision model will detect symptoms and compute diagnostic confidence.
              </p>
            </div>
          )}

          {scanning && !result && (
            <div className="farm-card p-10 text-center space-y-4 py-24 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#185C2B] animate-spin" />
              <h3 className="text-base font-black text-[#123B24]">Running Pathology Analysis...</h3>
              <p className="text-xs text-[#5B7065]">Comparing against crop disease classes</p>
            </div>
          )}

          {/* ─── RESULT DISPLAY WITH CONFIDENCE PROTECTION ─── */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="farm-card p-6 sm:p-7 space-y-5"
            >
              {/* UNRELIABLE / LOW CONFIDENCE PROTECTION CARD */}
              {!isReliable ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <h3 className="text-base font-black">Unable to Make a Reliable Diagnosis</h3>
                    </div>
                    <p className="text-xs text-amber-800/90 leading-relaxed font-medium">
                      The uploaded image does not provide sufficient neural pattern confidence ({confidencePct}%) for a confirmed disease diagnosis.
                    </p>
                    <p className="text-xs text-amber-700 font-semibold italic">
                      Notice: The specimen may be outside the model's supported crop/disease set (e.g. non-crop flowers like Hibiscus) or the image may be blurry.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#EEF3E8]">
                    <h4 className="text-xs font-bold text-[#123B24]">Suggested Next Actions:</h4>
                    <ul className="text-xs text-[#5B7065] space-y-1.5 list-disc pl-4 font-medium">
                      <li>Upload a clearer, close-up photo of the affected crop leaf.</li>
                      <li>Ensure proper lighting and focus on leaf lesion edges.</li>
                      <li>Verify the specimen belongs to a supported agricultural crop.</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={clearImage}
                      className="btn-primary py-2.5 px-4 text-xs font-bold rounded-xl"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try Another Image</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CONFIRMED HIGH-CONFIDENCE DIAGNOSIS */
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#EEF3E8]">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#185C2B]">
                        Diagnostic Result
                      </span>
                      <h2 className="text-2xl font-black text-[#123B24] mt-0.5">
                        {result.disease_name}
                      </h2>
                      <p className="text-xs text-[#5B7065] font-semibold mt-0.5">
                        Target Crop: {result.crop_type || 'Agricultural Specimen'}
                      </p>
                    </div>
                    {badge && (
                      <span className={`px-3 py-1 rounded-full border font-bold text-xs ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#5B7065]">Model Confidence</span>
                      <span className="text-[#185C2B] font-black">{confidencePct}% Match</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EEF3E8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#80B918] to-[#185C2B]"
                        style={{ width: `${confidencePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Diagnostic Remedy Tabs */}
                  <div>
                    <div className="flex items-center gap-1 border-b border-[#EEF3E8] pb-2 overflow-x-auto no-scrollbar">
                      {tabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                            activeTab === tab.key
                              ? 'bg-[#123B24] text-white'
                              : 'text-[#5B7065] hover:bg-[#EEF3E8]'
                          }`}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 text-xs text-[#1A2E1A] leading-relaxed bg-[#F5F7EF] rounded-xl p-4 border border-[#EEF3E8] min-h-[90px]">
                      {activeTab === 'symptoms' && (
                        <p>{result.symptoms || 'Chlorotic spot patterns or leaf edge discoloration observed.'}</p>
                      )}
                      {activeTab === 'treatment' && (
                        <p>{result.treatment || 'Apply recommended systemic fungicide during early morning hours.'}</p>
                      )}
                      {activeTab === 'prevention' && (
                        <p>{result.prevention || 'Ensure proper row spacing and avoid overhead watering in afternoons.'}</p>
                      )}
                      {activeTab === 'organic' && (
                        <p>{result.organic_treatment || 'Apply 5% Neem Seed Kernel Extract (NSKE) spray.'}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#EEF3E8]">
                    <button
                      type="button"
                      onClick={() => alert('Report saved to your profile history.')}
                      className="btn-primary py-2 px-4 text-xs font-bold rounded-xl"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`AgriNex Diagnosis: ${result.disease_name} (${confidencePct}%)`);
                        alert('Copied to clipboard!');
                      }}
                      className="btn-outline-green py-2 px-4 text-xs font-bold rounded-xl"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="px-4 py-2 rounded-xl border border-[#EEF3E8] text-[#5B7065] font-bold text-xs hover:bg-[#EEF3E8] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Scan Again</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── PAST SCANS HISTORY ─── */}
      {pastScans.length > 0 && (
        <div className="farm-card p-6 space-y-4">
          <h3 className="text-base font-black text-[#123B24]">Diagnostic Scan History</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pastScans.map((scan, i) => (
              <div
                key={scan.id || i}
                className="p-3.5 rounded-xl border border-[#EEF3E8] bg-[#F5F7EF] space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-[#5B7065]">
                  <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#E0E7D8]">
                    {scan.severity_level || 'Evaluated'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#123B24] truncate">
                  {scan.disease_name}
                </h4>
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
