import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Video,
} from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  images,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const [index, setIndex] = useState(currentIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Sync index when currentIndex prop changes
  useEffect(() => {
    setIndex(currentIndex);
    setScale(1);
    setRotation(0);
    setIsLoading(true);
  }, [currentIndex]);

  const currentUrl = images[index] || '';

  const handleNext = useCallback(() => {
    if (index < images.length - 1) {
      const newIndex = index + 1;
      setIndex(newIndex);
      setScale(1);
      setRotation(0);
      setIsLoading(true);
      if (onNavigate) onNavigate(newIndex);
    }
  }, [index, images.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (index > 0) {
      const newIndex = index - 1;
      setIndex(newIndex);
      setScale(1);
      setRotation(0);
      setIsLoading(true);
      if (onNavigate) onNavigate(newIndex);
    }
  }, [index, onNavigate]);

  // Keyboard navigation & Shortcuts (ESC, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(prev + 0.25, 4));
      } else if (e.key === '-') {
        setScale((prev) => Math.max(prev - 0.25, 0.5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.2, 4));
    } else {
      setScale((prev) => Math.max(prev - 0.2, 0.5));
    }
  };

  // Double click zoom toggle
  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
    } else {
      setScale(2);
    }
  };

  // Download image helper
  const handleDownload = async () => {
    if (!currentUrl) return;
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = currentUrl.substring(currentUrl.lastIndexOf('/') + 1) || 'agrinex-image.jpg';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(currentUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md select-none font-sans"
        onClick={onClose}
      >
        {/* Top Control Bar */}
        <div
          className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-slate-950/90 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 text-white/90 text-sm font-semibold">
            <span>
              {index + 1} / {images.length}
            </span>
            <span className="hidden sm:inline-block text-white/40">|</span>
            <span className="hidden sm:inline-block max-w-xs truncate text-xs text-white/70">
              {currentUrl.split('/').pop() || 'Image Preview'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.min(s + 0.25, 4))}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setScale(1);
                setRotation(0);
              }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md ml-1"
              title="Download Image"
              aria-label="Download Image"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all ml-2 shadow-md"
              title="Close (ESC)"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Previous Button */}
        {images.length > 1 && index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-all backdrop-blur-md shadow-xl"
            title="Previous Image"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && index < images.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 transition-all backdrop-blur-md shadow-xl"
            title="Next Image"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Main Image/Video Container */}
        <div
          className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
          )}
          {currentUrl && (currentUrl.startsWith('data:video/') || currentUrl.includes('.mp4') || currentUrl.startsWith('blob:video/') || (currentUrl.startsWith('blob:') && currentUrl.includes('video'))) ? (
            <motion.video
              key={currentUrl}
              src={currentUrl}
              controls
              autoPlay
              onLoadedData={() => setIsLoading(false)}
              className="max-w-[85vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          ) : (
            <motion.img
              key={currentUrl}
              src={currentUrl}
              alt="Full size preview"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale, opacity: isLoading ? 0 : 1, rotate: rotation }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onLoad={() => setIsLoading(false)}
              className="max-w-[85vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing border border-white/10"
              draggable={false}
            />
          )}
        </div>

        {/* Bottom Thumbnail Navigation Bar */}
        {images.length > 1 && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-black/60 backdrop-blur-md flex items-center gap-2 max-w-[90vw] overflow-x-auto z-10 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((url, i) => {
              const isVid = url && (url.startsWith('data:video/') || url.includes('.mp4') || url.startsWith('blob:video/') || (url.startsWith('blob:') && url.includes('video')));
              return (
                <button
                  key={i}
                  onClick={() => {
                    setIndex(i);
                    setScale(1);
                    setIsLoading(true);
                    if (onNavigate) onNavigate(i);
                  }}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 relative ${
                    i === index ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {isVid ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                      <video src={url} className="w-full h-full object-cover opacity-55 pointer-events-none" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img src={url} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageLightbox;
