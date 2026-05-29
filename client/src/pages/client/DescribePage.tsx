import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import { compressImage, blobToBase64 } from '../../utils/imageUtils'

type Mode = 'text' | 'audio'

const MAX_PHOTOS = 5
const MAX_RECORD_SEC = 120   // 2 minutes max

export default function DescribePage() {
  const navigate = useNavigate()
  const { draft, setDescription, setPhotos, setAudio } = useDraftStore()

  /* ── Mode text / audio ──────────────────────────────────────── */
  const [mode, setMode] = useState<Mode>('text')

  /* ── Text ────────────────────────────────────────────────────── */
  const [text, setText] = useState(
    draft.description && draft.description !== 'Enregistrement audio joint à la demande.'
      ? draft.description
      : ''
  )

  /* ── Audio ───────────────────────────────────────────────────── */
  const [isRecording, setIsRecording]   = useState(false)
  const [audioURL, setAudioURL]         = useState<string | null>(null)
  const [audioSeconds, setAudioSeconds] = useState(0)
  const [audioReady, setAudioReady]     = useState(!!draft.audioBase64)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── Photos ──────────────────────────────────────────────────── */
  const [photos, setLocalPhotos] = useState<string[]>(draft.photos ?? [])
  const [photoLoading, setPhotoLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Audio : enregistrement ──────────────────────────────────── */
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      setAudioSeconds(0)
      setAudioURL(null)
      setAudioReady(false)

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url  = URL.createObjectURL(blob)
        const b64  = await blobToBase64(blob)
        setAudioURL(url)
        setAudio(b64)
        setAudioReady(true)
      }

      recorder.start(200)
      setIsRecording(true)

      // timer
      timerRef.current = setInterval(() => {
        setAudioSeconds(s => {
          if (s + 1 >= MAX_RECORD_SEC) stopRecording()
          return s + 1
        })
      }, 1000)
    } catch {
      alert("Impossible d'accéder au microphone. Vérifiez les autorisations.")
    }
  }

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  function resetAudio() {
    setAudioURL(null)
    setAudioReady(false)
    setAudio(undefined)
    setAudioSeconds(0)
  }

  function fmtTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  /* ── Photos : ajout ──────────────────────────────────────────── */
  async function handlePhotoFiles(files: FileList | null) {
    if (!files || photos.length >= MAX_PHOTOS) return
    setPhotoLoading(true)
    const remaining = MAX_PHOTOS - photos.length
    const toProcess = Array.from(files).slice(0, remaining)
    try {
      const compressed = await Promise.all(toProcess.map(f => compressImage(f)))
      const updated = [...photos, ...compressed]
      setLocalPhotos(updated)
      setPhotos(updated)
    } catch { /* ignore */ }
    setPhotoLoading(false)
  }

  function removePhoto(index: number) {
    const updated = photos.filter((_, i) => i !== index)
    setLocalPhotos(updated)
    setPhotos(updated)
  }

  /* ── Validation & navigation ─────────────────────────────────── */
  function handleNext() {
    const hasText  = text.trim().length >= 3
    const hasAudio = audioReady

    if (mode === 'text' && !hasText) return
    if (mode === 'audio' && !hasAudio) return

    // Description : texte saisi ou fallback audio
    const finalDesc = text.trim() || 'Enregistrement audio joint à la demande.'
    setDescription(finalDesc)
    navigate('/request/location')
  }

  const canContinue =
    (mode === 'text'  && text.trim().length >= 3) ||
    (mode === 'audio' && audioReady)

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="screen">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 flex items-center gap-2 min-h-[44px]">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Décrivez la situation</h1>
        <p className="text-gray-500 mt-1">Soyez précis pour aider l'huissier à intervenir efficacement.</p>
      </div>

      <div className="px-6 flex-1 flex flex-col gap-5 overflow-y-auto pb-4">

        {/* ── Sélecteur de mode ── */}
        <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
          {(['text', 'audio'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === m
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {m === 'text' ? '✏️ Texte' : '🎤 Audio'}
            </button>
          ))}
        </div>

        {/* ── Mode Texte ── */}
        {mode === 'text' && (
          <div className="flex flex-col gap-1">
            <textarea
              className="textarea h-44"
              placeholder="Ex : Mon propriétaire a changé les serrures sans préavis. J'ai besoin d'un constat d'huissier pour constater l'impossibilité d'accès..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
            />
            <div className="text-right text-xs text-gray-400">{text.length}/1000</div>
          </div>
        )}

        {/* ── Mode Audio ── */}
        {mode === 'audio' && (
          <div className="flex flex-col gap-4">
            {/* Bloc enregistrement */}
            <div className="card flex flex-col items-center gap-4 py-6">
              {!isRecording && !audioReady && (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-4xl">
                    🎤
                  </div>
                  <p className="text-gray-500 text-sm text-center">
                    Appuyez sur le bouton pour décrire la situation vocalement
                  </p>
                  <button
                    onClick={startRecording}
                    className="btn-primary w-auto px-8"
                  >
                    ● Démarrer l'enregistrement
                  </button>
                </>
              )}

              {isRecording && (
                <>
                  {/* Animation d'enregistrement */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-60" />
                    <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white text-3xl z-10">
                      ●
                    </div>
                  </div>
                  <div className="text-2xl font-mono font-bold text-red-600">
                    {fmtTime(audioSeconds)}
                  </div>
                  <p className="text-xs text-gray-400">Max {fmtTime(MAX_RECORD_SEC)}</p>
                  <button
                    onClick={stopRecording}
                    className="bg-red-600 text-white rounded-2xl py-4 px-8 font-bold text-base min-h-[56px] w-full"
                  >
                    ■ Arrêter l'enregistrement
                  </button>
                </>
              )}

              {audioReady && audioURL && (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-400 flex items-center justify-center text-4xl">
                    ✅
                  </div>
                  <p className="text-sm text-green-700 font-semibold">
                    Enregistrement de {fmtTime(audioSeconds)} prêt
                  </p>
                  <audio controls src={audioURL} className="w-full rounded-xl" />
                  <button
                    onClick={resetAudio}
                    className="text-sm text-red-500 underline"
                  >
                    Recommencer l'enregistrement
                  </button>
                </>
              )}
            </div>

            {/* Précisions textuelles optionnelles en mode audio */}
            <div>
              <p className="text-sm text-gray-600 font-medium mb-2">
                Précisions supplémentaires <span className="text-gray-400 font-normal">(optionnel)</span>
              </p>
              <textarea
                className="textarea h-24"
                placeholder="Ajoutez des détails par écrit si nécessaire..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
        )}

        {/* ── Section Photos ── */}
        <div className="card flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                📸 Photos
                <span className="text-xs text-gray-400 font-normal">({photos.length}/{MAX_PHOTOS})</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Optionnel, mais fortement recommandé</p>
            </div>
          </div>

          {/* Bandeau d'importance */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <span className="text-amber-500 text-lg shrink-0">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Les photos peuvent être déterminantes</strong> pour votre dossier.
              Photographiez les dégâts, documents, lieux ou tout élément utile à l'intervention.
            </p>
          </div>

          {/* Grille de photos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={src} alt={`photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bouton ajouter */}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoLoading}
              className="border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 active:bg-gray-50"
            >
              {photoLoading ? (
                <span className="animate-spin text-lg">⏳</span>
              ) : (
                <>
                  <span className="text-xl">+</span>
                  Ajouter {photos.length > 0 ? 'une autre photo' : 'une photo'}
                </>
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handlePhotoFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Bouton continuer */}
      <div className="px-6 pb-10 pt-3">
        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={!canContinue}
        >
          Continuer →
        </button>
        {mode === 'text' && text.trim().length > 0 && text.trim().length < 3 && (
          <p className="text-xs text-center text-gray-400 mt-2">Minimum 3 caractères</p>
        )}
      </div>
    </div>
  )
}
