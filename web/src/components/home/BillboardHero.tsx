import React from 'react'
import type { SearchResponseDTO } from '../../types/media'
import { Play, Info, Star } from 'lucide-react'

interface BillboardHeroProps {
  item: SearchResponseDTO
  onPlay: (item: SearchResponseDTO) => void
  onDetails: (item: SearchResponseDTO) => void
}

export const BillboardHero: React.FC<BillboardHeroProps> = ({ item, onPlay, onDetails }) => {
  const backdrop = item.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80'

  return (
    <div
      className="billboard-hero"
      style={{ backgroundImage: `url(${backdrop})` }}
    >
      <div className="billboard-gradient" />

      <div className="billboard-content">
        <div className="billboard-badge">
          <span>FEATURED SPOTLIGHT</span>
        </div>

        <h1 className="billboard-title">{item.name}</h1>

        <div className="billboard-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 600 }}>
            <Star size={15} fill="#f59e0b" />
            8.9
          </span>
          <span>{item.year || '2025'}</span>
          <span style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
            {item.quality || '4K ULTRA HD'}
          </span>
          <span>{item.type || 'Movie'}</span>
          <span>{item.apiName}</span>
        </div>

        <p className="billboard-plot">
          Experience breathtaking cinema quality, multi-language audio, and seamless adaptive streaming directly within CloudStream Web Edition.
        </p>

        <div className="billboard-actions">
          <button className="btn-primary" onClick={() => onPlay(item)}>
            <Play size={18} fill="#fff" />
            Play Now
          </button>
          <button className="btn-secondary" onClick={() => onDetails(item)}>
            <Info size={18} />
            More Details
          </button>
        </div>
      </div>
    </div>
  )
}
