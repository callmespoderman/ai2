import React, { useState } from 'react';
import { Cpu, Maximize2, Sparkles, Activity, Layers, Download } from 'lucide-react';
import { StreamStats, ConnectionStatus } from '../types';

interface ESP32VirtualDisplayProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  streamStats: StreamStats;
  connectionStatus: ConnectionStatus;
  targetObject: string;
}

export const ESP32VirtualDisplay: React.FC<ESP32VirtualDisplayProps> = ({
  canvasRef,
  streamStats,
  connectionStatus,
  targetObject,
}) => {
  const [pixelGrid, setPixelGrid] = useState(false);
  const isActive = connectionStatus === 'streaming' || connectionStatus === 'simulator';

  const downloadFrame = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `esp32-frame-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Title & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            ESP32 Hardware Stream Preview (160×128)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPixelGrid(!pixelGrid)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
              pixelGrid
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle pixel matrix emulation grid"
          >
            Grid Overlay
          </button>
          <button
            onClick={downloadFrame}
            className="p-1 rounded bg-slate-950 text-slate-400 border border-slate-800 hover:text-white transition-colors"
            title="Capture current 160x128 frame"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulated Hardware TFT Module (ST7735 / ILI9341) */}
      <div className="relative mx-auto p-4 rounded-2xl bg-gradient-to-b from-red-950/40 via-slate-950 to-slate-950 border border-red-900/40 shadow-2xl flex flex-col items-center">
        {/* PCB Header Pin simulation */}
        <div className="w-full flex justify-between px-2 mb-2">
          <div className="flex gap-1">
            {['GND', 'VCC', 'SCL', 'SDA', 'RES', 'DC', 'CS', 'BLK'].map((pin) => (
              <div key={pin} className="flex flex-col items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shadow-xs mb-0.5" />
                <span className="text-[7px] font-mono text-slate-500">{pin}</span>
              </div>
            ))}
          </div>
          <div className="text-[9px] font-mono font-bold text-red-400/80 tracking-widest flex items-center">
            ESP32-TFT 1.8"
          </div>
        </div>

        {/* Display Screen Bezel */}
        <div className="relative p-2.5 bg-slate-950 rounded-lg border-2 border-slate-800 shadow-inner">
          <div className="relative overflow-hidden rounded bg-black flex items-center justify-center">
            {/* The 160x128 processing canvas */}
            <canvas
              ref={canvasRef}
              width={160}
              height={128}
              className={`w-[240px] h-[192px] sm:w-[280px] sm:h-[224px] image-rendering-pixelated block ${
                pixelGrid ? 'opacity-90' : ''
              }`}
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Optional LCD pixel grid overlay */}
            {pixelGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                  backgroundSize: '3px 3px',
                }}
              />
            )}

            {/* Inactive overlay when neither streaming nor simulating */}
            {!isActive && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center">
                <Cpu className="w-6 h-6 text-slate-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-300">ESP32 Stream Standby</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Click "Start Streaming" or "Test with Virtual ESP32"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Display Model Label */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
          <span>RGB565 (16-bit)</span>
          <span>40,960 Bytes / Frame</span>
          <span>SPI DMA</span>
        </div>
      </div>

      {/* Stream Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] text-slate-400">Stream FPS</span>
          <span className="font-mono font-bold text-cyan-400 mt-0.5 text-sm">
            {streamStats.fps} FPS
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] text-slate-400">Bandwidth</span>
          <span className="font-mono font-bold text-white mt-0.5 text-sm">
            {streamStats.bandwidthKbps.toFixed(1)} KB/s
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] text-slate-400">Frames Sent</span>
          <span className="font-mono font-bold text-slate-200 mt-0.5 text-sm">
            {streamStats.framesSent.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 flex flex-col">
          <span className="text-[10px] text-slate-400">Total Transferred</span>
          <span className="font-mono font-bold text-emerald-400 mt-0.5 text-sm">
            {(streamStats.totalBytesSent / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      </div>
    </div>
  );
};
