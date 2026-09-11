import React from 'react'
import { Search, X, Filter } from 'lucide-react'

interface SearchBarProps {
  query: string
  onChangeQuery: (q: string) => void
  selectedType: string
  onSelectType: (type: string) => void
  isSearching: boolean
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChangeQuery,
  selectedType,
  onSelectType,
  isSearching,
}) => {
  const types = [
    { label: 'All', value: 'all' },
    { label: 'Movies', value: 'Movie' },
    { label: 'TV Shows', value: 'TvSeries' },
    { label: 'Anime', value: 'Anime' },
    { label: 'Asian Drama', value: 'AsianDrama' },
  ]

  return (
    <div style={{ padding: '28px 36px 12px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 22px',
          gap: 14,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <Search size={22} color="var(--accent-red)" />
        <input
          type="text"
          placeholder="Search movies, TV series, anime, actors across all providers..."
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            outline: 'none',
            width: '100%',
            fontSize: '1.15rem',
            fontFamily: 'inherit',
          }}
          autoFocus
        />
        {query && (
          <button
            onClick={() => onChangeQuery('')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Filter size={14} /> Filter:
        </span>
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => onSelectType(t.value)}
            className={`provider-chip ${selectedType === t.value ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
        {isSearching && (
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-red)', marginLeft: 'auto', fontWeight: 600 }}>
            Searching providers in parallel...
          </span>
        )}
      </div>
    </div>
  )
}
