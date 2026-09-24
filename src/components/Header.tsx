import React from 'react';
import { Cpu, Wifi, Eye, Code, HelpCircle, ShieldAlert } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  aiLoaded: boolean;
  cameraReady: boolean;
  onOpenFirmware: () => void;
  onOpenMixedContentHelp: () => void;
  isHttps: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  aiLoaded,
  cameraReady,
  onOpenFirmware,
  onOpenMixedContentHelp,
  isHttps,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">AI Smart Tracker</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                ESP32 Streamer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              TensorFlow COCO-SSD Object Detection • Real-time 160x128 RGB565 WebSocket Pipeline
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 border border-slate-700/60">
            <Cpu className={`w-3.5 h-3.5 ${aiLoaded ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} />
            <span className={aiLoaded ? 'text-slate-300' : 'text-amber-300'}>
              {aiLoaded ? 'COCO-SSD Ready' : 'Loading Model...'}
            </span>
          </div>

          {/* Camera Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 border border-slate-700/60">
            <span className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-slate-300">{cameraReady ? 'Webcam Live' : 'Camera Off'}</span>
          </div>

          {/* Stream Status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
            connectionStatus === 'streaming'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
              : connectionStatus === 'simulator'
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
              : connectionStatus === 'connecting'
              ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
              : connectionStatus === 'error'
              ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
          }`}>
            <Wifi className="w-3.5 h-3.5" />
            <span className="capitalize">
              {connectionStatus === 'streaming'
                ? 'Streaming to ESP32'
                : connectionStatus === 'simulator'
                ? 'Simulator Active'
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : connectionStatus === 'error'
                ? 'Connection Error'
                : 'Stream Idle'}
            </span>
          </div>

          {/* Mixed Content Warning indicator if on HTTPS */}
          {isHttps && (
            <button
              onClick={onOpenMixedContentHelp}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              title="Click for HTTPS to ws:// local connection guide"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vercel HTTPS Guide</span>
            </button>
          )}

          {/* ESP32 Firmware Code Button */}
          <button
            onClick={onOpenFirmware}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all hover:shadow-blue-500/25"
          >
            <Code className="w-3.5 h-3.5" />
            <span>ESP32 Code</span>
          </button>
        </div>
      </div>
    </header>
  );
};
