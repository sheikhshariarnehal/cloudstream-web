import React, { useState, useEffect } from 'react'
import type { LoadResponseDTO, WatchStatus } from '../../types/media'
import { Play, Bookmark, Star, Calendar, Clock, Check, ChevronDown } from 'lucide-react'
import { saveBookmark, removeBookmark, db } from '../../services/db'

interface MediaHeroProps {
  media: LoadResponseDTO
  onPlayFirstEpisode: () => void
}

export const MediaHero: React.FC<MediaHeroProps> = ({ media, onPlayFirstEpisode }) => {
  const [currentStatus, setCurrentStatus] = useState<WatchStatus | 'none'>('none')
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const backdrop = media.backgroundPosterUrl || media.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80'

  useEffect(() => {
    const loadBookmark = async () => {
      const existing = await db.bookmarks.get(media.url)
      if (existing) {
        setCurrentStatus(existing.status)
      } else {
        setCurrentStatus('none')
      }
    }
    loadBookmark()
  }, [media.url])

  const handleSetStatus = async (status: WatchStatus | 'none') => {
    if (status === 'none') {
      await removeBookmark(media.url)
      setCurrentStatus('none')
    } else {
      await saveBookmark({
        url: media.url,
        name: media.name,
        apiName: media.apiName,
        posterUrl: media.posterUrl,
        type: media.type,
        status,
        updatedAt: Date.now(),
      })
      setCurrentStatus(status)
    }
    setShowStatusMenu(false)
  }

  const statusLabels: Record<WatchStatus, string> = {
    watching: 'Watching',
    plan_to_watch: 'Plan to Watch',
    completed: 'Completed',
    on_hold: 'On Hold',
    dropped: 'Dropped',
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 460,
        backgroundImage: `url(${backdrop})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '48px 48px 36px 48px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="billboard-gradient" />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          gap: 36,
          alignItems: 'flex-end',
          maxWidth: 1200,
          width: '100%',
        }}
      >
        {/* Poster Card */}
        <div
          style={{
            flex: '0 0 200px',
            aspectRatio: '2 / 3',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-glow)',
            border: '2px solid rgba(255,255,255,0.1)',
            background: '#111625',
          }}
        >
          <img
            src={media.posterUrl || backdrop}
            alt={media.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Info Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <span className="billboard-badge">{media.type}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
              {media.apiName}
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.15, marginBottom: 14 }}>
            {media.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            {media.rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 700 }}>
                <Star size={16} fill="#f59e0b" />
                {(media.rating / 10).toFixed(1)} / 10
              </span>
            )}
            {media.year && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={15} />
                {media.year}
              </span>
            )}
            {media.duration && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={15} />
                {media.duration}
              </span>
            )}
            {media.status && (
              <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                {media.status}
              </span>
            )}
          </div>

          {media.tags && media.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {media.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    color: '#e5e7eb',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p style={{ fontSize: '0.95rem', color: '#d1d5db', lineHeight: 1.6, maxWidth: 820, marginBottom: 24 }}>
            {media.plot || 'No synopsis available for this media title.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <button className="btn-primary" onClick={onPlayFirstEpisode}>
              <Play size={18} fill="#fff" />
              Watch Now
            </button>

            {/* Watchlist Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
              >
                <Bookmark size={18} fill={currentStatus !== 'none' ? 'var(--accent-red)' : 'transparent'} />
                {currentStatus !== 'none' ? statusLabels[currentStatus] : 'Add to List'}
                <ChevronDown size={14} />
              </button>

              {showStatusMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 50,
                    left: 0,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 100,
                    width: 190,
                    overflow: 'hidden',
                  }}
                >
                  {(Object.keys(statusLabels) as WatchStatus[]).map((status) => (
                    <div
                      key={status}
                      onClick={() => handleSetStatus(status)}
                      style={{
                        padding: '10px 14px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: currentStatus === status ? 'var(--bg-surface-hover)' : 'transparent',
                        color: currentStatus === status ? 'var(--accent-red)' : '#fff',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = currentStatus === status ? 'var(--bg-surface-hover)' : 'transparent')}
                    >
                      {statusLabels[status]}
                      {currentStatus === status && <Check size={14} />}
                    </div>
                  ))}

                  {currentStatus !== 'none' && (
                    <div
                      onClick={() => handleSetStatus('none')}
                      style={{
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        color: '#ef4444',
                        borderTop: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      Remove from List
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
