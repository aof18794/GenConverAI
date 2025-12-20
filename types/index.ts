// Character types
export interface Character {
  name: string;
  gender: 'male' | 'female';
}

// Dialogue line type
export interface DialogueLine {
  speaker: string;
  text: string;
  reading: string;
  romaji: string;
  en: string;
  th: string;
}

// Vocabulary item type
export interface VocabularyItem {
  word: string;
  reading: string;
  meaning_en: string;
  meaning_th: string;
}

// Grammar point type
export interface GrammarPoint {
  point: string;
  explanation_en: string;
  explanation_th: string;
}

// Quiz question type
export interface QuizQuestion {
  question_ja: string;
  question_en: string;
  question_th: string;
  options: string[];
  correctAnswer: number;
  explanation_en: string;
  explanation_th: string;
}

// Full conversation data type
export interface Conversation {
  title: string;
  title_th: string;
  level: string;
  situation: string;
  situation_th: string;
  characters: Character[];
  dialogue: DialogueLine[];
  vocabulary: VocabularyItem[];
  grammar: GrammarPoint[];
  quiz: QuizQuestion[];
}

// Settings type
export interface Settings {
  level: string;
  speed: number;
  lang: 'th' | 'en';
}

// Chat message type
export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

// Conversation tag type
export interface ConversationTag {
  id: string;
  emoji: string;
  ja: string;
  en: string;
  th: string;
}

// Model option type
export interface ModelOption {
  id: string;
  name: string;
}

// Target language type
export type TargetLanguage = 'japanese' | 'english';

// Topic mode type
export type TopicMode = 'random' | 'tag' | 'custom';

// App mode type
export type AppMode = 'home' | 'learn' | 'quiz';

// English accent type
export type EnglishAccent = 'american' | 'british' | 'australian';
