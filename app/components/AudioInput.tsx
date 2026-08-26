"use client";

import React, { useState, useRef } from "react";

interface AudioInputProps {
  onAudioReady: (data: { base64: string; mimeType: string; fileName: string } | null) => void;
  onError?: (errorMessage: string | null) => void;
}

const MAX_AUDIO_SIZE_BYTES = 2.5 * 1024 * 1024; // 2.5MB (safely under Vercel 4.5MB payload limit after base64 expansion)

const ALLOWED_EXTENSIONS = ["mp3", "mpeg", "wav", "m4a", "ogg", "webm", "aac", "flac"];

// Derive a canonical MIME type from extension (browser file.type is inconsistent)
const EXT_TO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  mpeg: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/aac",  // Gemini doesn't have a distinct m4a type; aac container is the closest
  ogg: "audio/ogg",
  webm: "audio/webm",
  aac: "audio/aac",
  flac: "audio/flac",
};

function isValidAudioFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!ext && ALLOWED_EXTENSIONS.includes(ext);
}

function getMimeType(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "audio/mpeg";
}

export function AudioInput({ onAudioReady, onError }: AudioInputProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file) return;

    if (!isValidAudioFile(file)) {
      const errMsg = "Please select a valid audio file (.mp3, .wav, .m4a, .ogg, .webm, .aac, .flac).";
      setError(errMsg);
      onError?.(errMsg);
      return;
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      const errMsg = `Audio file too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 2.5MB.`;
      setError(errMsg);
      onError?.(errMsg);
      return;
    }

    setError(null);
    onError?.(null);
    setFileName(file.name);
    setFileSizeStr(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      const mimeType = getMimeType(file);
      onAudioReady({ base64, mimeType, fileName: file.name });
    };
    reader.onerror = () => {
      const errMsg = "Failed to read audio file.";
      setError(errMsg);
      onError?.(errMsg);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setFileName(null);
    setFileSizeStr(null);
    setError(null);
    onError?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onAudioReady(null);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-200">
        Suspicious voice note / call recording
      </label>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-[#7CB8F2] bg-[#7CB8F2]/10"
            : "border-white/20 hover:border-[#7CB8F2] hover:bg-white/5"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*,.mp3,.mpeg,.wav,.m4a,.ogg,.webm,.aac"
          onChange={handleFileChange}
          className="hidden"
        />

        {fileName ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 text-[#7CB8F2] font-semibold text-sm">
              <span>🎙️</span>
              <span className="truncate max-w-[280px] sm:max-w-md">{fileName}</span>
              {fileSizeStr && (
                <span className="text-xs text-slate-400 font-normal">({fileSizeStr})</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-300 underline mt-1 transition-colors"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-300 text-sm">
            <span className="text-2xl mb-1">🎙️</span>
            <span>Click to browse or drag a voice note / call audio here</span>
            <span className="text-xs text-slate-400">Supported: MP3, WAV, M4A, OGG, WEBM, AAC (Max 2.5MB)</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 font-medium animate-fade-in">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
