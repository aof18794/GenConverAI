"use client";

import { MessageCircle, Settings, RotateCcw } from "lucide-react";
import { Settings as SettingsType, AppMode } from "@/types";

interface NavbarProps {
  mode: AppMode;
  settings: SettingsType;
  onHomeClick: () => void;
  onSettingsClick: () => void;
  onLanguageToggle: () => void;
  onResetClick: () => void;
}

export function Navbar({
  mode,
  settings,
  onHomeClick,
  onSettingsClick,
  onLanguageToggle,
  onResetClick,
}: NavbarProps) {
  return (
    <nav className="nav-glass fixed top-0 w-full z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          onClick={onHomeClick}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <MessageCircle
            className="text-emerald-400 group-hover:text-emerald-300 transition-colors fill-current"
            size={32}
          />
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-none">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                GenConver
              </span>
              <span className="text-slate-100">AI</span>
            </span>
            <span className="text-[10px] text-emerald-200/40 font-medium">
              Created by Siravich Boonyuen
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onSettingsClick}
            className="p-2 text-emerald-200/50 hover:text-slate-200 transition-colors"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onLanguageToggle}
            className="px-3 py-1.5 text-xs rounded-lg glass-card text-emerald-200/60 hover:text-slate-200 transition-colors"
          >
            {settings.lang === "th" ? "TH" : "EN"}
          </button>
          {mode !== "home" && (
            <button
              onClick={onResetClick}
              className="p-2 text-emerald-200/50 hover:text-slate-200 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
