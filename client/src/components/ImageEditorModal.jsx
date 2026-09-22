import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  X, ZoomIn, ZoomOut, RotateCw, RotateCcw, FlipHorizontal, 
  Sun, Contrast as ContrastIcon, Droplet, Sparkles, Crop, 
  Eye, Download, Check, RefreshCw, Sliders
} from "lucide-react";

const PRESET_FILTERS = [
  { id: "normal", name: "Normal", filter: { brightness: 100, contrast: 100, saturation: 100, blur: 0 } },
  { id: "vivid", name: "Vivid", filter: { brightness: 105, contrast: 120, saturation: 135, blur: 0 } },
  { id: "bw", name: "Monochrome", filter: { brightness: 100, contrast: 110, saturation: 0, blur: 0 } },
  { id: "sepia", name: "Sepia", filter: { brightness: 95, contrast: 105, saturation: 80, blur: 0, sepia: 80 } },
  { id: "warm", name: "Warm", filter: { brightness: 105, contrast: 100, saturation: 115, blur: 0, sepia: 25 } },
  { id: "cool", name: "Cool", filter: { brightness: 100, contrast: 105, saturation: 110, blur: 0, hue: 180 } },
  { id: "vintage", name: "Vintage", filter: { brightness: 90, contrast: 90, saturation: 85, blur: 0, sepia: 40 } },
];

export default function ImageEditorModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onSave, 
  initialMode = "crop" // "view" | "crop" | "adjust"
}) {
  const [mode, setMode] = useState(initialMode); // "view" | "crop" | "adjust"
  
  // Transform State for Cropping & Viewing
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);

  // Adjustment Sliders State
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [activeFilterId, setActiveFilterId] = useState("normal");

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      resetTransform();
    }
  }, [isOpen, initialMode, imageSrc]);

  const resetTransform = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setActiveFilterId("normal");
  };

  const handleApplyFilter = (preset) => {
    setActiveFilterId(preset.id);
    setBrightness(preset.filter.brightness);
    setContrast(preset.filter.contrast);
    setSaturation(preset.filter.saturation);
    setBlur(preset.filter.blur);
  };

  // Mouse & Touch Dragging Handlers
  const handleStartDrag = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMoveDrag = useCallback((clientX, clientY) => {
    if (!isDragging) return;
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStartDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMoveDrag(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    handleEndDrag();
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Canvas Image Processing & Export
  const handleSaveAndExport = async () => {
    if (!imageSrc) return;
    setIsSaving(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Target size for avatar output: 400x400
      const outputSize = 400;
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get 2d context");
      }

      // 1. Fill background with white/transparent
      ctx.clearRect(0, 0, outputSize, outputSize);

      // 2. Apply CSS Filters on Canvas Context
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;

      // 3. Setup transformations
      ctx.save();
      ctx.translate(outputSize / 2, outputSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, 1);

      // Compute display bounds based on container vs image original aspect ratio
      const viewDiameter = 240; // match viewport circle diameter in UI
      const scaleFactor = (outputSize / viewDiameter);

      const drawWidth = (img.width / img.height >= 1) 
        ? (viewDiameter * (img.width / img.height)) * zoom * scaleFactor
        : viewDiameter * zoom * scaleFactor;
      
      const drawHeight = (img.width / img.height >= 1)
        ? viewDiameter * zoom * scaleFactor
        : (viewDiameter * (img.height / img.width)) * zoom * scaleFactor;

      const drawX = (pan.x * scaleFactor) - (drawWidth / 2);
      const drawY = (pan.y * scaleFactor) - (drawHeight / 2);

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Convert canvas to Blob / DataURL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: "image/jpeg" });

      if (onSave) {
        await onSave(file, dataUrl);
      }
      onClose();
    } catch (err) {
      console.error("Error generating cropped image:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `profile_image_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !imageSrc) return null;

  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`
  };

  const transformStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
    transition: isDragging ? "none" : "transform 0.15s ease-out"
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in text-left">
      <div className="bg-bg-card border border-border-card rounded-[24px] shadow-2xl w-full max-w-[620px] overflow-hidden flex flex-col max-h-[85vh] my-auto relative">
        
        {/* Modal Header & Tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card bg-bg-card shrink-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("view")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mode === "view"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-sec hover:text-text-main hover:bg-bg-base"
              }`}
            >
              <Eye size={14} /> View
            </button>
            <button
              onClick={() => setMode("crop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mode === "crop"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-sec hover:text-text-main hover:bg-bg-base"
              }`}
            >
              <Crop size={14} /> Crop & Position
            </button>
            <button
              onClick={() => setMode("adjust")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                mode === "adjust"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-text-sec hover:text-text-main hover:bg-bg-base"
              }`}
            >
              <Sliders size={14} /> Filters & Effects
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-base hover:bg-border-card text-text-sec hover:text-text-main flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body / Canvas Viewport */}
        <div className="p-4 flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center bg-black/95 relative min-h-[300px] select-none">
          
          {/* VIEW MODE */}
          {mode === "view" && (
            <div className="relative w-full h-[320px] flex items-center justify-center overflow-hidden">
              <img
                src={imageSrc}
                alt="Profile View"
                style={{ ...filterStyle, ...transformStyle }}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                <button
                  onClick={() => setZoom(z => Math.max(0.8, z - 0.2))}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[11px] font-mono font-bold text-white px-1">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Download Image"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          )}

          {/* CROP & POSITION MODE */}
          {mode === "crop" && (
            <div 
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="relative w-full h-[320px] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            >
              {/* Image Layer */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop Target"
                  style={{ ...filterStyle, ...transformStyle }}
                  className="max-h-[280px] max-w-[280px] object-contain pointer-events-none"
                />
              </div>

              {/* Circular Crop Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Backdrop mask with center circle cutout */}
                <div 
                  className="w-[240px] h-[240px] rounded-full border-2 border-brand-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] relative"
                >
                  <div className="absolute inset-0 rounded-full border border-white/40 border-dashed" />
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/20" />
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/20" />
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/80 font-semibold pointer-events-none">
                Drag to reposition
              </div>
            </div>
          )}

          {/* FILTERS & ADJUSTMENTS MODE */}
          {mode === "adjust" && (
            <div className="relative w-full h-[320px] flex items-center justify-center overflow-hidden">
              <img
                src={imageSrc}
                alt="Adjust Preview"
                style={{ ...filterStyle, ...transformStyle }}
                className="max-h-[240px] max-w-[240px] object-contain rounded-full shadow-2xl border-4 border-brand-primary/40"
              />
            </div>
          )}

        </div>

        {/* Toolbar Controls */}
        <div className="p-5 border-t border-border-card bg-bg-card space-y-4">
          
          {/* Controls for CROP Mode */}
          {mode === "crop" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ZoomOut size={14} className="text-text-mut" />
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-brand-primary cursor-pointer h-1.5 bg-bg-base rounded-lg"
                />
                <ZoomIn size={14} className="text-text-mut" />
                <span className="text-xs font-mono font-bold text-text-sec w-10 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                    className="px-3 py-1.5 rounded-lg bg-bg-base hover:bg-border-card text-text-sec hover:text-text-main text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} /> -90°
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="px-3 py-1.5 rounded-lg bg-bg-base hover:bg-border-card text-text-sec hover:text-text-main text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCw size={13} /> +90°
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipH(f => !f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      flipH ? "bg-brand-primary text-white" : "bg-bg-base hover:bg-border-card text-text-sec hover:text-text-main"
                    }`}
                  >
                    <FlipHorizontal size={13} /> Flip
                  </button>
                </div>

                <button
                  type="button"
                  onClick={resetTransform}
                  className="px-3 py-1.5 rounded-lg bg-bg-base hover:bg-border-card text-text-mut hover:text-text-main text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset positions"
                >
                  <RefreshCw size={12} /> Reset
                </button>
              </div>
            </div>
          )}

          {/* Controls for ADJUSTMENTS & FILTERS Mode */}
          {mode === "adjust" && (
            <div className="space-y-4">
              {/* Presets Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-text-mut uppercase pr-1 flex items-center gap-1">
                  <Sparkles size={12} /> Filters:
                </span>
                {PRESET_FILTERS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyFilter(preset)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeFilterId === preset.id
                        ? "bg-brand-primary text-white shadow-sm scale-105"
                        : "bg-bg-base text-text-sec hover:bg-border-card hover:text-text-main"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {/* Brightness */}
                <div className="flex items-center gap-2">
                  <Sun size={13} className="text-text-mut" />
                  <span className="w-16 font-semibold text-text-sec text-[11px]">Brightness</span>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1 bg-bg-base rounded-lg"
                  />
                  <span className="w-8 font-mono text-[10px] text-text-mut text-right">{brightness}%</span>
                </div>

                {/* Contrast */}
                <div className="flex items-center gap-2">
                  <ContrastIcon size={13} className="text-text-mut" />
                  <span className="w-16 font-semibold text-text-sec text-[11px]">Contrast</span>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1 bg-bg-base rounded-lg"
                  />
                  <span className="w-8 font-mono text-[10px] text-text-mut text-right">{contrast}%</span>
                </div>

                {/* Saturation */}
                <div className="flex items-center gap-2">
                  <Droplet size={13} className="text-text-mut" />
                  <span className="w-16 font-semibold text-text-sec text-[11px]">Saturation</span>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1 bg-bg-base rounded-lg"
                  />
                  <span className="w-8 font-mono text-[10px] text-text-mut text-right">{saturation}%</span>
                </div>

                {/* Blur */}
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-text-mut" />
                  <span className="w-16 font-semibold text-text-sec text-[11px]">Blur</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={blur}
                    onChange={(e) => setBlur(Number(e.target.value))}
                    className="w-full accent-brand-primary h-1 bg-bg-base rounded-lg"
                  />
                  <span className="w-8 font-mono text-[10px] text-text-mut text-right">{blur}px</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-border-card">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-bg-base hover:bg-border-card text-text-sec text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {mode === "view" ? (
                <button
                  type="button"
                  onClick={() => setMode("crop")}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Crop size={14} /> Edit & Crop Image
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAndExport}
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-1.5 shadow-md shadow-brand-primary/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Save & Apply Picture
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );


  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}

