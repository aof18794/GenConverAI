"use client";

import {
  Play,
  Pause,
  BookOpen,
  ChevronRight,
  Volume2,
  Loader2,
  GraduationCap,
  MessageCircle,
  HelpCircle,
  Send,
} from "lucide-react";
import {
  Conversation,
  Character,
  Settings,
  ChatMessage,
  DialogueLine,
} from "@/types";

interface LearnViewProps {
  conversation: Conversation;
  charactersData: Character[];
  avatars: Record<string, string>;
  settings: Settings;
  // Audio controls
  audioUrl: string | null;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activeBubbleIndex: number;
  isGeneratingAudio: boolean;
  onToggleAudio: () => void;
  onSeek: (time: number) => void;
  onJumpToDialogue: (index: number) => void;
  onRepeatDialogue: (index: number) => void;
  onGenerateAudio: () => void;
  onSpeedChange: (speed: number) => void;
  onEnforceSpeed: () => void;
  // Quiz
  onStartQuiz: () => void;
  // Explain
  onExplainSentence: (line: DialogueLine) => void;
  // Chat
  showChat: boolean;
  onToggleChat: () => void;
  isChatUnlocked: boolean;
  unlockCode: string;
  onUnlockCodeChange: (code: string) => void;
  onUnlockChat: () => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (input: string) => void;
  onSendChat: () => void;
  isChatLoading: boolean;
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LearnView({
  conversation,
  charactersData,
  avatars,
  settings,
  audioUrl,
  audioRef,
  isPlaying,
  currentTime,
  duration,
  activeBubbleIndex,
  isGeneratingAudio,
  onToggleAudio,
  onSeek,
  onJumpToDialogue,
  onRepeatDialogue,
  onGenerateAudio,
  onSpeedChange,
  onEnforceSpeed,
  onStartQuiz,
  onExplainSentence,
  showChat,
  onToggleChat,
  isChatUnlocked,
  unlockCode,
  onUnlockCodeChange,
  onUnlockChat,
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendChat,
  isChatLoading,
}: LearnViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <div className="glass-card rounded-3xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              {conversation.title}
            </h2>
            <h3 className="text-lg font-medium text-emerald-300 mt-1">
              {conversation.title_th}
            </h3>
            <p className="text-emerald-200/50 mt-2 text-sm">
              {settings.lang === "th"
                ? conversation.situation_th
                : conversation.situation}
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30 shadow-lg shadow-emerald-900/20">
            {settings.level}
          </span>
        </div>
      </div>

      {/* Dialogue */}
      <div className="space-y-6">
        {conversation.dialogue.map((line, idx) => {
          let layoutIsLeft = true;
          const charIndex = charactersData.findIndex((c) => {
            const cName = c.name.toLowerCase().trim();
            const sName = line.speaker.toLowerCase().trim();
            return (
              cName === sName || cName.includes(sName) || sName.includes(cName)
            );
          });
          if (charIndex !== -1) layoutIsLeft = charIndex === 0;

          const isActive = activeBubbleIndex === idx;
          let avatarUrl = avatars[line.speaker];
          if (!avatarUrl && charIndex !== -1) {
            avatarUrl = avatars[charactersData[charIndex].name];
          }

          return (
            <div
              key={idx}
              className={`flex items-end gap-4 ${
                layoutIsLeft ? "flex-row" : "flex-row-reverse"
              } group`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-emerald-900/50 border-2 border-emerald-700/50 overflow-hidden shrink-0 shadow-lg relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={line.speaker}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-200/50 font-bold text-xs text-center leading-tight p-1">
                      {line.speaker}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-emerald-200/40 truncate max-w-[50px]">
                  {line.speaker}
                </span>
              </div>

              <div
                onClick={() => audioUrl && onJumpToDialogue(idx)}
                className={`chat-bubble relative max-w-[75%] p-4 rounded-2xl 
                ${layoutIsLeft ? "rounded-bl-none" : "rounded-br-none"}
                ${isActive ? "active" : ""}
                ${
                  audioUrl
                    ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    : ""
                }
                transition-transform duration-200`}
              >
                <div className="text-xs text-emerald-200/40 mb-1">
                  {line.reading}
                </div>
                <div
                  className={`text-lg font-medium leading-relaxed ${
                    isActive ? "text-emerald-300" : "text-slate-200"
                  }`}
                >
                  {line.text}
                </div>
                <div className="text-sm text-emerald-200/50 mt-2 pt-2 border-t border-emerald-700/30">
                  {settings.lang === "th" ? line.th : line.en}
                </div>

                {/* Explain Button - Bottom of bubble */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExplainSentence(line);
                  }}
                  className="mt-3 w-full py-1.5 rounded-lg bg-emerald-800/30 hover:bg-emerald-700/40 
                    flex items-center justify-center gap-2 text-emerald-300/70 hover:text-emerald-300
                    text-xs font-medium transition-colors border border-emerald-700/20"
                >
                  <HelpCircle size={12} />
                  {settings.lang === "th" ? "อธิบายประโยคนี้" : "Explain"}
                </button>

                {isActive && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vocabulary & Grammar */}
      <div className="grid md:grid-cols-2 gap-6 pt-8">
        <div className="info-card p-6 rounded-3xl">
          <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-4">
            <BookOpen size={18} />{" "}
            {settings.lang === "th" ? "คำศัพท์" : "Vocabulary"}
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {conversation.vocabulary.map((v, i) => (
              <div
                key={i}
                className="flex justify-between text-sm p-2 hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                <span className="text-slate-200 font-medium">
                  {v.word}{" "}
                  <span className="text-emerald-200/40 text-xs ml-1">
                    ({v.reading})
                  </span>
                </span>
                <span className="text-emerald-200/60">
                  {settings.lang === "th" ? v.meaning_th : v.meaning_en}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="info-card p-6 rounded-3xl">
          <h3 className="text-teal-400 font-bold flex items-center gap-2 mb-4">
            <GraduationCap size={18} />{" "}
            {settings.lang === "th" ? "ไวยากรณ์" : "Grammar"}
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {conversation.grammar.map((g, i) => (
              <div key={i} className="text-sm p-2 glass-card rounded-lg">
                <div className="text-teal-300 font-bold mb-1">{g.point}</div>
                <div className="text-emerald-200/50">
                  {settings.lang === "th" ? g.explanation_th : g.explanation_en}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Assistant Section */}
      <div className="mt-8 glass-card rounded-3xl overflow-hidden">
        <button
          onClick={onToggleChat}
          className="w-full p-4 flex items-center justify-between hover:bg-emerald-900/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="text-emerald-400" size={20} />
            <h3 className="text-lg font-bold text-slate-200">
              {settings.lang === "th"
                ? "ถามคำถามเกี่ยวกับบทสนทนา"
                : "Ask About This Conversation"}
            </h3>
          </div>
          <ChevronRight
            className={`text-emerald-200/40 transition-transform ${
              showChat ? "rotate-90" : ""
            }`}
            size={20}
          />
        </button>

        {showChat && (
          <div className="p-4 border-t border-emerald-700/30 space-y-4">
            {!isChatUnlocked ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-emerald-200/60 text-sm mb-4">
                  {settings.lang === "th"
                    ? "🔒 ฟีเจอร์นี้ต้องใส่รหัสเพื่อเปิดใช้งาน"
                    : "🔒 This feature requires an unlock code"}
                </div>
                <div className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="text"
                    value={unlockCode}
                    onChange={(e) => onUnlockCodeChange(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onUnlockChat();
                      }
                    }}
                    placeholder={
                      settings.lang === "th" ? "ใส่รหัส..." : "Enter code..."
                    }
                    className="input-glow flex-1 rounded-xl px-4 py-3 text-slate-200 placeholder-emerald-200/30 text-sm text-center"
                  />
                  <button
                    onClick={onUnlockChat}
                    className="px-6 py-3 btn-3d text-white rounded-xl font-medium"
                  >
                    {settings.lang === "th" ? "ยืนยัน" : "Unlock"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-emerald-200/40 text-sm">
                      {settings.lang === "th"
                        ? "ถามคำถามเกี่ยวกับคำศัพท์ ไวยากรณ์ หรือสิ่งใดก็ได้ในบทสนทนานี้"
                        : "Ask questions about vocabulary, grammar, or anything in this conversation"}
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-xl ${
                            msg.role === "user"
                              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-br-none shadow-lg shadow-emerald-900/30"
                              : "glass-card text-slate-100 rounded-bl-none"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="glass-card text-slate-100 p-3 rounded-xl rounded-bl-none">
                        <Loader2
                          className="animate-spin text-emerald-400"
                          size={16}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => onChatInputChange(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSendChat();
                      }
                    }}
                    placeholder={
                      settings.lang === "th"
                        ? "พิมพ์คำถามของคุณ..."
                        : "Type your question..."
                    }
                    className="input-glow flex-1 rounded-xl px-4 py-3 text-slate-200 placeholder-emerald-200/30 text-sm"
                    disabled={isChatLoading}
                  />
                  <button
                    onClick={onSendChat}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="px-4 py-3 btn-3d text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quiz Button */}
      <div className="flex justify-center">
        <button
          onClick={onStartQuiz}
          className="flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg glass-card text-emerald-200 hover:text-white hover:bg-emerald-900/30 transition-all"
        >
          <GraduationCap size={24} />
          {settings.lang === "th" ? "ทำแบบทดสอบ" : "Take Quiz"}
        </button>
      </div>

      {/* Audio Player - Fixed at bottom */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none px-4">
        {audioUrl ? (
          <div className="pointer-events-auto glass-card rounded-2xl p-4 w-full max-w-md backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={onToggleAudio}
                  className="w-12 h-12 flex items-center justify-center rounded-full btn-3d text-white shadow-lg shrink-0"
                >
                  {isPlaying ? (
                    <Pause size={24} />
                  ) : (
                    <Play size={24} className="ml-1" />
                  )}
                </button>

                <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-xl bg-black/20">
                  <span className="text-xs text-emerald-200/60 font-medium">
                    Speed
                  </span>
                  <select
                    value={String(settings.speed)}
                    onChange={(e) => {
                      const newSpeed = parseFloat(e.target.value);
                      onSpeedChange(newSpeed);
                    }}
                    className="bg-transparent text-sm font-bold text-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">Normal</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="audio-timeline w-full h-2 rounded-full cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-emerald-200/40 font-mono font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              className="hidden"
              onCanPlay={onEnforceSpeed}
            />
          </div>
        ) : (
          <button
            onClick={onGenerateAudio}
            disabled={isGeneratingAudio}
            className="pointer-events-auto flex items-center gap-3 fab-3d text-white px-8 py-4 rounded-full font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform"
          >
            {isGeneratingAudio ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                {settings.lang === "th"
                  ? "กำลังสร้างเสียง..."
                  : "Generating Audio..."}
              </>
            ) : (
              <>
                <Volume2 size={24} />
                {settings.lang === "th"
                  ? "สร้างเสียงบทสนทนา"
                  : "Generate Audio"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
