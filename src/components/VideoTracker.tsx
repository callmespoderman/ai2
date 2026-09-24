import React, { useRef, useEffect } from 'react';
import { Target, Crosshair, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { DetectedObject } from '../types';

interface VideoTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  targetObject: string;
  activeTarget: DetectedObject | null;
  allDetections: DetectedObject[];
  cameraReady: boolean;
  cameraError: string | null;
  onRequestCamera: () => void;
  latencyMs: number;
  mirrorVideo: boolean;
}

export const VideoTracker: React.FC<VideoTrackerProps> = ({
  videoRef,
  overlayCanvasRef,
  targetObject,
  activeTarget,
  allDetections,
  cameraReady,
  cameraError,
  onRequestCamera,
  latencyMs,
  mirrorVideo,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Video Viewport Container */}
      <div className="relative aspect-[4/3] w-full max-w-[640px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
        {/* Hidden Camera Error State */}
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950/95 backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Camera Access Issue</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">{cameraError}</p>
            <button
              onClick={onRequestCamera}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera Permission</span>
            </button>
          </div>
        ) : !cameraReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950">
            <RefreshCw className="w-7 h-7 text-blue-400 animate-spin mb-3" />
            <p className="text-xs text-slate-300 font-medium">Initializing Camera Feed...</p>
            <p className="text-[11px] text-slate-500 mt-1">Please allow camera permissions if prompted</p>
          </div>
        ) : null}

        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform ${
            mirrorVideo ? '-scale-x-100' : ''
          }`}
        />

        {/* Overlay Canvas for AI Bounding Boxes */}
        <canvas
          ref={overlayCanvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            mirrorVideo ? '-scale-x-100' : ''
          }`}
        />

        {/* HUD Overlay Elements */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-200">AI LIVE</span>
          </div>

          <div className="px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-mono text-slate-300">
            {latencyMs > 0 ? `${latencyMs}ms` : '-- ms'}
          </div>
        </div>

        {/* Target Reticle Indicator on Top Right */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md backdrop-blur-md text-xs font-medium border transition-colors ${
              activeTarget
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                : 'bg-slate-900/90 text-slate-400 border-slate-700/60'
            }`}
          >
            <Target className={`w-3.5 h-3.5 ${activeTarget ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>
              {activeTarget
                ? `LOCKED: ${activeTarget.class.toUpperCase()}`
                : `SEARCHING: ${targetObject === 'all' ? 'ANY' : targetObject.toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* Detected objects counter bar at bottom edge */}
        <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-none bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>Objects in scene:</span>
            <span className="text-white font-bold">{allDetections.length}</span>
            {allDetections.length > 0 && (
              <span className="text-slate-500 text-[10px] hidden sm:inline">
                ({allDetections.map((d) => d.class).join(', ')})
              </span>
            )}
          </div>
          <div className="text-slate-400">
            Source: <span className="text-slate-200">640×480 HD</span>
          </div>
        </div>
      </div>

      {/* Primary Video Stats Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Target Tracking</span>
          <span
            className={`font-semibold mt-0.5 ${
              activeTarget ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {activeTarget ? 'Target Locked' : 'Searching for Target'}
          </span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Confidence Score</span>
          <span className="font-semibold text-white mt-0.5 font-mono">
            {activeTarget ? `${Math.round(activeTarget.score * 100)}%` : '0%'}
          </span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">Inference Latency</span>
          <span className="font-semibold text-slate-200 mt-0.5 font-mono">
            {latencyMs > 0 ? `${latencyMs} ms` : 'Evaluating...'}
          </span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex flex-col">
          <span className="text-[11px] text-slate-400 font-medium">ESP32 Resolution</span>
          <span className="font-semibold text-cyan-400 mt-0.5 font-mono">
            160 × 128 (RGB565)
          </span>
        </div>
      </div>
    </div>
  );
};
