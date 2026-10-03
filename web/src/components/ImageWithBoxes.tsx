import React, { useState } from 'react';
import type { AiResult } from '../api/types';
import { formatPercentage } from '../lib/format';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface ImageWithBoxesProps {
  imageUrl: string;
  aiResult?: AiResult | null;
  alt?: string;
  className?: string;
}

export const ImageWithBoxes: React.FC<ImageWithBoxesProps> = ({
  imageUrl,
  aiResult,
  alt = 'Report Image',
  className = '',
}) => {
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions({
      width: img.naturalWidth || 1280,
      height: img.naturalHeight || 720,
    });
    setImageLoaded(true);
  };

  // Compute bounding box percentages
  const bbox = aiResult?.bounding_box;
  const imgWidth = bbox?.image_width || dimensions.width;
  const imgHeight = bbox?.image_height || dimensions.height;

  let leftPct = 0;
  let topPct = 0;
  let widthPct = 0;
  let heightPct = 0;

  if (bbox && imgWidth > 0 && imgHeight > 0) {
    leftPct = (bbox.x1 / imgWidth) * 100;
    topPct = (bbox.y1 / imgHeight) * 100;
    widthPct = ((bbox.x2 - bbox.x1) / imgWidth) * 100;
    heightPct = ((bbox.y2 - bbox.y1) / imgHeight) * 100;
  }

  const hasValidBox = bbox && widthPct > 0 && heightPct > 0;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900 ${className}`}>
      {/* Main Image */}
      <img
        src={imageUrl}
        alt={alt}
        onLoad={handleImageLoad}
        className="w-full h-auto max-h-[520px] object-contain mx-auto block"
        loading="lazy"
      />

      {/* Bounding Box Overlay */}
      {imageLoaded && hasValidBox && showOverlay && (
        <div
          className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded-md transition-all duration-300 pointer-events-none shadow-sm"
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            width: `${widthPct}%`,
            height: `${heightPct}%`,
          }}
        >
          {/* Tag pill */}
          <div className="absolute -top-7 left-0 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {aiResult?.detected_class || 'Issue'}{' '}
              {aiResult?.confidence != null && `(${formatPercentage(aiResult.confidence)})`}
            </span>
          </div>
        </div>
      )}

      {/* Toggle Box Controls */}
      {hasValidBox && (
        <div className="absolute bottom-3 right-3 z-10">
          <button
            type="button"
            onClick={() => setShowOverlay(!showOverlay)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-sm border border-white/20 transition shadow"
          >
            {showOverlay ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showOverlay ? 'Hide AI Box' : 'Show AI Box'}
          </button>
        </div>
      )}
    </div>
  );
};
