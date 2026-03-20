/**
 * App.jsx — Root orchestrator
 *
 * Responsibilities:
 * 1. Hold the video ref (DOM bridge between hook and canvas)
 * 2. Configure model URLs (swap with your Teachable Machine URLs)
 * 3. Wire useTeachableMachine → ClassificationCanvas
 * 4. Render global layout and branding
 *
 * Clean Architecture: zero TensorFlow imports here.
 * All ML logic lives in useTeachableMachine.
 */

import React, { useRef } from 'react'
import { useTeachableMachine } from './hooks/useTeachableMachine'
import ClassificationCanvas from './components/ClassificationCanvas'

// ─── Model Configuration ─────────────────────────────────────────────────────
// Replace these URLs with your own Teachable Machine export URLs.
// Export → "Upload" from teachablemachine.withgoogle.com to get public URLs.
//
// Example (demo — may expire):
//   https://teachablemachine.withgoogle.com/models/XXXXXXXX/model.json
//   https://teachablemachine.withgoogle.com/models/XXXXXXXX/metadata.json
//
const MODEL_URL =
  import.meta.env.VITE_TM_MODEL_URL ||
  'https://teachablemachine.withgoogle.com/models/wyx5CdNzl/model.json'

const METADATA_URL =
  import.meta.env.VITE_TM_METADATA_URL ||
  'https://teachablemachine.withgoogle.com/models/wyx5CdNzl/metadata.json'

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Video element ref — passed to hook (for prediction) and canvas (for display)
  const videoRef = useRef(null)

  // All model state comes from the hook
  const { status, predictions, topPrediction, error, fps } = useTeachableMachine(
    MODEL_URL,
    METADATA_URL,
    videoRef
  )

  return (
    <div className="min-h-screen bg-void flex flex-col overflow-hidden">
      {/* ── Background grain ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
          backgroundSize: '150px',
        }}
      />

      {/* ── Accent glow orbs ── */}
      <div
        className="fixed top-[-20%] left-[-10%] w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="fixed bottom-[-20%] right-[-10%] w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,45,120,0.08) 0%, transparent 70%)',
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00e5ff22, #ff2d7822)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ color: '#00e5ff', fontSize: '14px', fontWeight: 'bold' }}>G</span>
          </div>
          <div>
            <p className="font-display text-xl tracking-widest text-white leading-none">
              GENDERLENS
            </p>
            <p className="font-mono-custom text-[9px] text-white/30 tracking-widest uppercase">
              Clasificador Neural
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status pill */}
          <div
            className="px-3 py-1 rounded-sm text-[10px] font-mono-custom uppercase tracking-widest border"
            style={
              status === 'ready'
                ? { borderColor: '#00e5ff44', color: '#00e5ff', background: '#00e5ff11' }
                : status === 'error'
                ? { borderColor: '#ff2d7844', color: '#ff2d78', background: '#ff2d7811' }
                : { borderColor: '#ffffff11', color: '#ffffff33', background: 'transparent' }
            }
          >
            {status === 'ready'
              ? '● ACTIVO'
              : status === 'error'
              ? '✕ ERROR'
              : '○ INIT'}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 lg:px-12 py-8">
        <ClassificationCanvas
          videoRef={videoRef}
          status={status}
          predictions={predictions}
          topPrediction={topPrediction}
          error={error}
          fps={fps}
        />
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 lg:px-12 py-4 border-t border-white/5 flex justify-between items-center">
        <p className="font-mono-custom text-[10px] text-white/20">
          Powered by TensorFlow.js + Teachable Machine
        </p>
        <p className="font-mono-custom text-[10px] text-white/20">
          {new Date().getFullYear()} · Clean Architecture
        </p>
      </footer>
    </div>
  )
}
