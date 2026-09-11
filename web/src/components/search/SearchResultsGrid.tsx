import React from 'react'
import type { SearchResponseDTO } from '../../types/media'
import { MediaCard } from '../common/MediaCard'
import { Film } from 'lucide-react'

interface SearchResultsGridProps {
  results: SearchResponseDTO[]
  onSelectMedia: (item: SearchResponseDTO) => void
  isSearching: boolean
}

export const SearchResultsGrid: React.FC<SearchResultsGridProps> = ({
  results,
  onSelectMedia,
  isSearching,
}) => {
  if (results.length === 0 && !isSearching) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
        <Film size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>No Results Found</h3>
        <p style={{ fontSize: '0.9rem' }}>Try searching for a different movie, series, or anime title.</p>
      </div>
    )
  }

  return (
    <div className="media-grid">
      {results.map((item, idx) => (
        <MediaCard
          key={`${item.apiName}_${item.url}_${idx}`}
          item={item}
          onClick={() => onSelectMedia(item)}
        />
      ))}
    </div>
  )
}
