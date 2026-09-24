import React from 'react';
import {
  Play,
  Square,
  Settings2,
  Tv,
  Camera,
  RefreshCw,
  Sliders,
  Radio,
  SlidersHorizontal,
  MonitorPlay,
  FlipHorizontal,
  Wifi,
} from 'lucide-react';
import { ESP32Settings, FramingMode, ConnectionStatus } from '../types';

interface ControlPanelProps {
  targetObject: string;
  onTargetChange: (target: string) => void;
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;
  framingMode: FramingMode;
  onFramingModeChange: (mode: FramingMode) => void;
  settings: ESP32Settings;
  onSettingsChange: (settings: ESP32Settings) => void;
  connectionStatus: ConnectionStatus;
  aiLoaded: boolean;
  onToggleStream: () => void;
  onToggleSimulator: () => void;
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  mirrorVideo: boolean;
  onToggleMirror: () => void;
}

const COMMON_TARGETS = [
  { id: 'person', label: 'Person 👤' },
  { id: 'cell phone', label: 'Cell Phone 📱' },
  { id: 'cup', label: 'Cup ☕' },
  { id: 'bottle', label: 'Bottle 🧴' },
  { id: 'laptop', label: 'Laptop 💻' },
  { id: 'cat', label: 'Cat 🐱' },
  { id: 'dog', label: 'Dog 🐶' },
  { id: 'backpack', label: 'Backpack 🎒' },
  { id: 'book', label: 'Book 📖' },
  { id: 'chair', label: 'Chair 🪑' },
  { id: 'mouse', label: 'Mouse 🖱️' },
  { id: 'keyboard', label: 'Keyboard ⌨️' },
  { id: 'all', label: 'Any / All Objects 🎯' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  targetObject,
  onTargetChange,
  confidenceThreshold,
  onConfidenceChange,
  framingMode,
  onFramingModeChange,
  settings,
  onSettingsChange,
  connectionStatus,
  aiLoaded,
  onToggleStream,
  onToggleSimulator,
  videoDevices,
  selectedDeviceId,
  onSelectDevice,
  mirrorVideo,
  onToggleMirror,
}) => {
  const isStreaming = connectionStatus === 'streaming';
  const isSimulating = connectionStatus === 'simulator';
  const isConnecting = connectionStatus === 'connecting';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-5">
      {/* Section 1: AI Tracking Target */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            Target Object
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {targetObject === 'all' ? 'All Classes' : targetObject}
          </span>
        </div>

        <select
          value={targetObject}
          onChange={(e) => onTargetChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
        >
          {COMMON_TARGETS.map((target) => (
            <option key={target.id} value={target.id}>
              {target.label}
            </option>
          ))}
        </select>
      </div>

      {/* Section 2: Framing & Confidence */}
      <div className="space-y-4 pt-1 border-t border-slate-800/80">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Min Confidence
            </label>
            <span className="text-xs font-mono font-medium text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.95"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
            ESP32 Framing Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onFramingModeChange('crop-target')}
              className={`px-2 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                framingMode === 'crop-target'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto-Crop Target
            </button>
            <button
              type="button"
              onClick={() => onFramingModeChange('fit-all')}
              className={`px-2 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                framingMode === 'fit-all'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Camera
            </button>
            <button
              type="button"
              onClick={() => onFramingModeChange('center-crop')}
              className={`px-2 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                framingMode === 'center-crop'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Center Crop
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Hardware Connection (ESP32 Network) */}
      <div className="space-y-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            ESP32 WebSocket Endpoint
          </label>
        </div>

        <div className="flex gap-2">
          <select
            value={settings.protocol}
            onChange={(e) =>
              onSettingsChange({ ...settings, protocol: e.target.value as 'ws' | 'wss' })
            }
            className="w-20 bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-2 text-xs font-mono text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="ws">ws://</option>
            <option value="wss">wss://</option>
          </select>

          <input
            type="text"
            placeholder="192.168.1.108"
            value={settings.host}
            onChange={(e) => onSettingsChange({ ...settings, host: e.target.value.trim() })}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />

          <input
            type="number"
            placeholder="81"
            value={settings.port}
            onChange={(e) =>
              onSettingsChange({ ...settings, port: parseInt(e.target.value) || 81 })
            }
            className="w-18 bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-2 text-sm font-mono text-slate-100 text-center focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Quick IP presets */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Presets:</span>
          <button
            type="button"
            onClick={() => onSettingsChange({ ...settings, host: '192.168.1.108', port: 81 })}
            className="hover:text-blue-400 underline decoration-slate-700"
          >
            192.168.1.108
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onSettingsChange({ ...settings, host: '192.168.4.1', port: 81 })}
            className="hover:text-blue-400 underline decoration-slate-700"
            title="ESP32 SoftAP Default IP"
          >
            192.168.4.1 (AP)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onSettingsChange({ ...settings, host: 'localhost', port: 81 })}
            className="hover:text-blue-400 underline decoration-slate-700"
          >
            localhost
          </button>
        </div>
      </div>

      {/* Action Buttons: Connect to ESP32 or Run Simulator */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          disabled={!aiLoaded || isConnecting}
          onClick={onToggleStream}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
            isStreaming
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Connecting to ESP32...</span>
            </>
          ) : isStreaming ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Streaming ({settings.host}:{settings.port})</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{aiLoaded ? 'Start Streaming to ESP32' : 'Loading AI Model...'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          disabled={!aiLoaded || isStreaming}
          onClick={onToggleSimulator}
          className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border transition-all ${
            isSimulating
              ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white disabled:opacity-50'
          }`}
        >
          <MonitorPlay className="w-4 h-4 text-cyan-400" />
          <span>
            {isSimulating ? 'Stop Virtual ESP32 Simulator' : 'Test with Virtual ESP32 (No Hardware Required)'}
          </span>
        </button>
      </div>

      {/* Section 4: Stream Tuning & Camera Configuration */}
      <div className="pt-3 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Stream Tuning
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Target FPS ({settings.fps} FPS)</label>
            <select
              value={settings.fps}
              onChange={(e) =>
                onSettingsChange({ ...settings, fps: parseInt(e.target.value) || 12 })
              }
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
            >
              <option value="6">6 FPS (Ultra-low network)</option>
              <option value="10">10 FPS</option>
              <option value="12">12 FPS (Recommended for ESP32)</option>
              <option value="15">15 FPS</option>
              <option value="20">20 FPS (High-speed Wi-Fi)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Chunk Size ({settings.chunkSize} B)</label>
            <select
              value={settings.chunkSize}
              onChange={(e) =>
                onSettingsChange({ ...settings, chunkSize: parseInt(e.target.value) || 4096 })
              }
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
            >
              <option value="2048">2048 B (Conservative)</option>
              <option value="4096">4096 B (Default)</option>
              <option value="8192">8192 B (Fast)</option>
            </select>
          </div>
        </div>

        {/* Camera Selector & Mirror */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
          {videoDevices.length > 1 && (
            <div className="flex-1">
              <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Camera Source
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => onSelectDevice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 truncate"
              >
                {videoDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleMirror}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mirrorVideo
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Mirror</span>
          </button>
        </div>
      </div>
    </div>
  );
};
