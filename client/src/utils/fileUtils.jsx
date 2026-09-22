import React from 'react';
import { FileText, Image as ImageIcon, File as FileIcon, BarChart2, Presentation, Archive, Video, Music } from 'lucide-react';

/**
 * Format bytes to human-readable string
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

/**
 * Get file type icon label for display
 */
export const getFileIcon = (mimeType, name, size = 16) => {
  const ext = name?.split(".").pop()?.toLowerCase();
  if (!mimeType && !ext) return <FileText size={size} />;
  if (mimeType?.includes("image") || ["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return <ImageIcon size={size} />;
  if (mimeType?.includes("pdf") || ext === "pdf") return <FileIcon size={size} className="text-red-500" />;
  if (mimeType?.includes("spreadsheet") || ["xlsx","xls","csv"].includes(ext)) return <BarChart2 size={size} className="text-green-500" />;
  if (mimeType?.includes("presentation") || ["pptx","ppt"].includes(ext)) return <Presentation size={size} className="text-orange-500" />;
  if (mimeType?.includes("document") || ["docx","doc"].includes(ext)) return <FileText size={size} className="text-blue-500" />;
  if (["zip","rar","7z","tar","gz"].includes(ext)) return <Archive size={size} />;
  if (["mp4","mov","avi","mkv"].includes(ext)) return <Video size={size} />;
  if (["mp3","wav","ogg"].includes(ext)) return <Music size={size} />;
  return <FileText size={size} />;
};
