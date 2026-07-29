import React, { useState } from 'react';
import { Maximize2, Loader2 } from 'lucide-react';

interface ImageMessageProps {
  url: string;
  alt?: string;
  onClick?: () => void;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({ url, alt = 'Attached image', onClick }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      onClick={onClick}
      className="relative group overflow-hidden rounded-[18px] border border-slate-200 cursor-pointer max-w-[280px] sm:max-w-[340px] shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-500 bg-slate-50"
    >
      {isLoading && (
        <div className="w-[280px] sm:w-[340px] h-[220px] flex items-center justify-center bg-slate-100">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      )}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        className={`w-full max-h-[360px] object-cover transition-transform duration-300 group-hover:scale-105 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      {/* Subtle overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
        <div className="p-2 rounded-full bg-white/90 text-slate-800 backdrop-blur-sm shadow-md">
          <Maximize2 className="w-4 h-4 text-emerald-600" />
        </div>
      </div>
    </div>
  );
};

export default ImageMessage;
