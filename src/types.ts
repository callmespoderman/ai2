export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export type FramingMode = 'crop-target' | 'fit-all' | 'center-crop';

export interface StreamStats {
  fps: number;
  detectionFps: number;
  bandwidthKbps: number;
  totalBytesSent: number;
  framesSent: number;
  droppedFrames: number;
  bufferAmount: number;
  latencyMs: number;
}

export interface ESP32Settings {
  host: string;
  port: number;
  protocol: 'ws' | 'wss';
  path: string;
  fps: number; // target streaming FPS (e.g., 12)
  chunkSize: number; // default 4096
  resolution: {
    width: number;
    height: number;
  };
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'streaming'
  | 'error'
  | 'simulator';
