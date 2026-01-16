'use client';

import { useRef, useState } from 'react';

export default function DesktopMockup() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12 px-4">
      {/* Glow effect behind the mockup */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent blur-3xl scale-110" />

      {/* Desktop window frame */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#1a1a1a] shadow-2xl">

        {/* Window title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#2a2a2a] border-b border-white/5">
          {/* Traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>

          {/* Window title */}
          <div className="flex-1 text-center">
            <span className="text-sm text-white/60 font-medium">Verifily</span>
          </div>

          {/* Spacer for symmetry */}
          <div className="w-14" />
        </div>

        {/* Video container */}
        <div className="relative aspect-video bg-black cursor-pointer" onClick={togglePlay}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/verifily.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Play/Pause overlay - shows on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all duration-300 group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {isPlaying ? (
                <svg className="w-16 h-16 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-16 h-16 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Optional: macOS-style dock */}
      <div className="flex justify-center gap-2 mt-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-lg">🌐</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <span className="text-white text-lg">✓</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
        </div>
      </div>
    </div>
  );
}
