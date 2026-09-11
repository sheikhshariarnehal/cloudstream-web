import React, { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import type { StreamLinkDTO, SubtitleDTO, AniSkipResponseDTO, EpisodeDTO } from '../../types/media'
import { saveWatchProgress } from '../../services/db'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Subtitles,
  FastForward,
  SkipForward,
  ArrowLeft,
  Tv,
} from 'lucide-react'

interface CinemaVideoPlayerProps {
  title: string
  subTitle?: string
  mediaUrl: string
  apiName: string
  season?: number
  episode?: number
  posterUrl?: string
  links: StreamLinkDTO[]
  subtitles: SubtitleDTO[]
  aniskip?: AniSkipResponseDTO
  nextEpisode?: EpisodeDTO
  onNextEpisode?: () => void
  onClose: () => void
}

export const CinemaVideoPlayer: React.FC<CinemaVideoPlayerProps> = ({
  title,
  subTitle,
  mediaUrl,
  apiName,
  season = 1,
  episode = 1,
  posterUrl,
  links,
  subtitles,
  aniskip,
  nextEpisode,
  onNextEpisode,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // State
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'fill' | 'cover'>('contain')
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [controlsVisible, setControlsVisible] = useState(true)

  // Qualities & Audio Tracks
  const [availableQualities, setAvailableQualities] = useState<{ index: number; name: string }[]>([])
  const [currentQuality, setCurrentQuality] = useState(-1) // -1 is Auto
  const [audioTracks, setAudioTracks] = useState<{ index: number; name: string }[]>([])
  const [currentAudioTrack, setCurrentAudioTrack] = useState(0)

  // Subtitles
  const [selectedSubUrl, setSelectedSubUrl] = useState<string>('')
  const [subtitleCues] = useState<string>('')
  const [subOffsetSeconds, setSubOffsetSeconds] = useState(0)
  const [subFontSize] = useState(1.3)

  // Modals
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false)
  const [showServerMenu, setShowServerMenu] = useState(false)

  const activeLink = links[currentLinkIndex] || links[0]

  // Initialize Hls and load stream
  useEffect(() => {
    const video = videoRef.current
    if (!video || !activeLink) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (activeLink.isM3u8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      })

      hlsRef.current = hls
      hls.loadSource(activeLink.url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((lvl, idx) => ({
          index: idx,
          name: lvl.height ? `${lvl.height}p` : `Level ${idx}`,
        }))
        setAvailableQualities([{ index: -1, name: 'Auto (ABR)' }, ...levels])
        video.play().catch(() => setIsPlaying(false))
      })

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        const tracks = data.audioTracks.map((t, idx) => ({
          index: idx,
          name: t.name || t.lang || `Track ${idx + 1}`,
        }))
        setAudioTracks(tracks)
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.warn('[HLS Fatal Error]', data.type, data.details)
          // Auto-failover to next server if available
          if (currentLinkIndex + 1 < links.length) {
            console.log(`[Player] Auto-failover to server ${currentLinkIndex + 2}`)
            setCurrentLinkIndex((prev) => prev + 1)
          }
        }
      })
    } else {
      video.src = activeLink.url
      video.play().catch(() => setIsPlaying(false))
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [activeLink, currentLinkIndex, links.length])

  // Save watch progress to IndexedDB throttled
  useEffect(() => {
    if (currentTime <= 0 || duration <= 0) return
    const interval = setInterval(() => {
      saveWatchProgress({
        id: `${apiName}_${mediaUrl}_s${season}_e${episode}`,
        mediaUrl,
        mediaName: title,
        apiName,
        episodeTitle: subTitle,
        season,
        episode,
        progressSeconds: Math.floor(currentTime),
        durationSeconds: Math.floor(duration),
        posterUrl,
        updatedAt: Date.now(),
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [currentTime, duration, apiName, mediaUrl, season, episode, title, subTitle, posterUrl])

  // Video Event Handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 0)
    }
  }

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
    }
  }

  const handleSeekSlider = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = pos * duration
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          if (videoRef.current) {
            const v = Math.min(1, videoRef.current.volume + 0.1)
            videoRef.current.volume = v
            setVolume(v)
            setIsMuted(false)
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (videoRef.current) {
            const v = Math.max(0, videoRef.current.volume - 0.1)
            videoRef.current.volume = v
            setVolume(v)
          }
          break
        case 'KeyM':
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted
            setIsMuted(videoRef.current.muted)
          }
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'KeyC':
          e.preventDefault()
          setShowSubtitleMenu((prev) => !prev)
          break
        case 'KeyN':
          if (onNextEpisode) {
            e.preventDefault()
            onNextEpisode()
          }
          break
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
          } else {
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, onNextEpisode, onClose])

  // Auto-hide controls timer
  useEffect(() => {
    let timeout: any
    const showControls = () => {
      setControlsVisible(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (isPlaying) setControlsVisible(false)
      }, 3500)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', showControls)
      container.addEventListener('click', showControls)
    }

    return () => {
      clearTimeout(timeout)
      if (container) {
        container.removeEventListener('mousemove', showControls)
        container.removeEventListener('click', showControls)
      }
    }
  }, [isPlaying])

  // AniSkip Check
  const showSkipOp = aniskip?.found && aniskip.opStart && aniskip.opEnd && currentTime >= aniskip.opStart && currentTime <= aniskip.opEnd
  const showSkipEd = aniskip?.found && aniskip.edStart && aniskip.edEnd && currentTime >= aniskip.edStart && currentTime <= aniskip.edEnd

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const videoAspectClass = aspectRatio === 'fill' ? 'aspect-stretch' : aspectRatio === 'cover' ? 'aspect-zoom' : ''

  return (
    <div className="player-container" ref={containerRef}>
      <video
        ref={videoRef}
        className={`player-video-element ${videoAspectClass}`}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Subtitle Cue Rendering Overlay */}
      {subtitleCues && (
        <div className="subtitle-overlay-box">
          <div className="subtitle-cue-text" style={{ fontSize: `${subFontSize}rem` }}>
            {subtitleCues}
          </div>
        </div>
      )}

      {/* AniSkip Floating Buttons */}
      {showSkipOp && aniskip?.opEnd && (
        <button
          className="aniskip-btn"
          onClick={() => {
            if (videoRef.current && aniskip.opEnd) {
              videoRef.current.currentTime = aniskip.opEnd
            }
          }}
        >
          <FastForward size={18} /> Skip Opening
        </button>
      )}

      {showSkipEd && aniskip?.edEnd && (
        <button
          className="aniskip-btn"
          onClick={() => {
            if (videoRef.current && aniskip.edEnd) {
              videoRef.current.currentTime = aniskip.edEnd
            }
          }}
        >
          <FastForward size={18} /> Skip Ending
        </button>
      )}

      {/* Next Episode Countdown Overlay */}
      {nextEpisode && duration > 0 && duration - currentTime < 25 && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            left: 36,
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 120,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700 }}>UP NEXT</div>
            <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{nextEpisode.name || `Episode ${(nextEpisode.episode ?? 1)}`}</div>
          </div>
          <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={onNextEpisode}>
            <SkipForward size={16} /> Play
          </button>
        </div>
      )}

      {/* Player Chrome & Controls Overlay */}
      <div className={`player-overlay ${controlsVisible ? 'visible' : ''}`}>
        {/* Top Header */}
        <div className="player-top-bar">
          <button
            onClick={onClose}
            className="player-icon-btn"
            style={{ background: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: '50%' }}
            title="Back"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="player-title-info" style={{ marginLeft: 16, flex: 1 }}>
            <span className="player-title-main">{title}</span>
            {subTitle && <span className="player-title-sub">{subTitle}</span>}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {links.length > 1 && (
              <button
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                onClick={() => setShowServerMenu(!showServerMenu)}
              >
                Server: {activeLink?.name || `Server ${currentLinkIndex + 1}`}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="player-controls-bottom">
          {/* Timeline Bar */}
          <div className="timeline-slider-box" onClick={handleSeekSlider}>
            <div className="timeline-slider-track">
              <div
                className="timeline-slider-fill"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="player-btn-row">
            <div className="player-btn-group">
              <button onClick={togglePlay} className="player-icon-btn" title="Play/Pause (Space/K)">
                {isPlaying ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" />}
              </button>

              <button onClick={() => seek(-10)} className="player-icon-btn" title="Seek -10s (←)">
                <RotateCcw size={20} />
              </button>

              <button onClick={() => seek(10)} className="player-icon-btn" title="Seek +10s (→)">
                <RotateCw size={20} />
              </button>

              {onNextEpisode && (
                <button onClick={onNextEpisode} className="player-icon-btn" title="Next Episode (N)">
                  <SkipForward size={22} />
                </button>
              )}

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted
                      setIsMuted(!isMuted)
                    }
                  }}
                  className="player-icon-btn"
                  title="Mute (M)"
                >
                  {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    if (videoRef.current) {
                      videoRef.current.volume = v
                      videoRef.current.muted = false
                    }
                    setVolume(v)
                    setIsMuted(false)
                  }}
                  style={{ width: 80, accentColor: 'var(--accent-red)', cursor: 'pointer' }}
                />
              </div>

              {/* Time display */}
              <span style={{ fontSize: '0.9rem', color: '#e5e7eb', marginLeft: 12 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="player-btn-group">
              {/* Quality Selector */}
              {availableQualities.length > 1 && (
                <select
                  value={currentQuality}
                  onChange={(e) => {
                    const q = parseInt(e.target.value)
                    setCurrentQuality(q)
                    if (hlsRef.current) {
                      hlsRef.current.currentLevel = q
                    }
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '0.85rem',
                  }}
                >
                  {availableQualities.map((q) => (
                    <option key={q.index} value={q.index} style={{ background: '#111625' }}>
                      {q.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Subtitles toggle */}
              <button
                onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                className="player-icon-btn"
                title="Subtitles (C)"
              >
                <Subtitles size={20} color={selectedSubUrl ? 'var(--accent-red)' : '#fff'} />
              </button>

              {/* Aspect ratio */}
              <button
                onClick={() => {
                  const next = aspectRatio === 'contain' ? 'fill' : aspectRatio === 'fill' ? 'cover' : 'contain'
                  setAspectRatio(next)
                }}
                className="player-icon-btn"
                title={`Aspect Ratio: ${aspectRatio}`}
              >
                <Tv size={20} />
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="player-icon-btn"
                title="Playback Settings"
              >
                <Settings size={20} />
              </button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="player-icon-btn" title="Fullscreen (F)">
                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle Selection Modal */}
      {showSubtitleMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 80,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            width: 280,
            zIndex: 150,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#fff' }}>
            Subtitles & Timing
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            <button
              onClick={() => {
                setSelectedSubUrl('')
                setShowSubtitleMenu(false)
              }}
              style={{
                background: !selectedSubUrl ? 'var(--accent-red)' : 'transparent',
                border: 'none',
                color: '#fff',
                padding: '6px 10px',
                textAlign: 'left',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Off
            </button>
            {subtitles.map((sub, idx) => (
              <button
                key={`${sub.lang}_${idx}`}
                onClick={() => {
                  setSelectedSubUrl(sub.url)
                  setShowSubtitleMenu(false)
                }}
                style={{
                  background: selectedSubUrl === sub.url ? 'var(--accent-red)' : 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 10px',
                  textAlign: 'left',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {sub.lang}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Sync Offset: {subOffsetSeconds.toFixed(1)}s
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSubOffsetSeconds((s) => s - 0.5)}
                style={{ flex: 1, padding: '4px', background: 'var(--bg-surface-elevated)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }}
              >
                -0.5s
              </button>
              <button
                onClick={() => setSubOffsetSeconds(0)}
                style={{ flex: 1, padding: '4px', background: 'var(--bg-surface-elevated)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }}
              >
                Reset
              </button>
              <button
                onClick={() => setSubOffsetSeconds((s) => s + 0.5)}
                style={{ flex: 1, padding: '4px', background: 'var(--bg-surface-elevated)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }}
              >
                +0.5s
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Speed, Audio) */}
      {showSettingsMenu && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 40,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            width: 240,
            zIndex: 150,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: '#fff' }}>
            Playback Settings
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Speed:</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPlaybackSpeed(s)
                    if (videoRef.current) videoRef.current.playbackRate = s
                  }}
                  style={{
                    background: playbackSpeed === s ? 'var(--accent-red)' : 'var(--bg-surface-elevated)',
                    border: 'none',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {audioTracks.length > 1 && (
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Audio Track:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {audioTracks.map((t) => (
                  <button
                    key={t.index}
                    onClick={() => {
                      setCurrentAudioTrack(t.index)
                      if (hlsRef.current) hlsRef.current.audioTrack = t.index
                    }}
                    style={{
                      background: currentAudioTrack === t.index ? 'var(--accent-red)' : 'transparent',
                      border: 'none',
                      color: '#fff',
                      padding: '6px',
                      borderRadius: 4,
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
