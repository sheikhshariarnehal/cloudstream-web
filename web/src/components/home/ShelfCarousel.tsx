import React, { useRef } from 'react'
import type { SearchResponseDTO } from '../../types/media'
import { MediaCard } from '../common/MediaCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ShelfCarouselProps {
  title: string
  items: SearchResponseDTO[]
  onSelectMedia: (item: SearchResponseDTO) => void
}

export const ShelfCarousel: React.FC<ShelfCarouselProps> = ({ title, items, onSelectMedia }) => {
  const carouselRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -480 : 480
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (!items || items.length === 0) return null

  return (
    <section className="shelf-section">
      <div className="shelf-header">
        <h2 className="shelf-title">{title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => scroll('left')}
            className="player-icon-btn"
            style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '50%', padding: 8 }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="player-icon-btn"
            style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '50%', padding: 8 }}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="shelf-carousel-container">
        <div className="shelf-carousel" ref={carouselRef}>
          {items.map((item, idx) => (
            <MediaCard
              key={`${item.apiName}_${item.url}_${idx}`}
              item={item}
              onClick={() => onSelectMedia(item)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
