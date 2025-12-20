'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Conversation, DialogueLine } from '@/types';

interface UseAudioPlayerProps {
  conversation: Conversation | null;
  speed: number;
}

interface UseAudioPlayerReturn {
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  activeBubbleIndex: number;
  toggleAudio: () => void;
  handleSeek: (time: number) => void;
  handleJumpToDialogue: (index: number) => void;
  handleRepeatDialogue: (index: number) => void;
}

export function useAudioPlayer({ conversation, speed }: UseAudioPlayerProps): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeBubbleIndex, setActiveBubbleIndex] = useState(-1);
  const repeatEndTimeRef = useRef<number | null>(null);

  const enforceSpeed = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Update playback rate when speed changes
  useEffect(() => {
    enforceSpeed();
  }, [enforceSpeed, audioUrl, isPlaying]);

  // Audio progress and bubble highlighting
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
  }, [conversation, audioUrl, speed, enforceSpeed]);

  // Handle repeat end time
  useEffect(() => {
    const checkRepeatEnd = () => {
      if (repeatEndTimeRef.current !== null && audioRef.current) {
        if (audioRef.current.currentTime >= repeatEndTimeRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          repeatEndTimeRef.current = null;
        }
      }
    };

    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.addEventListener('timeupdate', checkRepeatEnd);
    }
    return () => {
      if (audioEl) {
        audioEl.removeEventListener('timeupdate', checkRepeatEnd);
      }
    };
  }, [audioUrl]);

  const toggleAudio = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        audioRef.current.playbackRate = speed;
      }
      setIsPlaying(!isPlaying);
      repeatEndTimeRef.current = null;
    }
  }, [isPlaying, speed]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      repeatEndTimeRef.current = null;
    }
  }, []);

  const handleJumpToDialogue = useCallback((index: number) => {
    if (!audioRef.current || !conversation || !duration) return;

    const totalChars = conversation.dialogue.reduce((acc, line) => acc + line.text.length, 0);
    let charsBefore = 0;
    for (let i = 0; i < index; i++) {
      charsBefore += conversation.dialogue[i].text.length;
    }

    const targetTime = (charsBefore / totalChars) * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    repeatEndTimeRef.current = null;

    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [conversation, duration, isPlaying]);

  const handleRepeatDialogue = useCallback((index: number) => {
    if (!audioRef.current || !conversation || !duration) return;

    const totalChars = conversation.dialogue.reduce((acc, line) => acc + line.text.length, 0);

    let charsBefore = 0;
    for (let i = 0; i < index; i++) {
      charsBefore += conversation.dialogue[i].text.length;
    }
    const startTime = (charsBefore / totalChars) * duration;

    const charsIncluding = charsBefore + conversation.dialogue[index].text.length;
    const endTime = (charsIncluding / totalChars) * duration;

    repeatEndTimeRef.current = endTime;
    audioRef.current.currentTime = startTime;
    setCurrentTime(startTime);
    audioRef.current.play();
    audioRef.current.playbackRate = speed;
    setIsPlaying(true);
  }, [conversation, duration, speed]);

  return {
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
  };
}

// Utility function to convert PCM to WAV
export function pcmToWav(base64: string, sampleRate: number): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);
  const writeString = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };

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
  return buffer;
}
