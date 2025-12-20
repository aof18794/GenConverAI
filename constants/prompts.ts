import { ConversationTag, ModelOption } from '@/types';

export const SYSTEM_PROMPT_JAPANESE = `
You are an expert Japanese language teacher. 
Generate a realistic, natural Japanese conversation based on the requested JLPT level.

IMPORTANT REQUIREMENTS:
1. Define EXACTLY 2 characters:
   - One male character (choose any appropriate Japanese male name)
   - One female character (choose any appropriate Japanese female name)
2. Output a "characters" array defining their gender clearly as "male" or "female".
3. The conversation should sound like real friends or colleagues talking.
4. CRITICAL: The "speaker" name in the "dialogue" array MUST MATCH EXACTLY the names in the "characters" array. Do not add honorifics like '-san' in the speaker field.
5. Generate EXACTLY 3 quiz questions about the conversation in JLPT style (multiple choice with 4 options).

Output MUST be valid JSON only. No markdown blocks.
Structure:
{
  "title": "Short title of topic (Japanese)",
  "title_th": "Short title of topic (Thai translation)",
  "level": "N5/N4/N3/N2/N1/Daily",
  "situation": "Brief description of the situation (English)",
  "situation_th": "Brief description of the situation (Thai translation)",
  "characters": [
    { "name": "[Japanese male name]", "gender": "male" },
    { "name": "[Japanese female name]", "gender": "female" }
  ],
  "dialogue": [
    {
      "speaker": "[Character name from characters array]", 
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

export const SYSTEM_PROMPT_ENGLISH = `
You are an expert English language teacher. 
Generate a realistic, natural English conversation based on the requested CEFR level (A1, A2, B1, B2, C1, C2).

IMPORTANT REQUIREMENTS:
1. Define EXACTLY 2 characters:
   - One male character (choose any appropriate English male name)
   - One female character (choose any appropriate English female name)
2. Output a "characters" array defining their gender clearly as "male" or "female".
3. The conversation should sound like real friends or colleagues talking.
4. CRITICAL: The "speaker" name in the "dialogue" array MUST MATCH EXACTLY the names in the "characters" array.
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
    { "name": "[English male name]", "gender": "male" },
    { "name": "[English female name]", "gender": "female" }
  ],
  "dialogue": [
    {
      "speaker": "[Character name from characters array]", 
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

export const CONVERSATION_TAGS: ConversationTag[] = [
  { id: 'restaurant', emoji: '🍜', ja: 'レストランで', en: 'At Restaurant', th: 'ที่ร้านอาหาร' },
  { id: 'shopping', emoji: '🛒', ja: '買い物', en: 'Shopping', th: 'ช้อปปิ้ง' },
  { id: 'school', emoji: '🏫', ja: '学校で', en: 'At School', th: 'ที่โรงเรียน' },
  { id: 'travel', emoji: '🚃', ja: '旅行', en: 'Travel', th: 'ท่องเที่ยว' },
  { id: 'friends', emoji: '👥', ja: '友達と', en: 'With Friends', th: 'กับเพื่อน' },
  { id: 'work', emoji: '🏢', ja: '仕事', en: 'Work', th: 'ที่ทำงาน' },
  { id: 'hospital', emoji: '🏥', ja: '病院で', en: 'At Hospital', th: 'ที่โรงพยาบาล' },
  { id: 'phone', emoji: '📞', ja: '電話で', en: 'Phone Call', th: 'โทรศัพท์' },
];

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
];

export const JAPANESE_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1', 'Daily'];
export const ENGLISH_CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const ENGLISH_TEST_TYPES = ['IELTS', 'TOEIC', 'TOEFL'];

// Test score configurations
export const TEST_SCORE_CONFIG = {
  IELTS: { min: 0, max: 9, step: 0.5, default: 5.5, unit: 'Band' },
  TOEIC: { min: 10, max: 990, step: 5, default: 600, unit: 'Score' },
  TOEFL: { min: 0, max: 120, step: 1, default: 80, unit: 'Score' },
};

export const ENGLISH_ACCENTS = [
  { id: 'american', name: 'American', emoji: '🇺🇸' },
  { id: 'british', name: 'British', emoji: '🇬🇧' },
  { id: 'australian', name: 'Australian', emoji: '🇦🇺' },
];

// English level mode type
export type EnglishLevelMode = 'cefr' | 'test' | 'other';
