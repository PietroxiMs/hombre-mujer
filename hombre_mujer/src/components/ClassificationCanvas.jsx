/**
 * ClassificationCanvas
 *
 * Pure presentational component — receives model output and renders:
 * - Camera video feed with AR-style overlay
 * - Top label badge (Hombre / Mujer)
 * - Confidence bars for all classes
 * - Status overlays (loading, error, idle)
 *
 * Props intentionally match the hook's return shape for easy composition.
 */

import React, { useMemo } from 'react'

// ─── Label configuration ──────────────────────────────────────────────────────
const LABEL_CONFIG = {
  Hombre: {
    color: '#00e5ff',
    glowClass: 'glow-cyan',
    textGlow: 'glow-text-cyan',
    barColor: 'bg-[#00e5ff]',
    icon: '♂',
    gradient: 'from-[#00e5ff]/20 to-transparent',
  },
  Mujer: {
    color: '#ff2d78',
    glowClass: 'glow-pink',
    textGlow: 'glow-text-pink',
    barColor: 'bg-[#ff2d78]',
    icon: '♀',
    gradient: 'from-[#ff2d78]/20 to-transparent',
  },
}

const DEFAULT_CONFIG = {
  color: '#ffb800',
  glowClass: '',
  textGlow: '',
  barColor: 'bg-[#ffb800]',
  icon: '◈',
  gradient: 'from-[#ffb800]/20 to-transparent',
}

function getLabelConfig(name) {
  return LABEL_CONFIG[name] ?? DEFAULT_CONFIG
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated scan line that sweeps over the video */
function ScanLine({ active }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <div
        className="absolute left-0 right-0 h-[2px] opacity-40"
        style={{
          background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)',
          animation: 'scan 3s linear infinite',
        }}
      />
    </div>
  )
}

/** Top label badge — prominent, above the video */
function LabelBadge({ topPrediction }) {
  if (!topPrediction) return null

  const cfg = getLabelConfig(topPrediction.className)
  const pct = Math.round(topPrediction.probability * 100)

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 rounded-sm border ${cfg.glowClass}`}
      style={{
        borderColor: cfg.color,
        background: `linear-gradient(135deg, ${cfg.color}18, transparent)`,
      }}
    >
      <span
        className="font-display text-5xl leading-none"
        style={{ color: cfg.color }}
      >
        {cfg.icon}
      </span>
      <div>
        <p className="font-display text-4xl leading-none tracking-widest" style={{ color: cfg.color }}>
          {topPrediction.className.toUpperCase()}
        </p>
        <p className="font-mono-custom text-xs mt-1" style={{ color: `${cfg.color}99` }}>
          CONFIANZA: {pct}%
        </p>
      </div>
    </div>
  )
}

/** Individual confidence bar row */
function ConfidenceBar({ prediction }) {
  const cfg = getLabelConfig(prediction.className)
  const pct = Math.round(prediction.probability * 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-body text-xs text-white/60 uppercase tracking-widest">
          {prediction.className}
        </span>
        <span
          className="font-mono-custom text-sm font-medium"
          style={{ color: cfg.color }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full confidence-bar`}
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
            boxShadow: `0 0 8px ${cfg.color}66`,
          }}
        />
      </div>
    </div>
  )
}

/** Overlay shown while loading model or camera */
function LoadingOverlay({ status }) {
  const messages = {
    'loading-model': ['Cargando modelo de IA', 'Inicializando TensorFlow…'],
    'loading-camera': ['Accediendo a la cámara', 'Preparando feed de video…'],
  }

  const [title, subtitle] = messages[status] ?? ['Inicializando…', '']

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/80 z-20 backdrop-blur-sm">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-6">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: '#00e5ff',
            borderRightColor: '#00e5ff22',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: '#ff2d78',
            borderRightColor: '#ff2d7822',
            animation: 'spin 1.2s linear infinite reverse',
          }}
        />
      </div>
      <p className="font-display text-2xl tracking-widest text-white/90">{title}</p>
      <p className="font-mono-custom text-xs text-white/40 mt-2">{subtitle}</p>
    </div>
  )
}

/** Error state overlay */
function ErrorOverlay({ message }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/90 z-20 p-8 text-center">
      <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full border border-[#ff2d78] text-[#ff2d78] text-2xl">
        ✕
      </div>
      <p className="font-display text-xl tracking-wider text-[#ff2d78] mb-3">ERROR DE SISTEMA</p>
      <p className="font-body text-sm text-white/60 max-w-sm leading-relaxed">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2 border border-white/20 text-white/60 text-xs font-mono-custom uppercase tracking-widest hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}

/** Corner brackets decorative frame */
function CameraFrame({ active }) {
  const color = active ? '#00e5ff' : '#ffffff22'
  return (
    <>
      {/* TL */}
      <div className="absolute top-0 left-0 w-6 h-6" style={{ borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      {/* TR */}
      <div className="absolute top-0 right-0 w-6 h-6" style={{ borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      {/* BL */}
      <div className="absolute bottom-0 left-0 w-6 h-6" style={{ borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      {/* BR */}
      <div className="absolute bottom-0 right-0 w-6 h-6" style={{ borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @param {{
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   status: import('../hooks/useTeachableMachine').ModelStatus,
 *   predictions: import('../hooks/useTeachableMachine').Prediction[],
 *   topPrediction: import('../hooks/useTeachableMachine').Prediction | null,
 *   error: string | null,
 *   fps: number,
 * }} props
 */
export default function ClassificationCanvas({
  videoRef,
  status,
  predictions,
  topPrediction,
  error,
  fps,
}) {
  const isReady = status === 'ready'
  const isLoading = status === 'loading-model' || status === 'loading-camera'
  const isError = status === 'error'

  // Sort predictions descending by probability for display
  const sortedPredictions = useMemo(
    () => [...predictions].sort((a, b) => b.probability - a.probability),
    [predictions]
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl mx-auto">
      {/* ── Video Feed Panel ── */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Label badge above camera */}
        <div className="h-20 flex items-center justify-center">
          {isReady && topPrediction ? (
            <LabelBadge topPrediction={topPrediction} />
          ) : (
            <div className="font-display text-2xl tracking-widest text-white/20">
              ESPERANDO SEÑAL…
            </div>
          )}
        </div>

        {/* Camera container */}
        <div
          className="relative overflow-hidden bg-[#0a0a0a] scanlines"
          style={{ aspectRatio: '4/3' }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />

          {/* Decorative frame */}
          <CameraFrame active={isReady} />

          {/* Scan line animation when ready */}
          <ScanLine active={isReady} />

          {/* Loading overlay */}
          {isLoading && <LoadingOverlay status={status} />}

          {/* Error overlay */}
          {isError && error && <ErrorOverlay message={error} />}

          {/* FPS counter */}
          {isReady && (
            <div className="absolute bottom-2 left-2 font-mono-custom text-[10px] text-white/30 z-20">
              {fps} FPS
            </div>
          )}

          {/* Live indicator */}
          {isReady && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff2d78] animate-pulse" />
              <span className="font-mono-custom text-[10px] text-white/50">LIVE</span>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex justify-between items-center px-1">
          <span className="font-mono-custom text-[10px] text-white/25 uppercase tracking-widest">
            {status.replace(/-/g, ' ')}
          </span>
          <span className="font-mono-custom text-[10px] text-white/25">
            GENDERLENS v1.0
          </span>
        </div>
      </div>

      {/* ── Classification Panel ── */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        {/* Header */}
        <div className="border-b border-white/10 pb-3">
          <p className="font-display text-xl tracking-widest text-white/80">ANÁLISIS</p>
          <p className="font-mono-custom text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">
            Clasificación en tiempo real
          </p>
        </div>

        {/* Confidence bars */}
        <div className="flex flex-col gap-4">
          {isReady && sortedPredictions.length > 0 ? (
            sortedPredictions.map((pred) => (
              <ConfidenceBar key={pred.className} prediction={pred} />
            ))
          ) : (
            // Skeleton bars
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-white/5 rounded" />
                  <div className="h-3 w-8 bg-white/5 rounded" />
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full" />
              </div>
            ))
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-4 mt-auto">
          <p className="font-mono-custom text-[10px] text-white/20 leading-relaxed">
            Modelo: Teachable Machine
            <br />
            Motor: TensorFlow.js
            <br />
            Inferencia: ~15fps (throttled)
          </p>
        </div>

        {/* Top class detail card */}
        {isReady && topPrediction && (() => {
          const cfg = getLabelConfig(topPrediction.className)
          const pct = Math.round(topPrediction.probability * 100)
          return (
            <div
              className="rounded-sm p-4 border"
              style={{
                borderColor: `${cfg.color}33`,
                background: `linear-gradient(135deg, ${cfg.color}0d, transparent)`,
              }}
            >
              <p className="font-mono-custom text-[10px] text-white/40 uppercase tracking-widest mb-2">
                Resultado Principal
              </p>
              <p
                className="font-display text-3xl tracking-wider"
                style={{ color: cfg.color }}
              >
                {topPrediction.className.toUpperCase()}
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span
                  className="font-display text-5xl leading-none"
                  style={{ color: cfg.color }}
                >
                  {pct}
                </span>
                <span className="font-mono-custom text-sm text-white/40 mb-1">
                  % confianza
                </span>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
