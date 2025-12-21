/**
 * Hooks for interacting with Gemini Live API via WebSocket
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorageString } from './useLocalStorage';

export interface UseGeminiLiveProps {
  onDisconnect?: () => void;
  systemInstruction?: string;
  tools?: any[]; // Tool definitions if any
}

// Configuration for Gemini Live
const HOST = 'generativelanguage.googleapis.com';
const VERSION = 'v1alpha';
// Updated model as requested
const MODEL = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

export const useGeminiLive = ({ onDisconnect, systemInstruction, tools }: UseGeminiLiveProps) => {
  const [apiKey] = useLocalStorageString('gemini_api_key', '');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const nextPlayTimeRef = useRef(0);

  // Initialize Audio Context
  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, 
        latencyHint: 'interactive', // Optimize for low latency
      });
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const connect = useCallback(async () => {
    if (!apiKey) {
      setError("API Key is missing");
      return;
    }

    try {
      setError(null);
      const url = `wss://${HOST}/ws/google.ai.generativelanguage.${VERSION}.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log("Connected to Gemini Live");
        setIsConnected(true);
        
        // Initial Setup Message
        const setupMsg = {
          setup: {
            model: MODEL,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } // Use a clear voice
              }
            },
            systemInstruction: systemInstruction ? {
              parts: [{ text: systemInstruction }]
            } : undefined,
            tools: tools
          }
        };
        ws.send(JSON.stringify(setupMsg));
      };

      ws.onmessage = async (event) => {
        try {
          let data;
          if (event.data instanceof Blob) {
            data = JSON.parse(await event.data.text());
          } else {
            data = JSON.parse(event.data);
          }

          // Handle Server Content (Audio)
          if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                // Queue audio for playback
                queueAudio(part.inlineData.data);
              }
            }
          }
        } catch (e) {
            console.error("Error parsing message", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket Error", e);
        setError("Connection failed");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log("Disconnected", event.code, event.reason);
        setIsConnected(false);
        setIsRecording(false);
        onDisconnect?.();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("Connection failed", e);
      setError(e instanceof Error ? e.message : "Connection failed");
    }
  }, [apiKey, onDisconnect, systemInstruction, tools]);



  // Audio Playback Queue
  const queueAudio = (base64Data: string) => {
    ensureAudioContext();
    if (!audioContextRef.current) return;

    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Buffer = new Int16Array(bytes.buffer);
      const float32Buffer = new Float32Array(int16Buffer.length);
      
      for (let i = 0; i < int16Buffer.length; i++) {
        float32Buffer[i] = int16Buffer[i] / 32768.0;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32Buffer.length, 24000);
      audioBuffer.copyToChannel(float32Buffer, 0);

      playBuffer(audioBuffer);
    } catch (e) {
      console.error("Error decoding audio", e);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    const currentTime = audioContextRef.current.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
    }
    
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += buffer.duration;
  };

  const [volume, setVolume] = useState(0);

  // ... (previous code)

  // Recording Logic using AudioWorklet
  const startRecording = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
            channelCount: 1, 
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;
      setIsRecording(true);

      const context = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
        latencyHint: 'interactive', // Optimize for low latency
      });

      // Define Worklet as a Blob
      const workletCode = `
        class RecorderProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.bufferSize = 512; // Buffer ~32ms of audio for low latency
            this.buffer = new Float32Array(this.bufferSize);
            this.bufferIndex = 0;
          }

          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input.length > 0) {
              const channelData = input[0];
              for (let i = 0; i < channelData.length; i++) {
                this.buffer[this.bufferIndex++] = channelData[i];
                
                if (this.bufferIndex === this.bufferSize) {
                  this.port.postMessage(this.buffer);
                  this.bufferIndex = 0;
                }
              }
            }
            return true;
          }
        }
        registerProcessor("recorder-worklet", RecorderProcessor);
      `;

      const blob = new Blob([workletCode], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);

      await context.audioWorklet.addModule(workletUrl);
      
      const source = context.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(context, "recorder-worklet");
      
      workletNode.port.onmessage = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = event.data; // Float32Array
        
        // Calculate Volume (RMS)
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setVolume(Math.min(1, rms * 5)); // Amplify slightly for visualizer

        // Convert to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to Base64
        let binary = '';
        const bytes = new Uint8Array(pcmData.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = window.btoa(binary);

        const msg = {
            realtimeInput: {
                mediaChunks: [{
                    mimeType: "audio/pcm;rate=16000",
                    data: b64
                }]
            }
        };
        wsRef.current.send(JSON.stringify(msg));
      };

      source.connect(workletNode);
      workletNode.connect(context.destination); // Keep alive
      
      workletNodeRef.current = workletNode;
      
    } catch (err) {
      console.error("Error accessing microphone", err);
      setError("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setVolume(0);
    
    if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
    }
    
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopRecording();
    setIsConnected(false);
  }, [stopRecording]);

  useEffect(() => {
    return () => {
        disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isRecording,
    volume,
    error,
    connect,
    disconnect,
    startRecording,
    stopRecording
  };
};
