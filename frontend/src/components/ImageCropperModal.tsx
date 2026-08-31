import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, X, Crop as CropIcon } from 'lucide-react';

interface ImageCropperModalProps {
  imageUrl: string;
  onConfirmCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
  onReset: () => void;
}

export default function ImageCropperModal({
  imageUrl,
  onConfirmCrop,
  onCancel,
  onReset,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropBoxSize, setCropBoxSize] = useState({ width: 280, height: 280 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle Dragging / Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile browsers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetControls = () => {
    setZoom(1.0);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setCropBoxSize({ width: 280, height: 280 });
    onReset();
  };

  // Generate cropped image on HTML5 Canvas
  const handleConfirm = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed output crop size for model consistency (e.g. 512x512)
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Draw background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outputSize, outputSize);

    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const scaleFactor = outputSize / cropBoxSize.width;

    const drawX = (pan.x * scaleFactor);
    const drawY = (pan.y * scaleFactor);

    // Draw original image aspect-correct
    const aspect = img.naturalWidth / img.naturalHeight;
    let drawWidth = outputSize;
    let drawHeight = outputSize;
    if (aspect > 1) {
      drawHeight = outputSize / aspect;
    } else {
      drawWidth = outputSize * aspect;
    }

    ctx.drawImage(
      img,
      -drawWidth / 2 + drawX,
      -drawHeight / 2 + drawY,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onConfirmCrop(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card bg-brandDark border border-slate-700/60 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-white"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Crop Plant / Foliage Area</h3>
              <p className="text-[11px] text-slate-400">Position lesion or affected leaf within frame</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper Viewport Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[360px] bg-slate-950 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Image Transform Wrapper */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="w-full h-full flex items-center justify-center pointer-events-none"
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop Source"
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>

          {/* Fixed Crop Overlay Box */}
          <div
            style={{
              width: `${cropBoxSize.width}px`,
              height: `${cropBoxSize.height}px`,
            }}
            className="absolute border-2 border-primary rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none flex flex-col justify-between p-2"
          >
            {/* Corner Markers */}
            <div className="flex justify-between">
              <div className="w-4 h-4 border-t-2 border-l-2 border-primary -mt-1 -ml-1" />
              <div className="w-4 h-4 border-t-2 border-r-2 border-primary -mt-1 -mr-1" />
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-primary bg-black/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Foliage Crop Area
              </span>
            </div>
            <div className="flex justify-between">
              <div className="w-4 h-4 border-b-2 border-l-2 border-primary -mb-1 -ml-1" />
              <div className="w-4 h-4 border-b-2 border-r-2 border-primary -mb-1 -mr-1" />
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800/80 space-y-4">
          {/* Zoom Slider & Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom((z) => Math.max(1.0, z - 0.2))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-primary h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <button
              onClick={() => setZoom((z) => Math.min(3.0, z + 0.2))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Rotate Button */}
            <button
              onClick={handleRotate}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
              {rotation}°
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetControls}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Reset Crop"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {/* Bottom Action Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-primary text-brandDark font-extrabold text-xs hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              Confirm Crop
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
