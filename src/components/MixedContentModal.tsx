import React from 'react';
import { X, ShieldAlert, CheckCircle2, Lock, ArrowRight, MonitorPlay } from 'lucide-react';

interface MixedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
}

export const MixedContentModal: React.FC<MixedContentModalProps> = ({
  isOpen,
  onClose,
  onOpenSimulator,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Vercel HTTPS & Local ESP32 WebSocket Guide
              </h2>
              <p className="text-xs text-slate-400">
                Fixing browser Mixed Content restrictions when connecting to local IP addresses
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-300">
              <Lock className="w-4 h-4" /> Why does this happen?
            </p>
            Vercel serves web apps securely over <strong className="text-white">HTTPS</strong>. By default,
            modern browsers (Chrome, Edge, Brave, Safari) block scripts on HTTPS pages from initiating
            unencrypted plain <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">ws://</code> connections
            to local network IP addresses (like <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">192.168.1.x</code>).
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Choose an Easy Solution:
            </h3>

            <div className="space-y-3">
              {/* Option 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Option 1: Allow Insecure Content (Recommended for Chrome / Edge / Brave)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">10 seconds</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 pl-1">
                  <li>Click the <strong className="text-white">Site Settings / Tune icon</strong> on the left of the address bar</li>
                  <li>Click <strong className="text-white">Site settings</strong></li>
                  <li>Scroll to <strong className="text-white">Insecure content</strong> and set it to <strong className="text-emerald-400">Allow</strong></li>
                  <li>Refresh this tab — the ESP32 WebSocket will now connect immediately!</li>
                </ol>
              </div>

              {/* Option 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <MonitorPlay className="w-4 h-4" />
                    Option 2: Test in Virtual ESP32 Simulator Mode
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  You can test all AI object detection, auto-tracking zoom, and 160×128 RGB565 byte streaming
                  directly in the browser simulator right now without physical hardware.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSimulator();
                  }}
                  className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span>Launch Virtual Simulator</span>
                </button>
              </div>

              {/* Option 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-slate-300">
                  Option 3: Use Localhost Development Server
                </span>
                <p className="text-xs text-slate-400">
                  Running this app locally on <code className="text-blue-400">http://localhost:3000</code> does not enforce HTTPS mixed-content restrictions, so it connects directly to your ESP32 out of the box.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
