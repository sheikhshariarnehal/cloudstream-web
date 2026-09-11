import React, { useState, useEffect, useRef } from 'react'
import type { ProviderInfoDTO, SearchResponseDTO } from '../../types/media'
import { getQuickSearch } from '../../api/catalogApi'
import { Search, Film, Layers, Bookmark, Settings, X, Globe, RefreshCw } from 'lucide-react'

interface NavbarProps {
  currentTab: string
  onTabChange: (tab: string) => void
  providers: ProviderInfoDTO[]
  selectedProvider?: string
  onSelectProvider: (providerName: string) => void
  onSelectMedia: (item: SearchResponseDTO) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  providers,
  selectedProvider,
  onSelectProvider,
  onSelectMedia,
}) => {
  const [quickSearchText, setQuickSearchText] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResponseDTO[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!quickSearchText.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await getQuickSearch(quickSearchText, selectedProvider)
        setSuggestions(results)
        setShowDropdown(true)
      } catch (err) {
        console.error('Quick search error', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [quickSearchText, selectedProvider])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="cinema-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div className="cinema-logo" onClick={() => onTabChange('home')}>
          <span className="cinema-logo-badge">CS3</span>
          <span style={{ background: 'linear-gradient(90deg, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CloudStream <span style={{ color: 'var(--accent-red)', WebkitTextFillColor: 'var(--accent-red)', fontSize: '0.85rem', fontWeight: 600 }}>WEB</span>
          </span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-link-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            <Film size={16} />
            Home
          </button>
          <button
            className={`nav-link-btn ${currentTab === 'search' ? 'active' : ''}`}
            onClick={() => onTabChange('search')}
          >
            <Search size={16} />
            Discover
          </button>
          <button
            className={`nav-link-btn ${currentTab === 'library' ? 'active' : ''}`}
            onClick={() => onTabChange('library')}
          >
            <Bookmark size={16} />
            Library
          </button>
          <button
            className={`nav-link-btn ${currentTab === 'plugins' ? 'active' : ''}`}
            onClick={() => onTabChange('plugins')}
          >
            <Layers size={16} />
            Extensions
          </button>
          <button
            className={`nav-link-btn ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* QuickSearch input */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              gap: 8,
              width: 260,
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Instant search..."
              value={quickSearchText}
              onChange={(e) => setQuickSearchText(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                outline: 'none',
                width: '100%',
                fontSize: '0.9rem',
              }}
            />
            {isSearching && <RefreshCw size={13} className="spin" color="var(--accent-red)" />}
            {quickSearchText && !isSearching && (
              <button
                onClick={() => setQuickSearchText('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                left: 0,
                right: 0,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-card)',
                zIndex: 100,
                maxHeight: 360,
                overflowY: 'auto',
              }}
            >
              {suggestions.map((item, idx) => (
                <div
                  key={`${item.apiName}_${item.url}_${idx}`}
                  onClick={() => {
                    setShowDropdown(false)
                    setQuickSearchText('')
                    onSelectMedia(item)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <img
                    src={item.posterUrl || ''}
                    alt={item.name}
                    style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4, background: '#1e293b' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.year ? `${item.year} · ` : ''}
                      {item.type || 'Media'} · {item.apiName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Provider Selector */}
        {Array.isArray(providers) && providers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={16} color="var(--accent-red)" />
            <select
              value={selectedProvider}
              onChange={(e) => onSelectProvider(e.target.value)}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {providers.map((p) => (
                <option key={p.name} value={p.name} style={{ background: '#111625' }}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </nav>
  )
}
