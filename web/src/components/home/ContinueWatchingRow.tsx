import React, { useEffect, useState } from 'react'
import type { WatchProgressItem } from '../../types/media'
import { getAllContinueWatching } from '../../services/db'
import { Play, Clock, X } from 'lucide-react'
import { db } from '../../services/db'

interface ContinueWatchingRowProps {
  onResume: (item: WatchProgressItem) => void
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({ onResume }) => {
  const [items, setItems] = useState<WatchProgressItem[]>([])

  const loadItems = async () => {
    const list = await getAllContinueWatching()
    setItems(list)
  }

  useEffect(() => {
    loadItems()
  }, [])

  const removeItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await db.progress.delete(id)
    loadItems()
  }

  if (items.length === 0) return null

  return (
    <section className="shelf-section">
      <div className="shelf-header">
        <h2 className="shelf-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={20} color="var(--accent-red)" />
          Continue Watching
        </h2>
      </div>

      <div className="shelf-carousel-container">
        <div className="shelf-carousel">
          {items.map((item) => {
            const percent = item.durationSeconds > 0
              ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
              : 0

            return (
              <div
                key={item.id}
                className="media-card"
                style={{ flex: '0 0 220px' }}
                onClick={() => onResume(item)}
              >
                <div className="media-poster-box" style={{ aspectRatio: '16 / 9' }}>
                  <img
                    src={item.posterUrl || 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=500&auto=format&fit=crop&q=60'}
                    alt={item.mediaName}
                    className="media-poster-img"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(229, 9, 20, 0.9)',
                        borderRadius: '50%',
                        padding: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      }}
                    >
                      <Play size={18} fill="#fff" />
                    </div>
                  </div>

                  <button
                    onClick={(e) => removeItem(e, item.id)}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      padding: 4,
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                    title="Remove from history"
                  >
                    <X size={14} />
                  </button>

                  <div className="media-progress-bar-container">
                    <div className="media-progress-bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <h3 className="media-title-text">{item.mediaName}</h3>
                <div className="media-sub-text">
                  <span>
                    {item.season ? `S${item.season}` : ''}
                    {item.episode ? ` E${item.episode}` : ''}
                    {item.episodeTitle ? ` - ${item.episodeTitle}` : ''}
                  </span>
                  <span>{percent}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
