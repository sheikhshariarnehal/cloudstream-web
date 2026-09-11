import React, { useState } from 'react'
import type { EpisodeDTO } from '../../types/media'
import { Play, Sparkles } from 'lucide-react'

interface SeasonEpisodePickerProps {
  episodes: EpisodeDTO[]
  onSelectEpisode: (ep: EpisodeDTO) => void
  currentPlayingEpisodeData?: string
}

export const SeasonEpisodePicker: React.FC<SeasonEpisodePickerProps> = ({
  episodes,
  onSelectEpisode,
  currentPlayingEpisodeData,
}) => {
  // Extract unique seasons
  const seasonNumbers = Array.from(
    new Set(episodes.map((e) => e.season ?? 1))
  ).sort((a, b) => a - b)

  const [activeSeason, setActiveSeason] = useState<number>(
    seasonNumbers.length > 0 ? seasonNumbers[0] : 1
  )

  const filteredEpisodes = episodes.filter(
    (e) => (e.season ?? 1) === activeSeason
  )

  if (episodes.length === 0) {
    return (
      <div style={{ padding: '36px', color: 'var(--text-muted)', textAlign: 'center' }}>
        No episodes listed for this title. Click "Watch Now" above to start streaming.
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
          Episodes ({episodes.length})
        </h2>

        {/* Season Tabs */}
        {seasonNumbers.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {seasonNumbers.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSeason(s)}
                className={`provider-chip ${activeSeason === s ? 'active' : ''}`}
                style={{ fontSize: '0.9rem', padding: '6px 16px' }}
              >
                Season {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Episode Cards Grid / List */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {filteredEpisodes.map((ep, idx) => {
          const isPlaying = currentPlayingEpisodeData === ep.data
          const epNum = ep.episode ?? (idx + 1)
          const fallbackThumb = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'

          return (
            <div
              key={`${ep.season}_${ep.episode}_${idx}`}
              onClick={() => onSelectEpisode(ep)}
              style={{
                background: isPlaying ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                border: isPlaying ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                if (!isPlaying) {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isPlaying) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                }
              }}
            >
              {/* Thumbnail with play icon */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#111625' }}>
                <img
                  src={ep.posterUrl || fallbackThumb}
                  alt={ep.name || `Episode ${epNum}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: isPlaying ? 'rgba(229,9,20,0.3)' : 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      background: isPlaying ? 'var(--accent-red)' : 'rgba(0,0,0,0.7)',
                      borderRadius: '50%',
                      padding: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Play size={16} fill="#fff" />
                  </div>
                </div>

                {ep.isFiller && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(234, 179, 8, 0.9)',
                      color: '#000',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Sparkles size={10} /> FILLER
                  </span>
                )}
              </div>

              {/* Title and Synopsis */}
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 700 }}>
                    EPISODE {epNum}
                  </span>
                  {ep.date && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ep.date}
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ep.name || `Episode ${epNum}`}
                </h4>

                {ep.synopsis && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ep.synopsis}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
