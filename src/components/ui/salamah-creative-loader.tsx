"use client";

import React from "react";
import Image from "next/image";

export type SalamahLoaderProps = {
  label?: string;
  sublabel?: string;
  variant?: "fullscreen" | "inline" | "overlay" | "compact";
  className?: string;
};

export function SalamahCreativeLoader({
  label = "Loading Academic Records...",
  sublabel = "Salamah School • Nurturing Excellence & Faith",
  variant = "inline",
  className = "",
}: SalamahLoaderProps) {
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 text-xs font-semibold text-[#dfba73] ${className}`}>
        <div className="relative h-4 w-4">
          <div className="absolute inset-0 rounded-full border-2 border-teal-500/20 border-t-[#dfba73] animate-spin" />
        </div>
        <span>{label}</span>
      </div>
    );
  }

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Visual Creative Spinner */}
      <div className="relative flex items-center justify-center h-24 w-24 sm:h-28 sm:w-28 mb-5">
        {/* Ambient Radial Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-500/20 via-[#dfba73]/15 to-transparent blur-xl animate-pulse" />

        {/* Outer Ring: Rotating Dashed Gold Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#dfba73]/40 animate-[spin_8s_linear_infinite]" />

        {/* Counter-Rotating Teal Arc */}
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-teal-400 border-r-teal-400/50 animate-[spin_3s_linear_infinite_reverse]" />

        {/* Inner Pulsing Gold Ring */}
        <div className="absolute inset-4 rounded-full border border-[#dfba73]/60 animate-ping opacity-25" />

        {/* Central Core Emblem */}
        <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#092233] to-[#04111a] border border-[#dfba73]/50 shadow-[0_0_20px_rgba(223,186,115,0.25)]">
          <Image
            src="https://res.cloudinary.com/djkudkxmx/image/upload/v1781003815/salamah_fav_icon_jxar2b.png"
            alt="Salamah Crest"
            width={38}
            height={38}
            className="object-contain drop-shadow"
            priority
          />
        </div>

        {/* Floating Orbital Node */}
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#dfba73] shadow-[0_0_8px_#dfba73] animate-bounce" />
      </div>

      {/* Label and Sublabel */}
      <h3 className="font-display text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
        <span>{label}</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#dfba73] animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#dfba73] animate-bounce" />
        </span>
      </h3>
      {sublabel && (
        <p className="mt-1.5 text-[11px] sm:text-xs text-slate-400 font-medium max-w-xs sm:max-w-sm">
          {sublabel}
        </p>
      )}

      {/* Shimmer Progress Track */}
      <div className="mt-4 h-1 w-36 sm:w-48 overflow-hidden rounded-full bg-slate-800/80">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-[#dfba73] to-teal-400 animate-[shimmer_1.5s_infinite] -translate-x-full" />
      </div>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#061826]/90 backdrop-blur-md ${className}`}>
        {content}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className={`absolute inset-0 z-30 flex items-center justify-center bg-[#092233]/85 backdrop-blur-xs rounded-3xl ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`w-full py-12 flex items-center justify-center ${className}`}>
      {content}
    </div>
  );
}
