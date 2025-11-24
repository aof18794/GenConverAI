import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Mic, MessageCircle, 
  Settings, BookOpen, Languages, ChevronRight, 
  Volume2, CheckCircle, AlertCircle, Loader2,
  GraduationCap, X, Image as ImageIcon, SkipBack, SkipForward, Square
} from 'lucide-react';

// --- API Constants & Prompts ---

const SYSTEM_PROMPT_JAPANESE = `
You are an expert Japanese language teacher. 
Generate a realistic, natural Japanese conversation based on the requested JLPT level.

IMPORTANT REQUIREMENTS:
1. Define EXACTLY 2 characters:
   - Male character Name: "Kore"
   - Female character Name: "Puck"
2. Output a "characters" array defining their gender clearly.
3. The conversation should sound like real friends or colleagues talking.
4. CRITICAL: The "speaker" name in the "dialogue" array MUST MATCH EXACTLY "Kore" or "Puck". Do not add honorifics like '-san' in the speaker field.
5. Generate EXACTLY 3 quiz questions about the conversation in JLPT style (multiple choice with 4 options).

Output MUST be valid JSON only. No markdown blocks.
Structure:
{
  "title": "Short title of topic (Japanese)",
  "title_th": "Short title of topic (Thai translation)",
  "level": "N5/N4/N3",
  "situation": "Brief description of the situation (English)",
  "situation_th": "Brief description of the situation (Thai translation)",
  "characters": [
    { "name": "Kore", "gender": "male" },
    { "name": "Puck", "gender": "female" }
  ],
  "dialogue": [
    {
      "speaker": "Kore", 
      "text": "Japanese text (Kanji mixed)",
      "reading": "Hiragana reading",
      "romaji": "Romaji",
      "en": "English translation",
      "th": "Thai translation"
    },
    ...
  ],
  "vocabulary": [
    { "word": "Word", "reading": "Reading", "meaning_en": "Meaning", "meaning_th": "Meaning" }
  ],
  "grammar": [
    { "point": "Grammar Point", "explanation_en": "Explanation", "explanation_th": "Explanation" }
  ],
  "quiz": [
    {
      "question_ja": "Question in Japanese",
      "question_en": "Question in English", 
      "question_th": "Question in Thai",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation_en": "Why this answer is correct",
      "explanation_th": "Why this answer is correct (Thai)"
    }
  ]
}
`;

const SYSTEM_PROMPT_ENGLISH = `
You are an expert English language teacher. 
Generate a realistic, natural English conversation based on the requested CEFR level (A1, A2, B1, B2, C1, C2).

IMPORTANT REQUIREMENTS:
1. Define EXACTLY 2 characters:
   - Male character Name: "Alex"
   - Female character Name: "Sam"
2. Output a "characters" array defining their gender clearly.
3. The conversation should sound like real friends or colleagues talking.
4. CRITICAL: The "speaker" name in the "dialogue" array MUST MATCH EXACTLY "Alex" or "Sam".
5. Generate EXACTLY 3 quiz questions about the conversation (grammar, vocabulary, comprehension) with multiple choice (4 options).

Output MUST be valid JSON only. No markdown blocks.
Structure:
{
  "title": "Short title of topic (English)",
  "title_th": "Short title of topic (Thai translation)",
  "level": "A1/A2/B1/B2/C1/C2",
  "situation": "Brief description of the situation (English)",
  "situation_th": "Brief description of the situation (Thai translation)",
  "characters": [
    { "name": "Alex", "gender": "male" },
    { "name": "Sam", "gender": "female" }
  ],
  "dialogue": [
    {
      "speaker": "Alex", 
      "text": "English text",
      "reading": "",
      "romaji": "",
      "en": "Same as text",
      "th": "Thai translation"
    },
    ...
  ],
  "vocabulary": [
    { "word": "Word", "reading": "", "meaning_en": "Meaning", "meaning_th": "Meaning" }
  ],
  "grammar": [
    { "point": "Grammar Point", "explanation_en": "Explanation", "explanation_th": "Explanation" }
  ],
  "quiz": [
    {
      "question_ja": "",
      "question_en": "Question in English", 
      "question_th": "Question in Thai",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation_en": "Why this answer is correct",
      "explanation_th": "Why this answer is correct (Thai)"
    }
  ]
}
`;

// Removed SYSTEM_PROMPT_EVALUATE - no longer needed for quiz mode

// --- Predefined Conversation Tags ---
const CONVERSATION_TAGS = [
  { id: 'restaurant', emoji: '🍜', ja: 'レストランで', en: 'At Restaurant', th: 'ที่ร้านอาหาร' },
  { id: 'shopping', emoji: '🛒', ja: '買い物', en: 'Shopping', th: 'ช้อปปิ้ง' },
  { id: 'school', emoji: '🏫', ja: '学校で', en: 'At School', th: 'ที่โรงเรียน' },
  { id: 'travel', emoji: '🚃', ja: '旅行', en: 'Travel', th: 'ท่องเที่ยว' },
  { id: 'friends', emoji: '👥', ja: '友達と', en: 'With Friends', th: 'กับเพื่อน' },
  { id: 'work', emoji: '🏢', ja: '仕事', en: 'Work', th: 'ที่ทำงาน' },
  { id: 'hospital', emoji: '🏥', ja: '病院で', en: 'At Hospital', th: 'ที่โรงพยาบาล' },
  { id: 'phone', emoji: '📞', ja: '電話で', en: 'Phone Call', th: 'โทรศัพท์' },
];

// --- Components ---

const App = () => {
  // --- State ---
  // Optional: User can provide their own API key (stored in localStorage)
  // Falls back to server-side API key if not provided
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("gemini_api_key") || "";
  });
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    level: 'N5',
    speed: 1.0,
    lang: 'th'
  });
  
  const [mode, setMode] = useState('home'); // home, learn, quiz
  
  // Topic Selection State
  const [topicMode, setTopicMode] = useState('random'); // 'random' | 'tag' | 'custom'
  const [selectedTag, setSelectedTag] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  
  // Language Selection State
  const [targetLanguage, setTargetLanguage] = useState('japanese'); // 'japanese' | 'english'
  
  const [conversation, setConversation] = useState(null);
  const [charactersData, setCharactersData] = useState([]); // Store full character data
  const [avatars, setAvatars] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState(null);
  
  // Audio State
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeBubbleIndex, setActiveBubbleIndex] = useState(-1);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Quiz State
  const [userAnswers, setUserAnswers] = useState([null, null, null]); // 3 questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0); 

  // Refs
  const audioRef = useRef(null);

  // --- Effects ---

  // Save API Key to localStorage whenever it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("gemini_api_key", apiKey);
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  }, [apiKey]);

  const enforceSpeed = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.speed;
    }
  }, [settings.speed]);

  useEffect(() => {
    enforceSpeed();
  }, [enforceSpeed, audioUrl, isPlaying]);

  // Audio Progress & Bubble Highlighting
  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current && conversation) {
        const curr = audioRef.current.currentTime;
        const dur = audioRef.current.duration || 1;
        setCurrentTime(curr);
        setDuration(dur);

        const totalChars = conversation.dialogue.reduce((acc, line) => acc + line.text.length, 0);
        const progressRatio = curr / dur;
        const targetCharCount = progressRatio * totalChars;

        let charSum = 0;
        let foundIndex = -1;
        for (let i = 0; i < conversation.dialogue.length; i++) {
          charSum += conversation.dialogue[i].text.length;
          if (charSum >= targetCharCount) {
            foundIndex = i;
            break;
          }
        }
        if (foundIndex !== -1) {
          setActiveBubbleIndex(foundIndex);
        }
      }
    };

    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.addEventListener('timeupdate', updateProgress);
      audioEl.addEventListener('loadedmetadata', updateProgress);
      audioEl.addEventListener('loadedmetadata', enforceSpeed); 
      audioEl.addEventListener('play', enforceSpeed);
      audioEl.addEventListener('ended', () => setIsPlaying(false));
    }
    return () => {
      if (audioEl) {
        audioEl.removeEventListener('timeupdate', updateProgress);
        audioEl.removeEventListener('loadedmetadata', updateProgress);
        audioEl.removeEventListener('loadedmetadata', enforceSpeed);
        audioEl.removeEventListener('play', enforceSpeed);
        audioEl.removeEventListener('ended', () => setIsPlaying(false));
      }
    };
  }, [conversation, audioUrl, settings.speed, enforceSpeed]);



  // --- Helpers ---




  // --- API Logic ---

  const generateContent = async () => {
    setLoading(true);
    setLoadingText(settings.lang === 'th' ? "กำลังสร้างบทสนทนา..." : "Generating conversation...");
    setError(null);
    setConversation(null);
    setAvatars({});
    setAudioUrl(null);

    try {
      // Build language and topic-specific prompt
      let topicPrompt = '';
      
      if (targetLanguage === 'japanese') {
        topicPrompt = `Generate a Japanese conversation for JLPT ${settings.level} level.`;
      } else {
        topicPrompt = `Generate an English conversation for CEFR ${settings.level} level.`;
      }
      
      // Add topic if selected
      if (topicMode === 'tag' && selectedTag) {
        const tag = CONVERSATION_TAGS.find(t => t.id === selectedTag);
        if (tag) {
          const topicDesc = targetLanguage === 'japanese' ? `${tag.ja} (${tag.en})` : tag.en;
          topicPrompt += ` The conversation should be about: ${topicDesc}.`;
        }
      } else if (topicMode === 'custom' && customTopic.trim()) {
        topicPrompt += ` The conversation should be about: ${customTopic.trim()}.`;
      }
      
      // Select correct system prompt based on language
      const systemPrompt = targetLanguage === 'japanese' ? SYSTEM_PROMPT_JAPANESE : SYSTEM_PROMPT_ENGLISH;
      
      // Call our server-side API endpoint
      // Send user's API key if they provided one, otherwise server will use its own
      const textResponse = await fetch('/api/generate-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicPrompt,
          systemPrompt,
          userApiKey: apiKey || undefined // Send user's key if available
        })
      });
      
      if (!textResponse.ok) {
        const errorData = await textResponse.json();
        throw new Error(errorData.error || "API Error: Failed to generate conversation");
      }
      
      const textData = await textResponse.json();
      const convData = JSON.parse(textData.candidates[0].content.parts[0].text);
      setConversation(convData);
      setCharactersData(convData.characters); 

      setLoadingText(settings.lang === 'th' ? "กำลังวาดตัวละคร..." : "Generating avatars...");
      await generateAvatars(convData.situation, convData.characters);

      setLoadingText(settings.lang === 'th' ? "กำลังวาดตัวละคร..." : "Generating avatars...");
      await generateAvatars(convData.situation, convData.characters);

      // Audio is now generated manually by the user
      // setLoadingText(settings.lang === 'th' ? "กำลังสร้างเสียง..." : "Generating audio...");
      // await generateFullAudio(convData, convData.characters);

      setMode('learn');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const generateAvatars = async (situation, characters) => {
    try {
      // Use DiceBear API for reliable avatar generation
      const newAvatars = {};
      characters.forEach(c => {
         newAvatars[c.name] = `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      });
      setAvatars(newAvatars);
    } catch (e) {
      console.error("Avatar generation failed", e);
    }
  };

  const generateFullAudio = async (convData, chars) => {
    setIsGeneratingAudio(true);
    try {
      // Call our server-side API endpoint
      // Send user's API key if they provided one
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationData: convData,
          charactersData: chars,
          userApiKey: apiKey || undefined // Send user's key if available
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const data = await response.json();
      
      // Validate response
      if (!data.audioData) {
        throw new Error('Invalid audio response format');
      }

      // Gemini returns PCM audio - convert to WAV for browser playback
      const base64Audio = data.audioData;
      
      if (!base64Audio) {
        throw new Error('Empty audio data received');
      }

      try {
        // Sanitize base64 string just in case
        const cleanBase64 = base64Audio.replace(/\s/g, '');
        const wav = pcmToWav(cleanBase64, 24000); // Gemini uses 24kHz sample rate
        
        const blob = new Blob([wav], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        
        setAudioUrl(audioUrl);
      } catch (conversionError) {
        console.error('PCM to WAV conversion failed:', conversionError);
        throw new Error(`Failed to process audio data: ${conversionError.message}`);
      }

    } catch (e) {
      console.error("Audio generation failed", e);
      setError(settings.lang === 'th' ? "ไม่สามารถสร้างเสียงได้" : "Failed to generate audio");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // --- Role Play Audio Logic ---

  // --- Quiz Logic ---

  const startQuiz = () => {
    setMode('quiz');
    setCurrentQuestionIndex(0);
    setUserAnswers([null, null, null]);
    setShowQuizResults(false);
    setQuizScore(0);
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const calculateQuizScore = () => {
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

  const pcmToWav = (base64, sampleRate) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const buffer = new ArrayBuffer(44 + len);
    const view = new DataView(buffer);
    const writeString = (o, s) => { for(let i=0;i<s.length;i++) view.setUint8(o+i, s.charCodeAt(i)); };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + len, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, len, true);

    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) bytes[44 + i] = binaryString.charCodeAt(i);
    return bytes;
  };

  // --- Interaction Logic ---
  
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }
  };



  const toggleAudio = () => {
    if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
          audioRef.current.playbackRate = settings.speed; 
        }
        setIsPlaying(!isPlaying);
    }
  };

  // --- UI Components  };

  // --- UI Components ---

  const renderSettingsModal = () => {
    if (!showSettings) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-indigo-400" /> Settings
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                        <X />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Gemini API Key (Optional)</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API Key (or leave empty)"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            💡 You can provide your own API key for full control, or leave it empty to use the shared server key.
                            <br/>Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a>.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                    Save & Close
                </button>
            </div>
        </div>
    );
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 md:space-y-8 animate-in fade-in duration-700 px-4">
      <div className="space-y-3 md:space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-indigo-400 tracking-tight">
          GenConver<span className="text-slate-100">AI</span>
        </h1>
        <p className="text-slate-400 max-w-md mx-auto text-base md:text-lg px-4">
          {settings.lang === 'th' 
            ? (targetLanguage === 'japanese' ? 'ฝึกบทสนทนาภาษาญี่ปุ่นอย่างเป็นธรรมชาติ' : 'ฝึกบทสนทนาภาษาอังกฤษอย่างเป็นธรรมชาติ')
            : (targetLanguage === 'japanese' ? 'Master Japanese Conversation Naturally' : 'Master English Conversation Naturally')}
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-md bg-slate-800/50 p-1 rounded-xl border border-slate-700">
        <button
          onClick={() => {
            setTargetLanguage('japanese');
            setSettings(s => ({...s, level: 'N5'}));
          }}
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            targetLanguage === 'japanese'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🇯🇵 {settings.lang === 'th' ? 'ภาษาญี่ปุ่น' : 'Japanese'}
        </button>
        <button
          onClick={() => {
            setTargetLanguage('english');
            setSettings(s => ({...s, level: 'A1'}));
          }}
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            targetLanguage === 'english'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🇬🇧 {settings.lang === 'th' ? 'ภาษาอังกฤษ' : 'English'}
        </button>
      </div>

      {/* Dynamic Level Selection */}
      <div className="w-full max-w-2xl px-2">
        <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wide mb-3 text-center">
          {targetLanguage === 'japanese' 
            ? (settings.lang === 'th' ? 'ระดับ JLPT' : 'JLPT Level')
            : (settings.lang === 'th' ? 'ระดับ CEFR' : 'CEFR Level')}
        </h3>
        <div className={`grid gap-2 sm:gap-3 md:gap-4 w-full ${
          targetLanguage === 'japanese' ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'
        }`}>
          {(targetLanguage === 'japanese' ? ['N5', 'N4', 'N3'] : ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).map(lvl => (
            <button
              key={lvl}
              onClick={() => setSettings(s => ({...s, level: lvl}))}
              className={`p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-300 ${
                settings.level === lvl 
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-600 hover:bg-slate-750'
              }`}
            >
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{lvl}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Topic Selection */}
      <div className="w-full max-w-2xl space-y-3 md:space-y-4 px-2">
        <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wide text-center">
          {settings.lang === 'th' ? 'เลือกหัวข้อบทสนทนา' : 'Select Conversation Topic'}
        </h3>
        
        {/* Mode Selection Tabs */}
        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setTopicMode('random')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              topicMode === 'random'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎲 {settings.lang === 'th' ? 'สุ่ม' : 'Random'}
          </button>
          <button
            onClick={() => setTopicMode('tag')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              topicMode === 'tag'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏷️ {settings.lang === 'th' ? 'หมวดหมู่' : 'Categories'}
          </button>
          <button
            onClick={() => setTopicMode('custom')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              topicMode === 'custom'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ✏️ {settings.lang === 'th' ? 'กำหนดเอง' : 'Custom'}
          </button>
        </div>

        {/* Tag Selection Grid */}
        {topicMode === 'tag' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 animate-in fade-in duration-300">
            {CONVERSATION_TAGS.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${
                  selectedTag === tag.id
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{tag.emoji}</div>
                <div className="text-[10px] sm:text-xs font-bold">{settings.lang === 'th' ? tag.th : tag.en}</div>
              </button>
            ))}
          </div>
        )}

        {/* Custom Topic Input */}
        {topicMode === 'custom' && (
          <div className="animate-in fade-in duration-300">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder={settings.lang === 'th' 
                ? 'พิมพ์หัวข้อที่คุณต้องการ เช่น "ที่สนามบิน" หรือ "สั่งกาแฟ"' 
                : 'Enter your topic, e.g., "At the airport" or "Ordering coffee"'}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        )}
      </div>

      <button 
        onClick={generateContent}
        disabled={loading}
        className="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-linear-to-r from-indigo-600 to-purple-600 text-white text-base sm:text-lg md:text-xl font-bold rounded-full shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs">

        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <Loader2 className="animate-spin" /> {loadingText}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {settings.lang === 'th' ? "เริ่มฝึกฝน" : "Start Practice"} <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </button>
    </div>
  );

  const renderLearn = () => (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700 shadow-xl">
        <div className="flex justify-between items-start mb-6">
           <div>
             {/* Dual Language Title */}
             <h2 className="text-2xl font-bold text-slate-100">
               {conversation.title}
             </h2>
             <h3 className="text-lg font-medium text-indigo-300 mt-1">
               {conversation.title_th}
             </h3>
             <p className="text-slate-400 mt-2 text-sm">
               {settings.lang === 'th' ? conversation.situation_th : conversation.situation}
             </p>
           </div>
           <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold border border-indigo-500/30">
              {settings.level}
           </span>
        </div>

        {audioUrl ? (
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/50">
             <div className="flex items-center gap-4 mb-2">
                <button onClick={toggleAudio} className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-lg">
                   {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>
                
                <div className="flex-1 flex flex-col justify-center">
                   <input 
                     type="range" 
                     min="0" 
                     max={duration} 
                     value={currentTime} 
                     onChange={handleSeek}
                     className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                   />
                   <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                   </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                   <span className="text-xs text-slate-400">Speed</span>
                   <select 
                     value={settings.speed}
                     onChange={(e) => {
                       const newSpeed = parseFloat(e.target.value);
                       setSettings(s => ({...s, speed: newSpeed}));
                       if(audioRef.current) audioRef.current.playbackRate = newSpeed;
                     }}
                     className="bg-transparent text-sm font-bold text-indigo-400 outline-none cursor-pointer"
                   >
                     <option value="0.5">0.5x</option>
                     <option value="0.75">0.75x</option>
                     <option value="1.0">Normal</option>
                     <option value="1.25">1.25x</option>
                     <option value="1.5">1.5x</option>
                   </select>
                </div>
             </div>
             <audio 
               ref={audioRef} 
               src={audioUrl} 
               className="hidden" 
               onCanPlay={enforceSpeed} 
             />
          </div>

        ) : (
          <div className="flex justify-center py-4">
             <button 
               onClick={() => generateFullAudio(conversation, charactersData)}
               disabled={isGeneratingAudio}
               className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/25"
             >
               {isGeneratingAudio ? (
                 <>
                   <Loader2 className="animate-spin" size={20} />
                   {settings.lang === 'th' ? "กำลังสร้างเสียง..." : "Generating Audio..."}
                 </>
               ) : (
                 <>
                   <Volume2 size={20} />
                   {settings.lang === 'th' ? "สร้างเสียงบทสนทนา" : "Generate Audio"}
                 </>
               )}
             </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {conversation.dialogue.map((line, idx) => {
          // Robust mapping for Avatar/Layout
          
          let layoutIsLeft = true;
          const charIndex = charactersData.findIndex(c => {
             const cName = c.name.toLowerCase().trim();
             const sName = line.speaker.toLowerCase().trim();
             return cName === sName || cName.includes(sName) || sName.includes(cName);
          });
          if (charIndex !== -1) layoutIsLeft = (charIndex === 0);

          const isActive = activeBubbleIndex === idx;
          let avatarUrl = avatars[line.speaker];
          if (!avatarUrl && charIndex !== -1) {
             avatarUrl = avatars[charactersData[charIndex].name];
          }

          return (
            <div key={idx} className={`flex items-end gap-4 ${layoutIsLeft ? 'flex-row' : 'flex-row-reverse'} group`}>
               <div className="flex flex-col items-center gap-1">
                 <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden shrink-0 shadow-lg relative">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={line.speaker} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs text-center leading-tight p-1">{line.speaker}</div>
                    )}
                 </div>
                 <span className="text-[10px] font-bold text-slate-500 truncate max-w-[50px]">{line.speaker}</span>
               </div>

               <div 
                 className={`relative max-w-[75%] p-4 rounded-2xl shadow-md transition-all duration-300 border 
                 ${layoutIsLeft ? 'rounded-bl-none' : 'rounded-br-none'}
                 ${isActive 
                    ? 'ring-2 ring-yellow-400/50 bg-slate-700 border-indigo-400/50 transform scale-[1.01]' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                 }`}
               >
                  <div className="text-xs text-slate-400 mb-1 opacity-70">{line.reading}</div>
                  <div className={`text-lg font-medium leading-relaxed ${isActive ? 'text-yellow-300' : 'text-slate-200'}`}>
                    {line.text}
                  </div>
                  <div className="text-sm text-slate-500 mt-2 pt-2 border-t border-slate-700/50">
                     {settings.lang === 'th' ? line.th : line.en}
                  </div>
                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full animate-ping" />
                  )}
               </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-8">
         <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700">
            <h3 className="text-indigo-400 font-bold flex items-center gap-2 mb-4">
                <BookOpen size={18} /> {settings.lang === 'th' ? "คำศัพท์" : "Vocabulary"}
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600">
               {conversation.vocabulary.map((v, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 hover:bg-slate-700/50 rounded-lg">
                     <span className="text-slate-200 font-medium">{v.word} <span className="text-slate-500 text-xs ml-1">({v.reading})</span></span>
                     <span className="text-slate-400">{settings.lang === 'th' ? v.meaning_th : v.meaning_en}</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700">
            <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-4">
                <GraduationCap size={18} /> {settings.lang === 'th' ? "ไวยากรณ์" : "Grammar"}
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600">
               {conversation.grammar.map((g, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-900/30 rounded-lg border border-slate-700/50">
                     <div className="text-emerald-300 font-bold mb-1">{g.point}</div>
                     <div className="text-slate-400">{settings.lang === 'th' ? g.explanation_th : g.explanation_en}</div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <button 
            onClick={startQuiz}
            className="pointer-events-auto flex items-center gap-3 bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-full shadow-2xl shadow-indigo-900/50 transition-all hover:scale-105 font-bold text-lg"
          >
            <GraduationCap size={24} />
            {settings.lang === 'th' ? 'ทำแบบทดสอบ' : 'Take Quiz'}
          </button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    if (!conversation?.quiz || conversation.quiz.length === 0) {
      return <div>No quiz available</div>;
    }

    if (showQuizResults) {
      // Results view
      return (
        <div className="max-w-2xl mx-auto text-center space-y-6 md:space-y-8 animate-in zoom-in duration-500 pb-10 px-4">
          <div className="inline-block p-1 rounded-full bg-linear-to-r from-indigo-500 to-purple-500">
            <div className="bg-slate-900 rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center border-4 border-transparent">
              <span className="text-4xl sm:text-4xl md:text-5xl font-black text-white">{quizScore}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {settings.lang === 'th' ? 'ผลคะแนน' : 'Quiz Results'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {settings.lang === 'th' 
                ? `คุณได้ ${quizScore} คะแนน จาก 100 คะแนน!` 
                : `You scored ${quizScore} out of 100!`}
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl md:rounded-3xl border border-slate-700 p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 text-left">
            {conversation.quiz.map((q, idx) => {
              const isCorrect = userAnswers[idx] === q.correctAnswer;
              return (
                <div key={idx} className="pb-6 border-b border-slate-700 last:border-0">
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle size={24} className="text-emerald-400 shrink-0 mt-1" />
                    ) : (
                      <X size={24} className="text-red-400 shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-slate-200 mb-2">
                        {settings.lang === 'th' ? q.question_th : q.question_en}
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="text-emerald-300">
                          ✓ {settings.lang === 'th' ? 'คำตอบที่ถูก' : 'Correct'}: {q.options[q.correctAnswer]}
                        </div>
                        {!isCorrect && userAnswers[idx] !== null && (
                          <div className="text-red-300">
                            ✗ {settings.lang === 'th' ? 'คุณตอบ' : 'Your answer'}: {q.options[userAnswers[idx]]}
                          </div>
                        )}
                        <div className="text-slate-500 mt-2 bg-slate-900/50 p-2 rounded">
                          {settings.lang === 'th' ? q.explanation_th : q.explanation_en}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
            <button onClick={() => setMode('home')} className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 text-sm sm:text-base">
              {settings.lang === 'th' ? 'หน้าหลัก' : 'Home'}
            </button>
            <button onClick={() => setMode('learn')} className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 text-sm sm:text-base">
              {settings.lang === 'th' ? 'ดูบทเรียนอีกครั้ง' : 'Review Lesson'}
            </button>
          </div>
        </div>
      );
    }

    // Quiz view
    const currentQuestion = conversation.quiz[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / conversation.quiz.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-10 px-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm text-slate-400">
            <span>{settings.lang === 'th' ? 'คำถามที่' : 'Question'} {currentQuestionIndex + 1} / {conversation.quiz.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{width: `${progress}%`}}></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800 rounded-2xl md:rounded-3xl border border-slate-700 p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wide">
              {settings.lang === 'th' ? 'คำถาม' : 'Question'}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100">{currentQuestion.question_ja}</h3>
            <p className="text-slate-400 text-sm sm:text-base">
              {settings.lang === 'th' ? currentQuestion.question_th : currentQuestion.question_en}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(currentQuestionIndex, idx)}
                className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all text-sm sm:text-base ${
                  userAnswers[currentQuestionIndex] === idx
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                    : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {settings.lang === 'th' ? 'ก่อนหน้า' : 'Previous'}
          </button>

          {currentQuestionIndex < conversation.quiz.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={userAnswers[currentQuestionIndex] === null}
              className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm sm:text-base"
            >
              {settings.lang === 'th' ? 'ถัดไป' : 'Next'}
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={userAnswers.some(a => a === null)}
              className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm sm:text-base"
            >
              {settings.lang === 'th' ? 'ส่งคำตอบ' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    );
  };



  // --- Main Render ---

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
       <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur fixed top-0 w-full z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
             <div onClick={() => setMode('home')} className="flex items-center gap-2 font-bold text-xl cursor-pointer text-indigo-400 hover:text-indigo-300 transition-colors">
                <MessageCircle className="fill-current" />
                <span>GenConver<span className="text-slate-100">AI</span></span>
             </div>
                          <div className="flex items-center gap-4">
                <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-slate-200 transition-colors">
                    <Settings size={20} />
                </button>
                <button 
                  onClick={() => setSettings(s => ({...s, lang: s.lang === 'th' ? 'en' : 'th'}))}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  {settings.lang === 'th' ? 'TH' : 'EN'}
                </button>
                {mode !== 'home' && (
                    <button onClick={() => setMode('home')} className="p-2 text-slate-500 hover:text-slate-200 transition-colors">
                        <RotateCcw size={20} />
                    </button>
                )}
             </div>
          </div>
       </nav>

       <main className="max-w-5xl mx-auto px-4 pt-24 pb-10">
          {error && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-pulse">
                <AlertCircle /> {error}
             </div>
          )}
          
          {mode === 'home' && renderHome()}
          {mode === 'learn' && renderLearn()}
          {mode === 'quiz' && renderQuiz()}
       </main>

       {renderSettingsModal()}
    </div>
  );
};

export default App;