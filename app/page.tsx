"use client";

import { useState, useCallback, useEffect } from "react";
import { AlertCircle } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { ExplanationModal } from "@/components/modals/ExplanationModal";
import { HomeView } from "@/components/home/HomeView";
import { LearnView } from "@/components/learn/LearnView";
import { QuizView } from "@/components/quiz/QuizView";

import { useLocalStorageString } from "@/hooks/useLocalStorage";
import { useAudioPlayer, pcmToWav } from "@/hooks/useAudioPlayer";

import { RoleplayView } from "@/components/roleplay/RoleplayView";

import {
  Settings,
  Conversation,
  Character,
  ChatMessage,
  DialogueLine,
  TargetLanguage,
  TopicMode,
  AppMode,
  EnglishAccent,
} from "@/types";

import {
  SYSTEM_PROMPT_JAPANESE,
  SYSTEM_PROMPT_ENGLISH,
  CONVERSATION_TAGS,
  TEST_SCORE_CONFIG,
  EnglishLevelMode,
} from "@/constants/prompts";

export default function Home() {
  // --- State ---
  const [apiKey, setApiKey] = useLocalStorageString("gemini_api_key", "");
  const [selectedModel, setSelectedModel] = useLocalStorageString(
    "gemini_model",
    "gemini-3-flash-preview"
  );
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<Settings>({
    level: "N5",
    speed: 1.0,
    lang: "th",
  });

  const [mode, setMode] = useState<AppMode>("home");

  // Topic Selection State
  const [topicMode, setTopicMode] = useState<TopicMode>("random");
  const [selectedTag, setSelectedTag] = useState("");
  const [customTopic, setCustomTopic] = useState("");

  // Language Selection State
  const [targetLanguage, setTargetLanguage] =
    useState<TargetLanguage>("japanese");
  const [selectedAccent, setSelectedAccent] =
    useState<EnglishAccent>("american");
  const [englishLevelMode, setEnglishLevelMode] =
    useState<EnglishLevelMode>("cefr");
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [testScore, setTestScore] = useState<number>(600);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [charactersData, setCharactersData] = useState<Character[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Audio State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Audio Player Hook
  const {
    audioRef,
    audioUrl,
    setAudioUrl,
    isPlaying,
    currentTime,
    duration,
    activeBubbleIndex,
    toggleAudio,
    handleSeek,
    handleJumpToDialogue,
    handleRepeatDialogue,
  } = useAudioPlayer({ conversation, speed: settings.speed });

  // Quiz State
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([
    null,
    null,
    null,
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");

  // Explanation Dialog State
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [explanationLine, setExplanationLine] = useState<DialogueLine | null>(
    null
  );
  const [isExplaining, setIsExplaining] = useState(false);

  // Check chat unlock on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const unlocked = localStorage.getItem("chat_unlocked") === "true";
      setIsChatUnlocked(unlocked);
    }
  }, []);

  // --- Helpers ---

  const enforceSpeed = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.speed;
    }
  }, [settings.speed, audioRef]);

  // --- API Logic ---

  const generateContent = async () => {
    setLoading(true);
    setLoadingText(
      settings.lang === "th"
        ? "กำลังสร้างบทสนทนา..."
        : "Generating conversation..."
    );
    setError(null);
    setConversation(null);
    setAvatars({});
    setAudioUrl(null);

    try {
      // Build language and topic-specific prompt
      let topicPrompt = "";

      if (targetLanguage === "japanese") {
        if (settings.level === "Daily") {
          topicPrompt = `Generate a Japanese conversation for daily life situations in Japan. 
Focus on practical, realistic conversations that someone living in Japan would encounter regularly.
Examples: talking to a landlord, at the convenience store, asking for directions, dealing with delivery services, 
at the municipal office, talking to neighbors, at the bank, etc.
Use natural Japanese that native speakers would actually use (including casual forms, colloquialisms, and polite forms as appropriate).
Mix difficulty levels but make it practical and useful for daily survival in Japan.`;
        } else {
          topicPrompt = `Generate a Japanese conversation for JLPT ${settings.level} level.`;
        }
      } else {
        // English - handle different test types
        const accentNote = `Use ${
          selectedAccent === "british"
            ? "British"
            : selectedAccent === "australian"
            ? "Australian"
            : "American"
        } English spelling and expressions.`;

        if (settings.level === "Daily") {
          topicPrompt = `Generate an English conversation for daily life situations. 
Focus on practical, realistic conversations that someone living in an English-speaking country would encounter regularly.
Examples: talking to a landlord, at the grocery store, asking for directions, dealing with delivery services, 
at the post office, talking to neighbors, at the bank, making appointments, etc.
Use natural English that native speakers would actually use (including informal expressions as appropriate).
${accentNote}`;
        } else if (settings.level === "IELTS") {
          topicPrompt = `Generate an English conversation suitable for IELTS Speaking test preparation.
Target score level: Band ${testScore.toFixed(1)}
Focus on topics commonly found in IELTS: education, travel, technology, environment, health, work, hobbies.
Include a variety of question types: personal questions, describe something, discussion of abstract topics.
Use vocabulary and structures appropriate for Band ${testScore.toFixed(
            1
          )} level.
${accentNote}`;
        } else if (settings.level === "TOEIC") {
          topicPrompt = `Generate an English conversation suitable for TOEIC test preparation.
Target score level: ${testScore} points
Focus on business and workplace scenarios: meetings, phone calls, negotiations, presentations, office conversations.
Use professional vocabulary and formal register appropriate for business contexts.
Difficulty should match a ${
            testScore >= 800
              ? "high"
              : testScore >= 600
              ? "intermediate"
              : "beginner"
          } level learner aiming for ${testScore} points.
${accentNote}`;
        } else if (settings.level === "TOEFL") {
          topicPrompt = `Generate an English conversation suitable for TOEFL iBT test preparation.
Target score level: ${testScore} points (out of 120)
Focus on academic scenarios: university discussions, lectures, study groups, campus life.
Use academic vocabulary and structures typical of university settings.
Difficulty should match someone aiming for a ${testScore} total score.
${accentNote}`;
        } else {
          topicPrompt = `Generate an English conversation for CEFR ${settings.level} level. ${accentNote}`;
        }
      }

      // Add topic if selected
      if (topicMode === "tag" && selectedTag) {
        const tag = CONVERSATION_TAGS.find((t) => t.id === selectedTag);
        if (tag) {
          const topicDesc =
            targetLanguage === "japanese" ? `${tag.ja} (${tag.en})` : tag.en;
          topicPrompt += ` The conversation should be about: ${topicDesc}.`;
        }
      } else if (topicMode === "custom" && customTopic.trim()) {
        topicPrompt += ` The conversation should be about: ${customTopic.trim()}.`;
      }

      // Select correct system prompt based on language
      const systemPrompt =
        targetLanguage === "japanese"
          ? SYSTEM_PROMPT_JAPANESE
          : SYSTEM_PROMPT_ENGLISH;

      const textResponse = await fetch("/api/generate-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicPrompt,
          systemPrompt,
          userApiKey: apiKey || undefined,
          model: selectedModel,
        }),
      });

      if (!textResponse.ok) {
        const errorData = await textResponse.json();
        throw new Error(
          errorData.error || "API Error: Failed to generate conversation"
        );
      }

      const textData = await textResponse.json();
      const convData: Conversation = JSON.parse(
        textData.candidates[0].content.parts[0].text
      );
      setConversation(convData);
      setCharactersData(convData.characters);

      setLoadingText(
        settings.lang === "th" ? "กำลังวาดตัวละคร..." : "Generating avatars..."
      );
      await generateAvatars(convData.characters);

      setMode("learn");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const generateAvatars = async (characters: Character[]) => {
    try {
      const newAvatars: Record<string, string> = {};
      characters.forEach((c) => {
        newAvatars[
          c.name
        ] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      });
      setAvatars(newAvatars);
    } catch (e) {
      console.error("Avatar generation failed", e);
    }
  };

  const generateFullAudio = async () => {
    if (!conversation || !charactersData.length) return;

    setIsGeneratingAudio(true);
    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationData: conversation,
          charactersData: charactersData,
          userApiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const data = await response.json();

      if (!data.audioData) {
        throw new Error("Invalid audio response format");
      }

      const base64Audio = data.audioData;

      if (!base64Audio) {
        throw new Error("Empty audio data received");
      }

      try {
        const cleanBase64 = base64Audio.replace(/\s/g, "");
        const wav = pcmToWav(cleanBase64, 24000);

        const blob = new Blob([wav], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);

        setAudioUrl(url);
      } catch (conversionError) {
        console.error("PCM to WAV conversion failed:", conversionError);
        throw new Error(`Failed to process audio data: ${conversionError}`);
      }
    } catch (e) {
      console.error("Audio generation failed", e);
      setError(
        settings.lang === "th"
          ? "ไม่สามารถสร้างเสียงได้"
          : "Failed to generate audio"
      );
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // --- Quiz Logic ---

  const startQuiz = () => {
    setMode("quiz");
    setCurrentQuestionIndex(0);
    setUserAnswers([null, null, null]);
    setShowQuizResults(false);
    setQuizScore(0);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const calculateQuizScore = (): number => {
    if (!conversation?.quiz) return 0;
    let correct = 0;
    conversation.quiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / conversation.quiz.length) * 100);
  };

  const submitQuiz = () => {
    const score = calculateQuizScore();
    setQuizScore(score);
    setShowQuizResults(true);
  };

  // --- Chat Logic ---

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading || !conversation) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          conversationData: conversation,
          targetLanguage,
          userApiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      setChatMessages((prev) => [...prev, { role: "ai", text: data.message }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            settings.lang === "th"
              ? "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
              : "Sorry, there was an error. Please try again.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleUnlockChat = () => {
    if (unlockCode.trim().toLowerCase() === "aof") {
      setIsChatUnlocked(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("chat_unlocked", "true");
      }
      setUnlockCode("");
    } else {
      alert(settings.lang === "th" ? "รหัสไม่ถูกต้อง" : "Invalid code");
      setUnlockCode("");
    }
  };

  // --- Explanation Logic ---

  const handleExplainSentence = async (line: DialogueLine) => {
    setExplanationLine(line);
    setShowExplanation(true);
    setIsExplaining(true);
    setExplanationText("");

    try {
      const languageName =
        targetLanguage === "japanese" ? "Japanese" : "English";
      const outputLang = settings.lang === "th" ? "Thai" : "English";

      const prompt = `อธิบายประโยค${
        languageName === "Japanese" ? "ภาษาญี่ปุ่น" : "ภาษาอังกฤษ"
      }นี้:

"${line.text}"
${line.reading ? `(${line.reading})` : ""}
แปลว่า: ${line.en}

ตอบเป็นภาษา${
        outputLang === "Thai" ? "ไทย" : "อังกฤษ"
      } กระชับตรงประเด็น ใช้ format นี้:

[โครงสร้างประโยค]
อธิบายโครงสร้างไวยากรณ์ของประโยคนี้ 2-3 ประโยค

[คำศัพท์และคันจิ]
- คำ1 (อ่าน): ความหมาย
- คำ2 (อ่าน): ความหมาย
(แยกทุกคำสำคัญพร้อมคันจิถ้ามี)

[ไวยากรณ์]
อธิบาย grammar patterns ที่ใช้ในประโยคนี้

[ตัวอย่างประโยค]
1. ประโยค - แปล
2. ประโยค - แปล

ห้ามใช้ ** หรือ markdown ใช้ [] สำหรับหัวข้อแทน ไม่ต้องมีคำทักทายหรือลงท้าย`;

      const response = await fetch("/api/generate-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicPrompt: prompt,
          systemPrompt: `ตอบกระชับ ตรงประเด็น ใช้ [] สำหรับหัวข้อ ห้ามใช้ ** หรือ markdown อื่น ไม่มี intro/outro`,
          userApiKey: apiKey || undefined,
          model: selectedModel,
          responseType: "text",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get explanation");
      }

      const data = await response.json();
      const explanation = data.candidates[0].content.parts[0].text;
      setExplanationText(explanation);
    } catch (err) {
      console.error("Explanation error:", err);
      setExplanationText(
        settings.lang === "th"
          ? "ขออภัย ไม่สามารถอธิบายได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
          : "Sorry, unable to explain at the moment. Please try again."
      );
    } finally {
      setIsExplaining(false);
    }
  };

  // --- Language/Level Change Handlers ---

  const handleTargetLanguageChange = (lang: TargetLanguage) => {
    setTargetLanguage(lang);
    setSettings((s) => ({
      ...s,
      level: lang === "japanese" ? "N5" : "A1",
    }));
  };

  const handleSpeedChange = (speed: number) => {
    setSettings((s) => ({ ...s, speed }));
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-transparent text-slate-200 font-sans selection:bg-emerald-500/30">
      <Navbar
        mode={mode}
        settings={settings}
        onHomeClick={() => setMode("home")}
        onSettingsClick={() => setShowSettings(true)}
        onLanguageToggle={() =>
          setSettings((s) => ({ ...s, lang: s.lang === "th" ? "en" : "th" }))
        }
        onResetClick={() => setMode("home")}
      />

      <main className="max-w-5xl mx-auto px-4 pt-24 pb-10">
        {error && (
          <div className="glass-card bg-red-500/10 border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertCircle /> {error}
          </div>
        )}

        {mode === "home" && (
          <HomeView
            settings={settings}
            targetLanguage={targetLanguage}
            topicMode={topicMode}
            selectedTag={selectedTag}
            customTopic={customTopic}
            selectedModel={selectedModel}
            selectedAccent={selectedAccent}
            englishLevelMode={englishLevelMode}
            selectedTest={selectedTest}
            testScore={testScore}
            loading={loading}
            loadingText={loadingText}
            onTargetLanguageChange={handleTargetLanguageChange}
            onLevelChange={(level) => setSettings((s) => ({ ...s, level }))}
            onTopicModeChange={setTopicMode}
            onTagSelect={setSelectedTag}
            onCustomTopicChange={setCustomTopic}
            onModelChange={setSelectedModel}
            onAccentChange={setSelectedAccent}
            onEnglishLevelModeChange={setEnglishLevelMode}
            onTestChange={setSelectedTest}
            onTestScoreChange={setTestScore}
            onGenerate={generateContent}
            onStartRoleplay={() => setMode("roleplay")}
          />
        )}

        {mode === "roleplay" && (
          <RoleplayView
            settings={settings}
            targetLanguage={targetLanguage}
            onGoHome={() => setMode("home")}
          />
        )}

        {mode === "learn" && conversation && (
          <LearnView
            conversation={conversation}
            charactersData={charactersData}
            avatars={avatars}
            settings={settings}
            audioUrl={audioUrl}
            audioRef={audioRef}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            activeBubbleIndex={activeBubbleIndex}
            isGeneratingAudio={isGeneratingAudio}
            onToggleAudio={toggleAudio}
            onSeek={handleSeek}
            onJumpToDialogue={handleJumpToDialogue}
            onRepeatDialogue={handleRepeatDialogue}
            onGenerateAudio={generateFullAudio}
            onSpeedChange={handleSpeedChange}
            onEnforceSpeed={enforceSpeed}
            onStartQuiz={startQuiz}
            onExplainSentence={handleExplainSentence}
            showChat={showChat}
            onToggleChat={() => setShowChat(!showChat)}
            isChatUnlocked={isChatUnlocked}
            unlockCode={unlockCode}
            onUnlockCodeChange={setUnlockCode}
            onUnlockChat={handleUnlockChat}
            chatMessages={chatMessages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendChat={sendChatMessage}
            isChatLoading={isChatLoading}
          />
        )}

        {mode === "quiz" && conversation && (
          <QuizView
            conversation={conversation}
            settings={settings}
            userAnswers={userAnswers}
            currentQuestionIndex={currentQuestionIndex}
            showQuizResults={showQuizResults}
            quizScore={quizScore}
            onAnswerSelect={handleAnswerSelect}
            onPrevious={() =>
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
            }
            onNext={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            onSubmit={submitQuiz}
            onGoHome={() => setMode("home")}
            onReviewLesson={() => setMode("learn")}
          />
        )}
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />

      <ExplanationModal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
        line={explanationLine}
        explanation={explanationText}
        isLoading={isExplaining}
        lang={settings.lang}
      />
    </div>
  );
}
