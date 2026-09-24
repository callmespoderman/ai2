/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { VideoTracker } from './components/VideoTracker';
import { ESP32VirtualDisplay } from './components/ESP32VirtualDisplay';
import { FirmwareModal } from './components/FirmwareModal';
import { MixedContentModal } from './components/MixedContentModal';
import {
  DetectedObject,
  FramingMode,
  StreamStats,
  ESP32Settings,
  ConnectionStatus,
} from './types';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    cocoSsd?: {
      load: () => Promise<any>;
    };
    tf?: any;
  }
}

export default function App() {
  // --- State ---
  const [targetObject, setTargetObject] = useState<string>('person');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);
  const [framingMode, setFramingMode] = useState<FramingMode>('crop-target');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [aiLoaded, setAiLoaded] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mirrorVideo, setMirrorVideo] = useState<boolean>(false);
  const [activeTarget, setActiveTarget] = useState<DetectedObject | null>(null);
  const [allDetections, setAllDetections] = useState<DetectedObject[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Modals
  const [isFirmwareOpen, setIsFirmwareOpen] = useState<boolean>(false);
  const [isMixedContentOpen, setIsMixedContentOpen] = useState<boolean>(false);
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // ESP32 Settings
  const [settings, setSettings] = useState<ESP32Settings>({
    host: '192.168.1.108',
    port: 81,
    protocol: 'ws',
    path: '/',
    fps: 12,
    chunkSize: 4096,
    resolution: { width: 160, height: 128 },
  });

  // Streaming Telemetry Stats
  const [streamStats, setStreamStats] = useState<StreamStats>({
    fps: 0,
    detectionFps: 0,
    bandwidthKbps: 0,
    totalBytesSent: 0,
    framesSent: 0,
    droppedFrames: 0,
    bufferAmount: 0,
    latencyMs: 0,
  });

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const aiModelRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamIntervalRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const activeTargetBboxRef = useRef<[number, number, number, number] | null>(null);

  // Performance calculation refs
  const bytesSentLastSecRef = useRef<number>(0);
  const framesSentLastSecRef = useRef<number>(0);
  const totalBytesSentRef = useRef<number>(0);
  const totalFramesSentRef = useRef<number>(0);
  const droppedFramesRef = useRef<number>(0);
  const statIntervalRef = useRef<any>(null);

  // 1. Initialize Camera
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          deviceId: deviceId ? { exact: deviceId } : undefined,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setCameraReady(true);
        };
      }

      // Enumerate available video input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (!selectedDeviceId && videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraReady(false);
      setCameraError(
        err?.message ||
          'Failed to access camera. Please ensure camera permissions are allowed in your browser settings.'
      );
    }
  }, [selectedDeviceId]);

  // 2. Load TensorFlow COCO-SSD Model
  useEffect(() => {
    let isMounted = true;
    let timeout: any;

    const initAI = async () => {
      // Check if cocoSsd is available on window (from CDN scripts in index.html)
      if (window.cocoSsd) {
        try {
          const model = await window.cocoSsd.load();
          if (isMounted) {
            aiModelRef.current = model;
            setAiLoaded(true);
          }
        } catch (err) {
          console.error('Failed to load COCO-SSD:', err);
        }
      } else {
        // Retry in 300ms if script is still downloading
        timeout = setTimeout(initAI, 300);
      }
    };

    initAI();
    startCamera();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [startCamera]);

  // Device selection change handler
  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  // 3. AI Detection & Overlay Rendering Loop
  useEffect(() => {
    let isRunning = true;

    const detect = async () => {
      if (
        isRunning &&
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        aiModelRef.current &&
        overlayCanvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = overlayCanvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          const startTime = performance.now();
          let predictions: any[] = [];
          try {
            predictions = await aiModelRef.current.detect(video);
          } catch (e) {
            console.error('Detection error:', e);
          }
          const elapsed = Math.round(performance.now() - startTime);
          setLatencyMs(elapsed);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let foundTarget: DetectedObject | null = null;
          const detectedList: DetectedObject[] = [];

          for (const pred of predictions) {
            const isMatch =
              (targetObject === 'all' || pred.class.toLowerCase() === targetObject.toLowerCase()) &&
              pred.score >= confidenceThreshold;

            const [x, y, w, h] = pred.bbox;
            const detectedItem: DetectedObject = {
              class: pred.class,
              score: pred.score,
              bbox: [x, y, w, h],
            };
            detectedList.push(detectedItem);

            // Select highest confidence match as primary target
            if (isMatch) {
              if (!foundTarget || pred.score > foundTarget.score) {
                foundTarget = detectedItem;
              }
            }

            // Draw bounding box
            ctx.save();
            ctx.lineWidth = isMatch ? 3 : 1.5;
            ctx.strokeStyle = isMatch ? '#10b981' : 'rgba(239, 68, 68, 0.45)';
            ctx.strokeRect(x, y, w, h);

            // Corner reticles for targeted object
            if (isMatch) {
              const cornerLen = Math.min(w * 0.2, 16);
              ctx.lineWidth = 4;
              ctx.strokeStyle = '#34d399';

              // Top-left
              ctx.beginPath();
              ctx.moveTo(x, y + cornerLen);
              ctx.lineTo(x, y);
              ctx.lineTo(x + cornerLen, y);
              ctx.stroke();

              // Top-right
              ctx.beginPath();
              ctx.moveTo(x + w - cornerLen, y);
              ctx.lineTo(x + w, y);
              ctx.lineTo(x + w, y + cornerLen);
              ctx.stroke();

              // Bottom-left
              ctx.beginPath();
              ctx.moveTo(x, y + h - cornerLen);
              ctx.lineTo(x, y + h);
              ctx.lineTo(x + cornerLen, y + h);
              ctx.stroke();

              // Bottom-right
              ctx.beginPath();
              ctx.moveTo(x + w - cornerLen, y + h);
              ctx.lineTo(x + w, y + h);
              ctx.lineTo(x + w, y + h - cornerLen);
              ctx.stroke();
            }

            // Draw label pill
            const scorePercent = `${Math.round(pred.score * 100)}%`;
            const labelText = `${pred.class.toUpperCase()} ${scorePercent}`;
            ctx.font = 'bold 12px monospace';
            const textWidth = ctx.measureText(labelText).width;

            ctx.fillStyle = isMatch ? 'rgba(16, 185, 129, 0.9)' : 'rgba(30, 41, 59, 0.8)';
            ctx.fillRect(x, Math.max(0, y - 22), textWidth + 12, 20);

            ctx.fillStyle = isMatch ? '#ffffff' : '#e2e8f0';
            ctx.fillText(labelText, x + 6, Math.max(14, y - 7));

            ctx.restore();
          }

          setAllDetections(detectedList);
          setActiveTarget(foundTarget);
          activeTargetBboxRef.current = foundTarget ? foundTarget.bbox : null;
        }
      }

      if (isRunning) {
        animFrameIdRef.current = requestAnimationFrame(detect);
      }
    };

    if (aiLoaded) {
      animFrameIdRef.current = requestAnimationFrame(detect);
    }

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [aiLoaded, targetObject, confidenceThreshold]);

  // 4. Video Frame Slicing, RGB565 Conversion, and WebSocket Transmission
  const sendFrames = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    if (!processingCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = processingCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const targetW = settings.resolution.width; // 160
    const targetH = settings.resolution.height; // 128

    // Black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, targetW, targetH);

    const targetBbox = activeTargetBboxRef.current;

    // Crop / Frame scaling
    if (framingMode === 'crop-target' && targetBbox) {
      const [bx, by, bw, bh] = targetBbox;
      if (bw > 0 && bh > 0) {
        const scale = Math.min(targetW / bw, targetH / bh);
        const newW = bw * scale;
        const newH = bh * scale;
        const dx = (targetW - newW) / 2;
        const dy = (targetH - newH) / 2;
        ctx.drawImage(video, bx, by, bw, bh, dx, dy, newW, newH);
      } else {
        ctx.drawImage(video, 0, 0, targetW, targetH);
      }
    } else if (framingMode === 'center-crop') {
      const vW = video.videoWidth || 640;
      const vH = video.videoHeight || 480;
      const aspect = targetW / targetH; // 160/128 = 1.25
      let cropW = vW;
      let cropH = vW / aspect;
      if (cropH > vH) {
        cropH = vH;
        cropW = vH * aspect;
      }
      const cx = (vW - cropW) / 2;
      const cy = (vH - cropH) / 2;
      ctx.drawImage(video, cx, cy, cropW, cropH, 0, 0, targetW, targetH);
    } else {
      // 'fit-all'
      ctx.drawImage(video, 0, 0, targetW, targetH);
    }

    // Convert pixel data to RGB565 format (16 bits per pixel)
    const imgData = ctx.getImageData(0, 0, targetW, targetH).data;
    const payload = new Uint8Array(targetW * targetH * 2);

    let pIndex = 0;
    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];

      // RGB565: 5 bits Red, 6 bits Green, 5 bits Blue
      const rgb = ((r & 0xf8) << 8) | ((g & 0xfc) << 3) | (b >> 3);
      payload[pIndex++] = (rgb >> 8) & 0xff; // High byte
      payload[pIndex++] = rgb & 0xff; // Low byte
    }

    // Telemetry count
    const frameBytes = payload.length + 5; // payload + 'START'
    totalBytesSentRef.current += frameBytes;
    bytesSentLastSecRef.current += frameBytes;
    totalFramesSentRef.current += 1;
    framesSentLastSecRef.current += 1;

    // Send via WebSocket if live stream is active
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Drop frame if buffer is backlogged to protect ESP32 memory
      if (ws.bufferedAmount > 40960) {
        droppedFramesRef.current += 1;
        return;
      }

      // Tell ESP32 to reset frame buffer pointer for new frame
      ws.send('START');

      // Split into chunks (default 4KB) so ESP32 TCP stack does not overflow
      const chunkSize = settings.chunkSize || 4096;
      for (let i = 0; i < payload.length; i += chunkSize) {
        ws.send(payload.slice(i, i + chunkSize));
      }
    }
  }, [settings.resolution, settings.chunkSize, framingMode]);

  // 5. Bandwidth & FPS telemetry timer
  useEffect(() => {
    statIntervalRef.current = setInterval(() => {
      const bytesInSec = bytesSentLastSecRef.current;
      const framesInSec = framesSentLastSecRef.current;

      bytesSentLastSecRef.current = 0;
      framesSentLastSecRef.current = 0;

      setStreamStats((prev) => ({
        ...prev,
        fps: framesInSec,
        bandwidthKbps: bytesInSec / 1024,
        totalBytesSent: totalBytesSentRef.current,
        framesSent: totalFramesSentRef.current,
        droppedFrames: droppedFramesRef.current,
        bufferAmount: wsRef.current ? wsRef.current.bufferedAmount : 0,
      }));
    }, 1000);

    return () => {
      if (statIntervalRef.current) clearInterval(statIntervalRef.current);
    };
  }, []);

  // 6. Connect to Physical ESP32 WebSocket
  const toggleStreaming = () => {
    if (connectionStatus === 'streaming') {
      // Disconnect
      if (wsRef.current) wsRef.current.close();
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      setConnectionStatus('idle');
      return;
    }

    const host = settings.host.trim();
    if (!host) return;

    // Reset counters
    totalBytesSentRef.current = 0;
    totalFramesSentRef.current = 0;
    droppedFramesRef.current = 0;

    const url = `${settings.protocol}://${host}:${settings.port}${settings.path || '/'}`;
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('streaming');
        // Start streaming interval according to configured target FPS
        const intervalMs = Math.round(1000 / settings.fps);
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = setInterval(sendFrames, intervalMs);
      };

      ws.onerror = (e) => {
        console.error('WebSocket connection error:', e);
        setConnectionStatus('error');
        if (isHttps) {
          setIsMixedContentOpen(true);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('idle');
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      };
    } catch (err) {
      console.error('WebSocket creation error:', err);
      setConnectionStatus('error');
      if (isHttps) {
        setIsMixedContentOpen(true);
      }
    }
  };

  // 7. Virtual Simulator Mode Toggle (zero hardware required)
  const toggleSimulator = () => {
    if (connectionStatus === 'simulator') {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      setConnectionStatus('idle');
      return;
    }

    // Stop real WS if open
    if (wsRef.current) wsRef.current.close();
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

    totalBytesSentRef.current = 0;
    totalFramesSentRef.current = 0;
    droppedFramesRef.current = 0;

    setConnectionStatus('simulator');
    const intervalMs = Math.round(1000 / settings.fps);
    streamIntervalRef.current = setInterval(sendFrames, intervalMs);
  };

  // Update stream interval if FPS changes during streaming
  useEffect(() => {
    if (connectionStatus === 'streaming' || connectionStatus === 'simulator') {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      const intervalMs = Math.round(1000 / settings.fps);
      streamIntervalRef.current = setInterval(sendFrames, intervalMs);
    }
  }, [settings.fps, connectionStatus, sendFrames]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header with App Status and Guides */}
      <Header
        connectionStatus={connectionStatus}
        aiLoaded={aiLoaded}
        cameraReady={cameraReady}
        onOpenFirmware={() => setIsFirmwareOpen(true)}
        onOpenMixedContentHelp={() => setIsMixedContentOpen(true)}
        isHttps={isHttps}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 flex flex-col gap-6">
        {/* Mixed Content Banner on HTTPS if connection failed */}
        {connectionStatus === 'error' && isHttps && (
          <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Connection Failed (Mixed Content Blocked)</h4>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Your browser blocked the unencrypted local WebSocket (<code className="bg-rose-900/60 px-1 py-0.5 rounded text-rose-100">ws://{settings.host}</code>) from this HTTPS page.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMixedContentOpen(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
              >
                View 10s Fix Guide
              </button>
              <button
                onClick={toggleSimulator}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                Use Simulator
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Controls Sidebar (4 cols on lg) */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6">
            <ControlPanel
              targetObject={targetObject}
              onTargetChange={setTargetObject}
              confidenceThreshold={confidenceThreshold}
              onConfidenceChange={setConfidenceThreshold}
              framingMode={framingMode}
              onFramingModeChange={setFramingMode}
              settings={settings}
              onSettingsChange={setSettings}
              connectionStatus={connectionStatus}
              aiLoaded={aiLoaded}
              onToggleStream={toggleStreaming}
              onToggleSimulator={toggleSimulator}
              videoDevices={videoDevices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={handleSelectDevice}
              mirrorVideo={mirrorVideo}
              onToggleMirror={() => setMirrorVideo(!mirrorVideo)}
            />
          </div>

          {/* Right Column: Video Tracker & ESP32 Virtual Display (8 cols on lg) */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-6">
            {/* Primary Video Tracker */}
            <VideoTracker
              videoRef={videoRef}
              overlayCanvasRef={overlayCanvasRef}
              targetObject={targetObject}
              activeTarget={activeTarget}
              allDetections={allDetections}
              cameraReady={cameraReady}
              cameraError={cameraError}
              onRequestCamera={() => startCamera(selectedDeviceId)}
              latencyMs={latencyMs}
              mirrorVideo={mirrorVideo}
            />

            {/* ESP32 Hardware Stream Preview */}
            <ESP32VirtualDisplay
              canvasRef={processingCanvasRef}
              streamStats={streamStats}
              connectionStatus={connectionStatus}
              targetObject={targetObject}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          AI Smart Tracker • Ready for Vercel Deployment • TensorFlow.js COCO-SSD • ESP32 TFT_eSPI
          RGB565 Pipeline
        </p>
      </footer>

      {/* Modals */}
      <FirmwareModal
        isOpen={isFirmwareOpen}
        onClose={() => setIsFirmwareOpen(false)}
        port={settings.port}
      />

      <MixedContentModal
        isOpen={isMixedContentOpen}
        onClose={() => setIsMixedContentOpen(false)}
        onOpenSimulator={toggleSimulator}
      />
    </div>
  );
}
