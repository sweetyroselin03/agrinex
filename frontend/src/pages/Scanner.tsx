import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Camera, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  FileText,
  Activity,
  Check,
  AlertTriangle
} from 'lucide-react';
import api from '../api/client';

export default function Scanner() {
  const [image, setImage] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('symptoms');
  const [dragOver, setDragOver] = useState(false);

  // File selected handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Triggers backend disease detection
  const handleStartScan = async () => {
    if (!image) return;
    setScanning(true);
    setResult(null);

    try {
      const response = await api.post('/ai/detect-disease', { image_url: image });
      setResult(response.data);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Foliage diagnosis failed. Please check network and try again.');
    } finally {
      setScanning(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setFileSize(null);
    setResult(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8"
    >
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brandDark">AI Crop Diagnostic Scanner</h1>
        <p className="text-textSec text-sm mt-1">Upload a clear photograph of a crop leaf or stem to detect blight, pests, and deficiencies instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: UPLOADER & PREVIEW (7 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`glass-card p-6 flex flex-col items-center justify-center border-2 border-dashed min-h-[360px] relative overflow-hidden transition-all ${
              dragOver ? 'border-primary bg-brandLight/20' : 'border-slate-200 bg-white'
            }`}
          >
            {image ? (
              // Preview State
              <div className="w-full h-full flex flex-col items-center relative">
                <div className="relative rounded-xl overflow-hidden max-h-[300px] w-full border border-slate-100 bg-slate-50">
                  <img src={image} alt="Crop Upload" className="w-full h-full object-contain mx-auto" />
                  
                  {/* Pulsing Scan overlay line */}
                  {scanning && (
                    <motion.div 
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#00D98B] z-10"
                    />
                  )}
                </div>

                {/* Image Specs */}
                <div className="flex justify-between items-center w-full mt-4 text-xs font-semibold text-textSec">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Size: {fileSize}
                  </span>
                  <button 
                    onClick={clearImage}
                    className="text-rose hover:text-rose/85 flex items-center gap-1"
                    disabled={scanning}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              // Empty upload dropzone state
              <div className="text-center p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-brandLight text-primary flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-brandDark text-sm">Upload crop photograph</h3>
                <p className="text-textSec text-xs max-w-xs mt-2 leading-relaxed">
                  Drag and drop your JPEG/PNG leaf image here, or browse files on your computer. Max file size 5MB.
                </p>
                <label className="mt-6 px-6 py-2.5 rounded-xl bg-brandDark text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer">
                  Browse Files
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            )}
          </div>

          {/* Action Trigger button */}
          {image && !result && (
            <button
              onClick={handleStartScan}
              disabled={scanning}
              className="w-full py-4 rounded-xl bg-primary text-brandDark font-extrabold text-sm hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              {scanning ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Running Neural Analysis...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Analyze Foliage Health
                </>
              )}
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: RESULTS PANEL (5 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <AnimatePresence mode="wait">
            {!result && !scanning && (
              // Guides placeholder
              <motion.div 
                key="guide"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card p-6 space-y-6"
              >
                <h3 className="font-extrabold text-brandDark text-md flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-slate-400" />
                  How to Get Accurate Diagnoses
                </h3>
                <div className="space-y-4">
                  {[
                    { title: "Center the leaf", text: "Ensure the leaf or fruit fills at least 70% of the camera frame for focal accuracy." },
                    { title: "Avoid blur & glare", text: "Steady your camera and photograph under neutral light. Avoid hard shadows and direct sun flares." },
                    { title: "Pest vs Spot check", text: "Get close enough so the AI can capture spot contours and tiny pest shapes." }
                  ].map((tip, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-brandDark flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brandDark">{tip.title}</h4>
                        <p className="text-xs text-textSec leading-relaxed mt-0.5">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {scanning && (
              // Loading Skeleton
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-6 space-y-6 animate-pulse"
              >
                <div className="h-6 bg-slate-100 rounded w-2/3" />
                <div className="flex gap-4">
                  <div className="h-10 bg-slate-100 rounded-full w-10 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <div className="h-3.5 bg-slate-100 rounded w-full" />
                  <div className="h-3.5 bg-slate-100 rounded w-5/6" />
                  <div className="h-3.5 bg-slate-100 rounded w-4/5" />
                </div>
              </motion.div>
            )}

            {result && (
              // Results Display Card
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Result header banner */}
                <div className={`glass-card p-6 border ${
                  !result.is_valid_crop 
                    ? 'border-rose/20 bg-rose/5' 
                    : result.severity_level === 'Critical'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : 'border-emerald-500/20 bg-emerald-500/5'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          !result.is_valid_crop ? 'bg-rose' : result.severity_level === 'Critical' ? 'bg-amber-500' : 'bg-primary'
                        }`} />
                        <span className="text-[10px] text-textSec font-bold uppercase tracking-widest">
                          {result.detected_object || 'Unknown Plant'}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-brandDark tracking-tight">{result.disease_name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      !result.is_valid_crop
                        ? 'bg-rose/10 text-rose border-rose/20'
                        : result.severity_level === 'Critical'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}>
                      {result.severity_level || 'Warning'}
                    </span>
                  </div>

                  {result.is_valid_crop && (
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-textSec">
                        <span>AI MATCH CONFIDENCE</span>
                        <span className="text-brandDark">{Math.round(result.confidence)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tab layout details */}
                {result.is_valid_crop ? (
                  <div className="glass-card overflow-hidden">
                    {/* Tab Navigation header */}
                    <div className="flex border-b border-slate-100 text-xs font-bold text-textSec uppercase bg-slate-50/50">
                      {[
                        { key: 'symptoms', label: 'Symptoms' },
                        { key: 'treatment', label: 'Treatment' },
                        { key: 'prevention', label: 'Prevention' }
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setActiveTab(t.key)}
                          className={`flex-1 py-3.5 text-center border-b-2 transition-all ${
                            activeTab === t.key 
                              ? 'border-primary text-brandDark bg-white font-extrabold'
                              : 'border-transparent hover:text-brandDark hover:bg-slate-50'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content space */}
                    <div className="p-6 text-sm text-slate-700 space-y-4 leading-relaxed">
                      {activeTab === 'symptoms' && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-extrabold text-brandDark text-xs uppercase tracking-wider mb-1">Visual Symptoms</h4>
                            <p className="text-textSec text-xs">{result.symptoms || 'No symptoms specified.'}</p>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-brandDark text-xs uppercase tracking-wider mb-1">Primary Causes</h4>
                            <p className="text-textSec text-xs">{result.causes || 'No causes specified.'}</p>
                          </div>
                          {result.yield_impact && (
                            <div className="p-3 bg-slate-50 rounded-xl flex gap-2 border border-slate-100">
                              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                              <div>
                                <span className="font-bold text-brandDark text-xs">Yield Impact Estimate</span>
                                <p className="text-[11px] text-textSec mt-0.5">{result.yield_impact}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'treatment' && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-extrabold text-brandDark text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Check className="w-4 h-4 text-primary" /> Organic Remedies
                            </h4>
                            <p className="text-textSec text-xs">{result.organic_treatment || 'No organic remedies specified.'}</p>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-brandDark text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                              <ShieldAlert className="w-4 h-4 text-amber-500" /> Chemical Control
                            </h4>
                            <p className="text-textSec text-xs">{result.pesticide_recommendations || 'No chemical control specified.'}</p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'prevention' && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-extrabold text-brandDark text-xs uppercase tracking-wider mb-1">Prevention Guidelines</h4>
                            <p className="text-textSec text-xs">{result.prevention || 'No prevention guidelines specified.'}</p>
                          </div>
                          {result.prevention_tips && (
                            <div>
                              <h4 className="font-extrabold text-brandDark text-xs uppercase tracking-wider mb-1">Field Tips</h4>
                              <p className="text-textSec text-xs">{result.prevention_tips}</p>
                            </div>
                          )}
                          {result.estimated_recovery_time && (
                            <div className="p-3 bg-brandLight/50 rounded-xl flex gap-2 border border-primary/10">
                              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                              <div>
                                <span className="font-bold text-brandDark text-xs">Estimated Recovery Duration</span>
                                <p className="text-[11px] text-textSec mt-0.5">{result.estimated_recovery_time}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Rejection warning details card
                  <div className="glass-card p-6 border-rose/20 bg-rose/5 space-y-4">
                    <div className="flex gap-3">
                      <ShieldAlert className="w-6 h-6 text-rose shrink-0" />
                      <div>
                        <h4 className="font-bold text-rose text-sm">Image Scanning Rejected</h4>
                        <p className="text-xs text-textSec mt-1 leading-relaxed">
                          {result.rejection_reason || 'This photo does not contain a detectable crop or leaves. Please ensure your crop is clearly centered.'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-textSec border-t border-rose/10 pt-4 leading-relaxed">
                      <span className="font-bold text-brandDark uppercase tracking-wider block mb-1">Upload recommendations:</span>
                      • Center the plant leaf inside the photo frame.<br/>
                      • Clean dirt off the leaf before capturing.<br/>
                      • Capture high-resolution photo with daylight brightness.
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </motion.div>
  );
}
