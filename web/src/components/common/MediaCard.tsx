import React from 'react'
import type { SearchResponseDTO } from '../../types/media'
import { Star, Film, Tv } from 'lucide-react'

interface MediaCardProps {
  item: SearchResponseDTO
  progressPercent?: number
  onClick?: () => void
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, progressPercent, onClick }) => {
  const fallbackPoster = 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=500&auto=format&fit=crop&q=60'

  return (
    <div className="media-card" onClick={onClick}>
      <div className="media-poster-box">
        <img
          src={item.posterUrl || fallbackPoster}
          alt={item.name}
          className="media-poster-img"
          loading="lazy"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = fallbackPoster
          }}
        />

        {item.quality && (
          <span className="media-quality-badge">{item.quality}</span>
        )}

        {typeof progressPercent === 'number' && progressPercent > 0 && (
          <div className="media-progress-bar-container">
            <div
              className="media-progress-bar-fill"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        )}
      </div>

      <h3 className="media-title-text" title={item.name}>
        {item.name}
      </h3>

      <div className="media-sub-text">
        <span>
          {item.type === 'TvSeries' || item.type === 'Anime' ? (
            <Tv size={12} style={{ display: 'inline', marginRight: 4 }} />
          ) : (
            <Film size={12} style={{ display: 'inline', marginRight: 4 }} />
          )}
          {item.year || item.apiName}
        </span>

        {item.id && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#f59e0b' }}>
            <Star size={11} fill="#f59e0b" />
          </span>
        )}
      </div>
    </div>
  )
}
