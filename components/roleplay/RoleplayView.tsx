"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Volume2,
  Sparkles,
  X,
} from "lucide-react";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { Settings, TargetLanguage } from "@/types";

interface RoleplayViewProps {
  settings: Settings;
  targetLanguage: TargetLanguage;
  onGoHome: () => void;
}

export function RoleplayView({
  settings,
  targetLanguage,
  onGoHome,
}: RoleplayViewProps) {
  const [scenario, setScenario] = useState("");
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    isConnected,
    isRecording,
    volume,
    error,
    connect,
    disconnect,
    startRecording,
    stopRecording,
  } = useGeminiLive({
    onDisconnect: () => {
      // Handle auto disconnect
    },
    systemInstruction,
  });

  const generateScenarioConfig = async (selectedScenario: string) => {
    setLoading(true);
    setScenario(selectedScenario);
    try {
      const res = await fetch("/api/roleplay-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: selectedScenario,
          targetLanguage,
        }),
      });
      const data = await res.json();
      if (data.systemInstruction) {
        setSystemInstruction(data.systemInstruction);
        setIsSetupDone(true);
      }
    } catch (e) {
      console.error("Failed to setup roleplay", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = () => {
    connect();
  };

  useEffect(() => {
    if (isConnected && !isRecording) {
      startRecording();
    }
  }, [isConnected, isRecording, startRecording]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  if (!isSetupDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 animate-in fade-in duration-500 relative">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-2">
            <Sparkles className="w-3 h-3" /> AI Roleplay
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">
            {settings.lang === "th" ? "เลือกสถานการณ์" : "Choose Scenario"}
          </h2>
          <p className="text-emerald-200/60 max-w-md mx-auto text-lg">
            {settings.lang === "th"
              ? "เลือกสถานการณ์ที่คุณต้องการฝึกฝนกับ AI"
              : "Select a context to start your conversation"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl px-4 relative z-10">
          {[
            {
              id: "cafe",
              label: "Ordering Coffee",
              labelTh: "สั่งกาแฟ",
              icon: "☕️",
              desc: "Cafe scenario",
            },
            {
              id: "airport",
              label: "Airport Check-in",
              labelTh: "เช็คอินสนามบิน",
              icon: "✈️",
              desc: "Travel scenario",
            },
            {
              id: "hotel",
              label: "Hotel Check-in",
              labelTh: "เช็คอินโรงแรม",
              icon: "🏨",
              desc: "Reception scenario",
            },
            {
              id: "direction",
              label: "Asking Directions",
              labelTh: "ถามทาง",
              icon: "🗺️",
              desc: "Street scenario",
            },
            {
              id: "shopping",
              label: "Shopping",
              labelTh: "ซื้อของ",
              icon: "🛍️",
              desc: "Retail scenario",
            },
            {
              id: "friend",
              label: "Chat with Friend",
              labelTh: "คุยกับเพื่อน",
              icon: "👋",
              desc: "Casual scenario",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() =>
                generateScenarioConfig(
                  settings.lang === "th" ? item.labelTh : item.label
                )
              }
              disabled={loading}
              className="group relative overflow-hidden glass-card p-6 rounded-2xl text-left hover:scale-[1.02] transition-all duration-300 border border-white/5 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-900/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 group-hover:via-emerald-500/10 transition-all duration-500" />
              <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300 origin-left">
                {item.icon}
              </span>
              <h3 className="text-xl font-bold text-slate-100 mb-1">
                {settings.lang === "th" ? item.labelTh : item.label}
              </h3>
              <p className="text-sm text-emerald-200/40">{item.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={onGoHome}
          className="text-emerald-200/50 hover:text-emerald-200 mt-8 text-sm flex items-center gap-2 transition-colors"
        >
          <X className="w-4 h-4" />{" "}
          {settings.lang === "th" ? "กลับหน้าหลัก" : "Cancel"}
        </button>
      </div>
    );
  }

  // Visualizer Scale
  const scale = 1 + Math.max(0, volume * 1.5); // Tune this multiplier for sensitivity

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-700">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen transition-all duration duration-[2000ms] ${
            isConnected ? "opacity-100 scale-110" : "opacity-30 scale-100"
          }`}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] mix-blend-screen transition-all duration-[2000ms] delay-75 ${
            isConnected ? "opacity-100 scale-110" : "opacity-30 scale-100"
          }`}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
            }`}
          />
          <span className="text-sm font-medium text-emerald-100/60 uppercase tracking-wider">
            {isConnected ? "Live Session" : "Disconnected"}
          </span>
        </div>
        <button
          onClick={onGoHome}
          className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Visualizer */}
      <div className="relative z-10 flex flex-col items-center gap-12">
        <div className="relative">
          {/* Outer Glow */}
          <div
            className={`absolute inset-0 bg-emerald-400/30 blur-3xl rounded-full transition-all duration-75`}
            style={{ transform: `scale(${scale * 1.2})` }}
          />

          {/* Core Orb */}
          <div
            className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-75 border-4
                    ${
                      isConnected
                        ? "bg-gradient-to-br from-emerald-900/80 to-teal-900/80 border-emerald-400/50 shadow-[0_0_60px_rgba(16,185,129,0.4)]"
                        : "bg-slate-900/50 border-slate-700"
                    }`}
            style={{ transform: `scale(${scale})` }}
          >
            {isConnected ? (
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl animate-pulse">
                    {volume > 0.1 ? "User" : "AI"}
                  </span>
                </div>
              </div>
            ) : (
              <Radio className="w-20 h-20 text-slate-600" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {scenario ||
              (settings.lang === "th" ? "สนทนาทั่วไป" : "Conversation")}
          </h3>
          <p
            className={`text-base font-medium transition-colors ${
              error ? "text-red-400" : "text-emerald-200/60"
            }`}
          >
            {error ||
              (isConnected
                ? settings.lang === "th"
                  ? "กำลังฟัง..."
                  : "Listening..."
                : settings.lang === "th"
                ? "พร้อมเริ่ม"
                : "Ready to Start")}
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-4 p-2 rounded-full glass-card border border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl">
          {!isConnected ? (
            <button
              onClick={handleStartSession}
              className="px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition-all hover:scale-105 active:scale-95"
            >
              <Mic className="w-5 h-5" />
              {settings.lang === "th" ? "เริ่มสนทนา" : "Start Chat"}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (isRecording) stopRecording();
                  else startRecording();
                }}
                className={`p-4 rounded-full transition-all border ${
                  isRecording
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
                    : "bg-slate-800/50 border-white/10 text-slate-400 hover:bg-white/5"
                }`}
                title={isRecording ? "Mute" : "Unmute"}
              >
                {isRecording ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </button>

              <button
                onClick={disconnect}
                className="p-4 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
