"use client";

import { CheckCircle, X } from "lucide-react";
import { Conversation, Settings } from "@/types";

interface QuizViewProps {
  conversation: Conversation;
  settings: Settings;
  userAnswers: (number | null)[];
  currentQuestionIndex: number;
  showQuizResults: boolean;
  quizScore: number;
  onAnswerSelect: (questionIndex: number, answerIndex: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onGoHome: () => void;
  onReviewLesson: () => void;
}

export function QuizView({
  conversation,
  settings,
  userAnswers,
  currentQuestionIndex,
  showQuizResults,
  quizScore,
  onAnswerSelect,
  onPrevious,
  onNext,
  onSubmit,
  onGoHome,
  onReviewLesson,
}: QuizViewProps) {
  if (!conversation?.quiz || conversation.quiz.length === 0) {
    return <div>No quiz available</div>;
  }

  if (showQuizResults) {
    // Results view
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 md:space-y-8 animate-in zoom-in duration-500 pb-10 px-4">
        <div className="inline-block p-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse-glow">
          <div className="score-circle rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
            <span className="text-4xl sm:text-4xl md:text-5xl font-black text-white">
              {quizScore}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {settings.lang === "th" ? "ผลคะแนน" : "Quiz Results"}
          </h2>
          <p className="text-emerald-200/60 text-sm sm:text-base">
            {settings.lang === "th"
              ? `คุณได้ ${quizScore} คะแนน จาก 100 คะแนน!`
              : `You scored ${quizScore} out of 100!`}
          </p>
        </div>

        <div className="glass-card rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 text-left">
          {conversation.quiz.map((q, idx) => {
            const isCorrect = userAnswers[idx] === q.correctAnswer;
            return (
              <div
                key={idx}
                className="pb-6 border-b border-emerald-700/30 last:border-0"
              >
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle
                      size={24}
                      className="text-emerald-400 shrink-0 mt-1"
                    />
                  ) : (
                    <X size={24} className="text-red-400 shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-slate-200 mb-2">
                      {settings.lang === "th" ? q.question_th : q.question_en}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="text-emerald-300">
                        ✓ {settings.lang === "th" ? "คำตอบที่ถูก" : "Correct"}:{" "}
                        {q.options[q.correctAnswer]}
                      </div>
                      {!isCorrect && userAnswers[idx] !== null && (
                        <div className="text-red-300">
                          ✗ {settings.lang === "th" ? "คุณตอบ" : "Your answer"}:{" "}
                          {q.options[userAnswers[idx]!]}
                        </div>
                      )}
                      <div className="text-emerald-200/50 mt-2 glass-card p-2 rounded">
                        {settings.lang === "th"
                          ? q.explanation_th
                          : q.explanation_en}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
          <button
            onClick={onGoHome}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full glass-card text-emerald-200/80 hover:text-white hover:bg-emerald-900/30 text-sm sm:text-base transition-all"
          >
            {settings.lang === "th" ? "หน้าหลัก" : "Home"}
          </button>
          <button
            onClick={onReviewLesson}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full btn-3d text-white text-sm sm:text-base"
          >
            {settings.lang === "th" ? "ดูบทเรียนอีกครั้ง" : "Review Lesson"}
          </button>
        </div>
      </div>
    );
  }

  // Quiz view
  const currentQuestion = conversation.quiz[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / conversation.quiz.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-10 px-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs sm:text-sm text-emerald-200/60">
          <span>
            {settings.lang === "th" ? "คำถามที่" : "Question"}{" "}
            {currentQuestionIndex + 1} / {conversation.quiz.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar w-full rounded-full h-2">
          <div
            className="progress-fill h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-card rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <div className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wide">
            {settings.lang === "th" ? "คำถาม" : "Question"}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
            {currentQuestion.question_ja}
          </h3>
          <p className="text-emerald-200/60 text-sm sm:text-base">
            {settings.lang === "th"
              ? currentQuestion.question_th
              : currentQuestion.question_en}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onAnswerSelect(currentQuestionIndex, idx)}
              className={`quiz-option w-full text-left p-3 sm:p-4 rounded-xl text-sm sm:text-base ${
                userAnswers[currentQuestionIndex] === idx
                  ? "selected text-emerald-200"
                  : "text-emerald-200/70"
              }`}
            >
              <span className="font-bold mr-3">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-3">
        <button
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0}
          className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-full glass-card text-emerald-200/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-sm sm:text-base transition-all"
        >
          {settings.lang === "th" ? "ก่อนหน้า" : "Previous"}
        </button>

        {currentQuestionIndex < conversation.quiz.length - 1 ? (
          <button
            onClick={onNext}
            disabled={userAnswers[currentQuestionIndex] === null}
            className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full btn-3d text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm sm:text-base"
          >
            {settings.lang === "th" ? "ถัดไป" : "Next"}
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={userAnswers.some((a) => a === null)}
            className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-500 hover:to-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/40 transition-all"
          >
            {settings.lang === "th" ? "ส่งคำตอบ" : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
}
