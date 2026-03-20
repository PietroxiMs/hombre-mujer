/**
 * useTeachableMachine
 *
 * Custom hook that encapsulates all TensorFlow / Teachable Machine logic.
 * Separates model inference from UI concerns (Clean Architecture).
 *
 * State machine: idle → loading → ready → error
 * Inference loop: requestAnimationFrame with configurable throttle (ms per prediction)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────
const PREDICTION_INTERVAL_MS = 66 // ~15 predictions/sec — balanced accuracy vs CPU

// ─── Types (JSDoc) ───────────────────────────────────────────────────────────
/**
 * @typedef {'idle' | 'loading-model' | 'loading-camera' | 'ready' | 'error'} ModelStatus
 * @typedef {{ className: string; probability: number }} Prediction
 */

// ─── Hook ────────────────────────────────────────────────────────────────────
/**
 * @param {string} modelURL       - URL to Teachable Machine model.json
 * @param {string} metadataURL    - URL to Teachable Machine metadata.json
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Ref to the <video> element
 * @returns {{
 *   status: ModelStatus,
 *   predictions: Prediction[],
 *   topPrediction: Prediction | null,
 *   error: string | null,
 *   fps: number,
 * }}
 */
export function useTeachableMachine(modelURL, metadataURL, videoRef) {
  const [status, setStatus] = useState(/** @type {ModelStatus} */ ('idle'))
  const [predictions, setPredictions] = useState(/** @type {Prediction[]} */ ([]))
  const [error, setError] = useState(/** @type {string|null} */ (null))
  const [fps, setFps] = useState(0)

  // Internal refs — survive re-renders without causing them
  const modelRef = useRef(null)
  const rafIdRef = useRef(null)
  const lastPredictTimeRef = useRef(0)
  const fpsCounterRef = useRef({ frames: 0, lastReset: performance.now() })
  const streamRef = useRef(null)

  // ── Load model ─────────────────────────────────────────────────────────────
  const loadModel = useCallback(async () => {
    setStatus('loading-model')
    setError(null)

    try {
      // Dynamic import to keep initial bundle lean
      const tmImage = await import('@teachablemachine/image')
      modelRef.current = await tmImage.load(modelURL, metadataURL)
    } catch (err) {
      const message =
        err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')
          ? 'No se pudo descargar el modelo. Verifica la URL o tu conexión a internet.'
          : `Error al cargar el modelo: ${err.message}`
      setError(message)
      setStatus('error')
      return false
    }

    return true
  }, [modelURL, metadataURL])

  // ── Start webcam ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return false

    setStatus('loading-camera')

    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const video = videoRef.current
      video.srcObject = stream

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve
        video.onerror = reject
        // Timeout safeguard
        setTimeout(() => reject(new Error('Video metadata timeout')), 8000)
      })

      await video.play()
    } catch (err) {
      let message = 'Error desconocido al acceder a la cámara.'

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        message =
          'Acceso a la cámara denegado. Por favor, permite el acceso en los ajustes de tu navegador y recarga la página.'
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        message =
          'No se encontró ninguna cámara. Conecta una webcam e inténtalo de nuevo.'
      } else if (err.name === 'NotReadableError') {
        message =
          'La cámara está siendo usada por otra aplicación. Ciérrala y recarga la página.'
      } else if (err.message) {
        message = `Error de cámara: ${err.message}`
      }

      setError(message)
      setStatus('error')
      return false
    }

    return true
  }, [videoRef])

  // ── Inference loop (RAF + throttle) ───────────────────────────────────────
  const runPredictionLoop = useCallback(() => {
    const model = modelRef.current
    const video = videoRef.current

    if (!model || !video || video.readyState < 2) {
      rafIdRef.current = requestAnimationFrame(runPredictionLoop)
      return
    }

    const now = performance.now()

    // FPS counter (display-side, counts RAF calls = visual fps)
    fpsCounterRef.current.frames++
    if (now - fpsCounterRef.current.lastReset >= 1000) {
      setFps(fpsCounterRef.current.frames)
      fpsCounterRef.current.frames = 0
      fpsCounterRef.current.lastReset = now
    }

    // Throttle prediction to PREDICTION_INTERVAL_MS
    if (now - lastPredictTimeRef.current >= PREDICTION_INTERVAL_MS) {
      lastPredictTimeRef.current = now

      // Run inference asynchronously — does NOT block the RAF loop
      model
        .predict(video)
        .then((results) => {
          setPredictions(results)
        })
        .catch((err) => {
          // Silent fail on individual frame — avoid cascading errors
          console.warn('[TM] Prediction frame error:', err.message)
        })
    }

    rafIdRef.current = requestAnimationFrame(runPredictionLoop)
  }, [videoRef])

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    modelRef.current = null
  }, [videoRef])

  // ── Main effect ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      const modelOk = await loadModel()
      if (!modelOk || cancelled) return

      const cameraOk = await startCamera()
      if (!cameraOk || cancelled) return

      if (!cancelled) {
        setStatus('ready')
        rafIdRef.current = requestAnimationFrame(runPredictionLoop)
      }
    }

    init()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [loadModel, startCamera, runPredictionLoop, cleanup])

  // ── Derived state ──────────────────────────────────────────────────────────
  const topPrediction =
    predictions.length > 0
      ? predictions.reduce((a, b) => (a.probability > b.probability ? a : b))
      : null

  return { status, predictions, topPrediction, error, fps }
}
