"use client";

import { Settings, X } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="modal-glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="text-emerald-400" /> Settings
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-300/70 mb-1">
              Gemini API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Enter your API Key (or leave empty)"
              className="input-glow w-full rounded-lg px-4 py-3 text-slate-200 outline-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              💡 You can provide your own API key for full control, or leave it
              empty to use the shared server key.
              <br />
              Get a free key at{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Google AI Studio
              </a>
              .
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-3d w-full mt-6 text-white font-bold py-3 rounded-xl"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
