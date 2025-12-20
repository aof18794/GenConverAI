"use client";

import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { Settings, TargetLanguage, TopicMode, EnglishAccent } from "@/types";
import {
  CONVERSATION_TAGS,
  MODEL_OPTIONS,
  JAPANESE_LEVELS,
  ENGLISH_CEFR_LEVELS,
  ENGLISH_TEST_TYPES,
  TEST_SCORE_CONFIG,
  ENGLISH_ACCENTS,
  EnglishLevelMode,
} from "@/constants/prompts";

interface HomeViewProps {
  settings: Settings;
  targetLanguage: TargetLanguage;
  topicMode: TopicMode;
  selectedTag: string;
  customTopic: string;
  selectedModel: string;
  selectedAccent: EnglishAccent;
  englishLevelMode: EnglishLevelMode;
  selectedTest: string;
  testScore: number;
  loading: boolean;
  loadingText: string;
  onTargetLanguageChange: (lang: TargetLanguage) => void;
  onLevelChange: (level: string) => void;
  onTopicModeChange: (mode: TopicMode) => void;
  onTagSelect: (tag: string) => void;
  onCustomTopicChange: (topic: string) => void;
  onModelChange: (model: string) => void;
  onAccentChange: (accent: EnglishAccent) => void;
  onEnglishLevelModeChange: (mode: EnglishLevelMode) => void;
  onTestChange: (test: string) => void;
  onTestScoreChange: (score: number) => void;
  onGenerate: () => void;
}

export function HomeView({
  settings,
  targetLanguage,
  topicMode,
  selectedTag,
  customTopic,
  selectedModel,
  selectedAccent,
  englishLevelMode,
  selectedTest,
  testScore,
  loading,
  loadingText,
  onTargetLanguageChange,
  onLevelChange,
  onTopicModeChange,
  onTagSelect,
  onCustomTopicChange,
  onModelChange,
  onAccentChange,
  onEnglishLevelModeChange,
  onTestChange,
  onTestScoreChange,
  onGenerate,
}: HomeViewProps) {
  // Helper function to get display label for levels
  const getDisplayLabel = (lvl: string) => {
    if (lvl === "Daily") {
      return settings.lang === "th" ? "🏠 ชีวิตจริง" : "🏠 Daily";
    }
    return lvl;
  };

  // Get test config for selected test
  const testConfig = selectedTest
    ? TEST_SCORE_CONFIG[selectedTest as keyof typeof TEST_SCORE_CONFIG]
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 md:space-y-8 animate-in fade-in duration-700 px-4">
      <div className="space-y-3 md:space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight animate-float">
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
            GenConver
          </span>
          <span className="text-slate-100">AI</span>
        </h1>
        <p className="text-emerald-200/60 max-w-md mx-auto text-base md:text-lg px-4">
          {settings.lang === "th"
            ? targetLanguage === "japanese"
              ? "ฝึกบทสนทนาภาษาญี่ปุ่นอย่างเป็นธรรมชาติ"
              : "ฝึกบทสนทนาภาษาอังกฤษอย่างเป็นธรรมชาติ"
            : targetLanguage === "japanese"
            ? "Master Japanese Conversation Naturally"
            : "Master English Conversation Naturally"}
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-md glass-card p-1 rounded-xl">
        <button
          onClick={() => onTargetLanguageChange("japanese")}
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            targetLanguage === "japanese"
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50"
              : "text-emerald-200/60 hover:text-emerald-100"
          }`}
        >
          🇯🇵 {settings.lang === "th" ? "ภาษาญี่ปุ่น" : "Japanese"}
        </button>
        <button
          onClick={() => onTargetLanguageChange("english")}
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            targetLanguage === "english"
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50"
              : "text-emerald-200/60 hover:text-emerald-100"
          }`}
        >
          🇬🇧 {settings.lang === "th" ? "ภาษาอังกฤษ" : "English"}
        </button>
      </div>

      {/* Japanese Level Selection */}
      {targetLanguage === "japanese" && (
        <div className="w-full max-w-3xl px-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wide mb-3 text-center">
            {settings.lang === "th" ? "ระดับ JLPT" : "JLPT Level"}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 md:gap-4 w-full">
            {JAPANESE_LEVELS.map((lvl) => {
              const displayLabel = getDisplayLabel(lvl);
              const isSpecial = lvl === "Daily";

              return (
                <button
                  key={lvl}
                  onClick={() => onLevelChange(lvl)}
                  className={`level-card p-2 sm:p-3 md:p-4 rounded-xl md:rounded-2xl ${
                    settings.level === lvl
                      ? "active text-emerald-300"
                      : "text-emerald-200/50"
                  }`}
                >
                  <div
                    className={`font-bold ${
                      isSpecial
                        ? "text-xs sm:text-sm"
                        : "text-base sm:text-lg md:text-xl"
                    }`}
                  >
                    {displayLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* English Level Selection - Tabbed Interface */}
      {targetLanguage === "english" && (
        <div className="w-full max-w-3xl px-2 space-y-4">
          <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wide text-center">
            {settings.lang === "th" ? "ระดับ / ประเภท" : "Level / Type"}
          </h3>

          {/* Tab Selector */}
          <div className="flex gap-1 glass-card p-1 rounded-xl">
            <button
              onClick={() => onEnglishLevelModeChange("cefr")}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                englishLevelMode === "cefr"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg"
                  : "text-emerald-200/60 hover:text-emerald-100"
              }`}
            >
              📚 {settings.lang === "th" ? "ระดับ CEFR" : "CEFR Level"}
            </button>
            <button
              onClick={() => onEnglishLevelModeChange("test")}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                englishLevelMode === "test"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg"
                  : "text-emerald-200/60 hover:text-emerald-100"
              }`}
            >
              📝 {settings.lang === "th" ? "ประเภทข้อสอบ" : "Test Type"}
            </button>
            <button
              onClick={() => {
                onEnglishLevelModeChange("other");
                onLevelChange("Daily");
              }}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                englishLevelMode === "other"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg"
                  : "text-emerald-200/60 hover:text-emerald-100"
              }`}
            >
              🏠 {settings.lang === "th" ? "อื่นๆ" : "Other"}
            </button>
          </div>

          {/* CEFR Levels Grid */}
          {englishLevelMode === "cefr" && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 animate-in fade-in duration-300">
              {ENGLISH_CEFR_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onLevelChange(lvl)}
                  className={`level-card p-3 sm:p-4 rounded-xl ${
                    settings.level === lvl
                      ? "active text-emerald-300"
                      : "text-emerald-200/50"
                  }`}
                >
                  <div className="text-lg sm:text-xl font-bold">{lvl}</div>
                </button>
              ))}
            </div>
          )}

          {/* Test Type Selection with Score Slider */}
          {englishLevelMode === "test" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Test Type Buttons */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {ENGLISH_TEST_TYPES.map((test) => (
                  <button
                    key={test}
                    onClick={() => {
                      onTestChange(test);
                      onLevelChange(test);
                      // Set default score for the test
                      const config =
                        TEST_SCORE_CONFIG[
                          test as keyof typeof TEST_SCORE_CONFIG
                        ];
                      onTestScoreChange(config.default);
                    }}
                    className={`level-card p-3 sm:p-4 rounded-xl ${
                      selectedTest === test
                        ? "active text-emerald-300"
                        : "text-emerald-200/50"
                    }`}
                  >
                    <div className="text-sm sm:text-base font-bold">
                      {test === "IELTS" && "📝 "}
                      {test === "TOEIC" && "💼 "}
                      {test === "TOEFL" && "🎓 "}
                      {test}
                    </div>
                  </button>
                ))}
              </div>

              {/* Score Slider */}
              {selectedTest && testConfig && (
                <div className="glass-card p-4 rounded-xl space-y-3 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-200/70">
                      {settings.lang === "th"
                        ? "คะแนนเป้าหมาย"
                        : "Target Score"}
                    </span>
                    <span className="text-lg font-bold text-emerald-300">
                      {testConfig.unit}{" "}
                      {selectedTest === "IELTS"
                        ? testScore.toFixed(1)
                        : testScore}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={testConfig.min}
                    max={testConfig.max}
                    step={testConfig.step}
                    value={testScore}
                    onChange={(e) =>
                      onTestScoreChange(parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-emerald-900/50 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                      [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:hover:bg-emerald-300 [&::-webkit-slider-thumb]:transition-colors"
                  />
                  <div className="flex justify-between text-xs text-emerald-200/40">
                    <span>
                      {testConfig.min}
                      {selectedTest === "IELTS" ? ".0" : ""}
                    </span>
                    <span>
                      {testConfig.max}
                      {selectedTest === "IELTS" ? ".0" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other - Daily Life */}
          {englishLevelMode === "other" && (
            <div className="glass-card p-4 rounded-xl text-center animate-in fade-in duration-300">
              <div className="text-3xl mb-2">🏠</div>
              <div className="text-lg font-bold text-emerald-300">
                {settings.lang === "th"
                  ? "บทสนทนาในชีวิตจริง"
                  : "Daily Life Conversations"}
              </div>
              <p className="text-sm text-emerald-200/50 mt-2">
                {settings.lang === "th"
                  ? "ฝึกบทสนทนาที่ใช้จริงในชีวิตประจำวัน"
                  : "Practice real-life everyday conversations"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Accent Selector (English only) */}
      {targetLanguage === "english" && (
        <div className="w-full max-w-md px-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wide mb-3 text-center">
            {settings.lang === "th" ? "สำเนียง" : "Accent"}
          </h3>
          <div className="flex gap-2 glass-card p-1 rounded-xl">
            {ENGLISH_ACCENTS.map((accent) => (
              <button
                key={accent.id}
                onClick={() => onAccentChange(accent.id as EnglishAccent)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-xs sm:text-sm ${
                  selectedAccent === accent.id
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50"
                    : "text-emerald-200/60 hover:text-emerald-100"
                }`}
              >
                {accent.emoji} {accent.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic Selection */}
      <div className="w-full max-w-2xl space-y-3 md:space-y-4 px-2">
        <h3 className="text-xs sm:text-sm font-bold text-emerald-300/80 uppercase tracking-wide text-center">
          {settings.lang === "th"
            ? "เลือกหัวข้อบทสนทนา"
            : "Select Conversation Topic"}
        </h3>

        {/* Mode Selection Tabs */}
        <div className="flex gap-2 glass-card p-1 rounded-xl">
          <button
            onClick={() => onTopicModeChange("random")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              topicMode === "random"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50"
                : "text-emerald-200/60 hover:text-emerald-100"
            }`}
          >
            🎲 {settings.lang === "th" ? "สุ่ม" : "Random"}
          </button>
          <button
            onClick={() => onTopicModeChange("tag")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              topicMode === "tag"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50"
                : "text-emerald-200/60 hover:text-emerald-100"
            }`}
          >
            🏷️ {settings.lang === "th" ? "หมวดหมู่" : "Categories"}
          </button>
          <button
            onClick={() => onTopicModeChange("custom")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              topicMode === "custom"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/50"
                : "text-emerald-200/60 hover:text-emerald-100"
            }`}
          >
            ✏️ {settings.lang === "th" ? "กำหนดเอง" : "Custom"}
          </button>
        </div>

        {/* Tag Selection Grid */}
        {topicMode === "tag" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 animate-in fade-in duration-300">
            {CONVERSATION_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onTagSelect(tag.id)}
                className={`category-card p-3 sm:p-4 rounded-lg sm:rounded-xl ${
                  selectedTag === tag.id
                    ? "selected text-emerald-300"
                    : "text-emerald-200/60"
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">
                  {tag.emoji}
                </div>
                <div className="text-[10px] sm:text-xs font-bold">
                  {settings.lang === "th" ? tag.th : tag.en}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Custom Topic Input */}
        {topicMode === "custom" && (
          <div className="animate-in fade-in duration-300">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => onCustomTopicChange(e.target.value)}
              placeholder={
                settings.lang === "th"
                  ? 'พิมพ์หัวข้อที่คุณต้องการ เช่น "ที่สนามบิน" หรือ "สั่งกาแฟ"'
                  : 'Enter your topic, e.g., "At the airport" or "Ordering coffee"'
              }
              className="input-glow w-full rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-slate-200 placeholder-emerald-200/30"
            />
          </div>
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={loading}
        className="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 btn-3d text-white text-base sm:text-lg md:text-xl font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs animate-pulse-glow"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <Loader2 className="animate-spin" /> {loadingText}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {settings.lang === "th" ? "เริ่มฝึกฝน" : "Start Practice"}{" "}
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </button>

      {/* Model Selector */}
      <div className="flex items-center gap-2 text-xs text-emerald-200/50">
        <span>🤖 {settings.lang === "th" ? "โมเดล:" : "Model:"}</span>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="bg-transparent border border-emerald-500/30 rounded-lg px-2 py-1 text-emerald-300 text-xs cursor-pointer hover:border-emerald-400/50 transition-colors outline-none"
        >
          {MODEL_OPTIONS.map((model) => (
            <option
              key={model.id}
              value={model.id}
              className="bg-slate-900 text-emerald-300"
            >
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
