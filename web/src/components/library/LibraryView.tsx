import React, { useState, useEffect } from 'react'
import type { BookmarkItem, SearchResponseDTO, WatchStatus } from '../../types/media'
import { getBookmarksByStatus, removeBookmark } from '../../services/db'
import { Bookmark, Trash2, Clock } from 'lucide-react'

interface LibraryViewProps {
  onSelectMedia: (item: SearchResponseDTO) => void
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectMedia }) => {
  const [activeStatus, setActiveStatus] = useState<WatchStatus>('watching')
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])

  const loadBookmarks = async (status: WatchStatus) => {
    const list = await getBookmarksByStatus(status)
    setBookmarks(list)
  }

  useEffect(() => {
    loadBookmarks(activeStatus)
  }, [activeStatus])

  const handleDelete = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation()
    await removeBookmark(url)
    loadBookmarks(activeStatus)
  }

  const statusTabs: { label: string; value: WatchStatus }[] = [
    { label: 'Watching', value: 'watching' },
    { label: 'Plan to Watch', value: 'plan_to_watch' },
    { label: 'Completed', value: 'completed' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Dropped', value: 'dropped' },
  ]

  return (
    <div style={{ padding: '32px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bookmark size={28} color="var(--accent-red)" /> My Library
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={`provider-chip ${activeStatus === tab.value ? 'active' : ''}`}
            style={{ fontSize: '0.95rem', padding: '8px 20px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {bookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
          <Clock size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>No Bookmarks in this list</h3>
          <p style={{ fontSize: '0.9rem' }}>Add movies and series to your watchlist from the details page.</p>
        </div>
      ) : (
        <div className="media-grid" style={{ padding: 0 }}>
          {bookmarks.map((b) => (
            <div
              key={b.url}
              className="media-card"
              onClick={() =>
                onSelectMedia({
                  name: b.name,
                  url: b.url,
                  apiName: b.apiName,
                  posterUrl: b.posterUrl,
                  type: b.type,
                })
              }
            >
              <div className="media-poster-box">
                <img
                  src={b.posterUrl || 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=500&auto=format&fit=crop&q=60'}
                  alt={b.name}
                  className="media-poster-img"
                />
                <button
                  onClick={(e) => handleDelete(e, b.url)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    padding: 6,
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <h3 className="media-title-text">{b.name}</h3>
              <div className="media-sub-text">
                <span>{b.apiName}</span>
                <span>{b.type || 'Media'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
