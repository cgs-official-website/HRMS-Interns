import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Download, X, ExternalLink } from "lucide-react";
import { getFileIcon, formatFileSize } from "../utils/fileUtils";

// Helper to convert Base64 Data URL to Blob
const dataURLtoBlob = (dataurl) => {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error("Error parsing base64 data URL to Blob:", err);
    return null;
  }
};

export function FilePreviewModal({ file, displayUrl, onClose }) {
  const isImage = file.mimeType?.startsWith("image/") || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = file.mimeType?.startsWith("video/") || file.name?.match(/\.(mp4|webm|ogg)$/i);
  const isPdf = file.mimeType === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");

  const handleDownload = async () => {
    if (file.url && file.url.startsWith("data:")) {
      try {
        const blob = dataURLtoBlob(file.url);
        if (!blob) throw new Error("Could not parse file data.");
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (err) {
        console.error("Failed to download local file:", err);
      }
    } else {
      try {
        const response = await fetch(displayUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (err) {
        console.error("Failed to download remote file:", err);
        const link = document.createElement("a");
        link.href = displayUrl;
        link.download = file.name || "download";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-8 animate-fade-in">
      <div className="relative w-full max-w-5xl h-full max-h-[90vh] bg-bg-card border border-border-card rounded-[20px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-card bg-bg-base/50 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-2xl flex-shrink-0">{getFileIcon(file.mimeType, file.name)}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-text-main truncate block">{file.name}</span>
              <span className="text-xs text-text-mut truncate block">{formatFileSize(file.size)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-[10px] transition-colors cursor-pointer shadow-sm">
              <Download size={16} /> <span className="hidden sm:inline">Download</span>
            </button>
            <button onClick={onClose} className="p-2 text-text-mut hover:text-text-main hover:bg-bg-base rounded-[10px] transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex items-center justify-center bg-bg-base overflow-hidden p-4 relative">
          {isImage ? (
            <img src={displayUrl} alt={file.name} className="max-w-full max-h-full object-contain rounded-[8px]" />
          ) : isVideo ? (
            <video src={displayUrl} controls className="max-w-full max-h-full rounded-[8px]" />
          ) : isPdf ? (
            <iframe src={displayUrl} title={file.name} className="w-full h-full rounded-[8px] bg-white border-none" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="text-6xl">{getFileIcon(file.mimeType, file.name)}</span>
              <p className="text-text-sec text-sm">No preview available for this file type.</p>
              <button onClick={handleDownload} className="px-6 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-[10px] hover:bg-brand-hover transition-colors cursor-pointer shadow-md">
                Download to view
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function FileCard({ file }) {
  const [showPreview, setShowPreview] = useState(false);
  
  if (!file) return null;
  const icon = getFileIcon(file.mimeType, file.name);

  const handleOpenFile = (e) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const isDataUrl = file.url && file.url.startsWith("data:");
  let displayUrl = file.url;
  if (!isDataUrl && displayUrl && !displayUrl.startsWith("http")) {
    displayUrl = `https://${displayUrl}`;
  }

  return (
    <>
      <a
        href={isDataUrl ? undefined : displayUrl}
        target={isDataUrl ? undefined : "_blank"}
        rel={isDataUrl ? undefined : "noopener noreferrer"}
        onClick={handleOpenFile}
        style={{ cursor: "pointer" }}
        className="flex items-center gap-2 w-full max-w-[260px] px-3 py-2 mt-1 rounded-[10px] border border-border-card bg-bg-base hover:bg-bg-card hover:border-brand-primary/30 transition-all group overflow-hidden"
      >
        <span className="flex-shrink-0 flex items-center justify-center text-xl">
          {icon}
        </span>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-semibold text-text-main truncate block w-full">{file.name}</span>
          <span className="text-[10px] text-text-mut truncate block w-full">{formatFileSize(file.size)}</span>
        </div>
        <ExternalLink size={12} className="text-text-mut group-hover:text-brand-primary flex-shrink-0 ml-auto" />
      </a>
      {showPreview && (
        <FilePreviewModal
          file={file}
          displayUrl={displayUrl}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
