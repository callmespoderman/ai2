import React, { useState } from 'react';
import { X, Copy, Check, Terminal, ExternalLink, Cpu, Info } from 'lucide-react';
import { getESP32ArduinoCode } from '../utils/arduinoCode';

interface FirmwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  port: number;
}

export const FirmwareModal: React.FC<FirmwareModalProps> = ({ isOpen, onClose, port }) => {
  const [copied, setCopied] = useState(false);
  const code = getESP32ArduinoCode(160, 128, port);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ESP32 Firmware & Wiring Guide</h2>
              <p className="text-xs text-slate-400">
                Arduino C++ sketch for receiving 160×128 RGB565 over WebSocket
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick Hardware Pinout Reference */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" />
              1. Standard SPI Pinout (ESP32 to ST7735 / ILI9341)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MOSI / SDA</span>
                <span className="text-emerald-400 font-bold">GPIO 23</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SCK / SCL</span>
                <span className="text-emerald-400 font-bold">GPIO 18</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CS (Chip Select)</span>
                <span className="text-cyan-400 font-bold">GPIO 5</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DC / A0 (Data/Cmd)</span>
                <span className="text-cyan-400 font-bold">GPIO 2</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">RST (Reset)</span>
                <span className="text-indigo-400 font-bold">GPIO 4</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">BLK (Backlight)</span>
                <span className="text-amber-400 font-bold">3.3V</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">VCC</span>
                <span className="text-rose-400 font-bold">3.3V or 5V</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">GND</span>
                <span className="text-slate-400 font-bold">GND</span>
              </div>
            </div>
          </div>

          {/* Arduino Code Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                2. Arduino IDE C++ Sketch
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Sketch</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[320px] leading-relaxed selection:bg-blue-600 selection:text-white">
                <code>{code}</code>
              </pre>
            </div>
          </div>

          {/* Libraries instructions */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
            <h4 className="font-semibold text-slate-200">Quick Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
              <li>In Arduino IDE, open <strong className="text-slate-200">Tools → Manage Libraries...</strong></li>
              <li>Install <code className="text-blue-400">WebSockets by Markus Sattler</code> (v2.4.0+)</li>
              <li>Install <code className="text-blue-400">TFT_eSPI by Bodmer</code> (configure for your ST7735 or ILI9341 display in User_Setup.h)</li>
              <li>Replace <code className="text-amber-400">YOUR_WIFI_SSID</code> and <code className="text-amber-400">YOUR_WIFI_PASSWORD</code></li>
              <li>Upload sketch to your ESP32. Open Serial Monitor (115200 baud) to note the assigned IP address</li>
              <li>Enter the IP address in this web app and click <strong className="text-slate-200">Start Streaming</strong>!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
