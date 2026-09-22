import React, { useState } from "react";
import zunaLogo from "../assets/zuna-logo.png";

export default function Logo({ size = 32, showText = true }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="inline-flex items-center gap-3">
      {/* Icon/Logo Image or SVG Fallback */}
      {!imgFailed ? (
        <img 
          src={zunaLogo} 
          alt="Zuna Logo" 
          className="object-contain rounded-[8px] shadow-sm flex-shrink-0"
          style={{ width: size, height: size }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div 
          className="flex items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-primary to-brand-hover text-white shadow-sm flex-shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[55%] h-[55%]"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 11 2 2 4-4" />
          </svg>
        </div>
      )}

      {/* Text Label */}
      {showText && (
        <div className="flex flex-col text-left leading-[1.15] flex-shrink-0">
          <span className="font-sans font-extrabold text-[1.05rem] tracking-tight text-text-main">
            Zuna
          </span>
        </div>
      )}
    </div>
  );
}


